import { NextRequest, NextResponse } from 'next/server'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

interface StopPayload {
  stopType: 'PICKUP' | 'DROPOFF' | 'WAYPOINT'
  address: string
  lat: number
  lng: number
  contactName?: string
  contactPhone?: string
  notes?: string
}

interface CreateOrderPayload {
  orderType?: 'DIRECT' | 'PURCHASE' | 'MULTI_STOP'
  scheduleType?: 'ASAP' | 'SCHEDULED'
  fleetMode?: 'VAMO_NETWORK' | 'OWN_FLEET' | 'HYBRID_OVERFLOW'
  originAddress: string
  destinationAddress: string
  originLat?: number
  originLng?: number
  destinationLat?: number
  destinationLng?: number
  distanceKm?: number
  merchantId?: string
  paymentMethod?: 'CASH' | 'CARD' | 'OXXO_CASH' | 'SPEI'
  notes?: string
  pickupWindowStart?: string
  pickupWindowEnd?: string
  deliveryWindowStart?: string
  deliveryWindowEnd?: string
  stops?: StopPayload[]
}

function calculateAuthoritativeDistance(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number,
  clientReportedKm?: number
): number {
  if (lat1 != null && lon1 != null && lat2 != null && lon2 != null) {
    const R = 6371 // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const km = R * c
    return Math.max(0.5, Math.round(km * 10) / 10)
  }

  if (clientReportedKm && clientReportedKm > 0 && clientReportedKm < 100) {
    return Math.round(clientReportedKm * 10) / 10
  }

  // Fallback seguro de distancia mínima
  return 3.5
}

function calculateAuthoritativePricing(distanceKm: number, extraStopsCount: number = 0) {
  // Hipótesis configurable autorizada: Base $35 + $8 por km + $15 por parada extra
  const baseFee = 35.0
  const perKmRate = 8.0
  const perStopFee = 15.0
  const deliveryFee = Math.round((baseFee + distanceKm * perKmRate + extraStopsCount * perStopFee) * 100) / 100
  const subtotal = deliveryFee
  const total = deliveryFee
  return { deliveryFee, subtotal, total }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderPayload = await req.json().catch(() => ({}))
    const {
      orderType = 'DIRECT',
      scheduleType = 'ASAP',
      fleetMode = 'VAMO_NETWORK',
      originAddress,
      destinationAddress,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      distanceKm: reportedKm,
      merchantId,
      paymentMethod = 'CASH',
      pickupWindowStart,
      pickupWindowEnd,
      deliveryWindowStart,
      deliveryWindowEnd,
      stops = [],
      notes
    } = body

    if (!originAddress || !destinationAddress) {
      return NextResponse.json(
        { success: false, error: 'Se requieren originAddress y destinationAddress.' },
        { status: 400 }
      )
    }

    const authResult = await withTrustedAuthContext(async (authContext, client) => {
      // 1. Derivar identidad autoritativa
      const customerId = authContext.userId
      let franchiseId = authContext.franchiseId

      // Si el cliente no tiene franquicia asignada, buscar la franquicia activa por defecto
      if (!franchiseId) {
        const fRes = await client.query<{ id: string }>(
          'SELECT id FROM public.franchises WHERE status = $1 ORDER BY created_at ASC LIMIT 1;',
          ['ACTIVE']
        )
        if (fRes.rows.length > 0) {
          franchiseId = fRes.rows[0].id
        }
      }

      // 2. Calcular distancia y precios en servidor
      const distance = calculateAuthoritativeDistance(
        originLat,
        originLng,
        destinationLat,
        destinationLng,
        reportedKm
      )
      const extraStops = stops.length > 2 ? stops.length - 2 : 0
      const { deliveryFee, subtotal, total } = calculateAuthoritativePricing(distance, extraStops)

      // 3. Generar código y PIN criptográfico (4 dígitos aleatorios seguros)
      const randomDigits = Math.floor(1000 + Math.random() * 9000).toString()
      const orderCode = `V-${randomDigits}`
      const pinCode = crypto.randomInt(1000, 9999).toString()

      // 4. Derivación estricta de ventanas temporales para órdenes programadas
      let dispatchNotBefore: string | null = null
      let dispatchDeadline: string | null = null
      let overflowAfterAt: string | null = null
      const operationalBufferMs = 15 * 60 * 1000 // 15 minutos de margen operativo configurable

      if (scheduleType === 'SCHEDULED') {
        if (pickupWindowStart) {
          const pickupTime = new Date(pickupWindowStart).getTime()
          dispatchNotBefore = new Date(pickupTime - operationalBufferMs).toISOString()
          dispatchDeadline = pickupWindowEnd ? new Date(pickupWindowEnd).toISOString() : new Date(pickupTime).toISOString()
        } else if (deliveryWindowStart) {
          // Estimación de duración de ruta basada en velocidad promedio urbana (25 km/h = 2.4 min/km)
          const estimatedRouteMinutes = Math.max(10, Math.round(distance * 2.4))
          const deliveryTime = new Date(deliveryWindowStart).getTime()
          const totalBufferMs = (estimatedRouteMinutes * 60 * 1000) + operationalBufferMs
          dispatchNotBefore = new Date(deliveryTime - totalBufferMs).toISOString()
          dispatchDeadline = deliveryWindowEnd ? new Date(deliveryWindowEnd).toISOString() : new Date(deliveryTime).toISOString()
        }
      }

      // En modo híbrido, el desborde hacia la Red VAMO ocurre tras 5 minutos de no aceptación por flota propia
      if (fleetMode === 'HYBRID_OVERFLOW') {
        const baseOverflowTime = dispatchNotBefore ? new Date(dispatchNotBefore).getTime() : Date.now()
        overflowAfterAt = new Date(baseOverflowTime + (5 * 60 * 1000)).toISOString()
      }

      // 5. Crear orden directamente en public.orders
      const insertRes = await client.query<{
        id: string
        code: string
        status: string
        total: string
        delivery_fee: string
        pin_code: string
        order_type: string
        schedule_type: string
        fleet_mode: string
      }>(
        `INSERT INTO public.orders (
          customer_id,
          merchant_id,
          franchise_id,
          code,
          status,
          order_type,
          schedule_type,
          fleet_mode,
          origin_address,
          origin_lat,
          origin_lng,
          destination_address,
          destination_lat,
          destination_lng,
          distance_km,
          subtotal,
          delivery_fee,
          total,
          payment_method,
          payment_status,
          pin_code,
          pickup_window_start,
          pickup_window_end,
          delivery_window_start,
          delivery_window_end,
          dispatch_not_before,
          dispatch_deadline,
          overflow_after_at,
          notes
        ) VALUES (
          $1, $2, $3, $4, 'PENDING', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'PENDING', $19,
          $20, $21, $22, $23, $24, $25, $26, $27
        ) RETURNING id, code, status, total, delivery_fee, pin_code, order_type, schedule_type, fleet_mode;`,
        [
          customerId,
          merchantId || null,
          franchiseId,
          orderCode,
          orderType,
          scheduleType,
          fleetMode,
          originAddress,
          originLat || null,
          originLng || null,
          destinationAddress,
          destinationLat || null,
          destinationLng || null,
          distance,
          subtotal,
          deliveryFee,
          total,
          paymentMethod,
          pinCode,
          pickupWindowStart || null,
          pickupWindowEnd || null,
          deliveryWindowStart || null,
          deliveryWindowEnd || null,
          dispatchNotBefore,
          dispatchDeadline,
          overflowAfterAt,
          notes || null
        ]
      )

      const created = insertRes.rows[0]

      // 6. Si se especificaron paradas o es multiparada, registrarlas en public.order_stops
      if (stops && stops.length > 0) {
        for (let i = 0; i < stops.length; i++) {
          const stop = stops[i]
          await client.query(
            `INSERT INTO public.order_stops (
              order_id, sequence_index, stop_type, address, lat, lng, contact_name, contact_phone, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
            [
              created.id,
              i + 1,
              stop.stopType,
              stop.address,
              stop.lat,
              stop.lng,
              stop.contactName || null,
              stop.contactPhone || null,
              stop.notes || null
            ]
          )
        }
      }

      return {
        status: 201,
        body: {
          success: true,
          orderId: created.id,
          code: created.code,
          orderType: created.order_type,
          scheduleType: created.schedule_type,
          fleetMode: created.fleet_mode,
          total: parseFloat(created.total),
          deliveryFee: parseFloat(created.delivery_fee),
          distanceKm: distance,
          status: created.status,
          pinCode: created.pin_code,
          dispatchNotBefore
        }
      }
    })

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Debe iniciar sesión para crear un pedido.' },
        { status: 401 }
      )
    }

    return NextResponse.json(authResult.body, { status: authResult.status })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error interno al crear pedido.'
    console.error('Error al crear orden en public.orders:', error)
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}
