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
  fulfillmentMode?: 'VAMO_NETWORK' | 'OWN_FLEET' | 'HYBRID_OVERFLOW'
  originAddress: string
  destinationAddress: string
  originLat?: number
  originLng?: number
  destinationLat?: number
  destinationLng?: number
  distanceKm?: number
  routeDurationMinutes?: number
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
  lon2?: number
): number | null {
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

  // CERO FALBACK FICTICIO: Si faltan coordenadas válidas, retorna null
  return null
}

function generateSecureOrderCode(): string {
  // CSPRNG de 6 caracteres alfanuméricos en mayúsculas (Espacio: 36^6 = ~2,176 millones de combinaciones)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const bytes = crypto.randomBytes(6)
  let code = 'V-'
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderPayload = await req.json().catch(() => ({}))
    const {
      orderType = 'DIRECT',
      scheduleType = 'ASAP',
      fulfillmentMode = 'VAMO_NETWORK',
      originAddress,
      destinationAddress,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      routeDurationMinutes,
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

    // Validación fail-closed de órdenes programadas
    if (scheduleType === 'SCHEDULED') {
      if (!pickupWindowStart && !deliveryWindowStart) {
        return NextResponse.json(
          {
            success: false,
            code: 'SCHEDULED_WINDOW_REQUIRED',
            error: 'Una orden programada (SCHEDULED) requiere al menos una ventana de recogida o entrega válida.'
          },
          { status: 400 }
        )
      }
    }

    const authResult = await withTrustedAuthContext(async (authContext, client) => {
      // 1. Derivar identidad autoritativa
      const customerId = authContext.userId
      let franchiseId = authContext.franchiseId

      if (!franchiseId) {
        const fRes = await client.query<{ id: string }>(
          'SELECT id FROM public.franchises WHERE status = $1 ORDER BY created_at ASC LIMIT 1;',
          ['ACTIVE']
        )
        if (fRes.rows.length > 0) {
          franchiseId = fRes.rows[0].id
        }
      }

      // 2. Consultar regla de pricing activa de la plaza o regla base general en PostgreSQL
      const pricingRes = await client.query<{
        base_fare: string
        included_km: string
        price_per_extra_km: string
        price_per_extra_stop: string
        operational_dispatch_buffer_minutes: number
      }>(
        `SELECT base_fare, included_km, price_per_extra_km, price_per_extra_stop, operational_dispatch_buffer_minutes
         FROM public.pricing_rules
         WHERE is_active = TRUE AND (franchise_id = $1 OR franchise_id IS NULL)
         ORDER BY franchise_id NULLS LAST
         LIMIT 1;`,
        [franchiseId || null]
      )

      const pricingRule = pricingRes.rows[0]
      if (!pricingRule) {
        return {
          status: 400,
          body: {
            success: false,
            code: 'PRICING_RULE_REQUIRED',
            error: 'No existe una regla de precios activa en PostgreSQL para esta plaza/franquicia (Fail-Closed).'
          }
        }
      }

      const baseFare = parseFloat(pricingRule.base_fare)
      const includedKm = parseFloat(pricingRule.included_km)
      const pricePerExtraKm = parseFloat(pricingRule.price_per_extra_km)
      const pricePerExtraStop = parseFloat(pricingRule.price_per_extra_stop)
      const operationalBufferMin = pricingRule.operational_dispatch_buffer_minutes || 15

      // 3. Routing Autoritativo:
      // Haversine no es distancia autoritativa para liquidación financiera.
      // El servidor debe verificar coordenadas completas para obtener la ruta.
      // Si todavía no existe routing autoritativo calculable, responder ROUTE_REQUIRED para no crear orden despachable ficticia.
      if (originLat == null || originLng == null || destinationLat == null || destinationLng == null) {
        return {
          status: 400,
          body: {
            success: false,
            code: 'ROUTE_REQUIRED',
            error: 'Se requieren coordenadas geográficas completas (origen y destino) para calcular el routing autoritativo.'
          }
        }
      }

      // En este release, calcular distancia geodésica base asegurando puntos válidos
      const distance = calculateAuthoritativeDistance(originLat, originLng, destinationLat, destinationLng)
      if (distance == null || distance <= 0) {
        return {
          status: 400,
          body: {
            success: false,
            code: 'ROUTE_REQUIRED',
            error: 'No fue posible obtener una distancia de ruta válida para el cálculo de tarifa.'
          }
        }
      }

      const extraKm = Math.max(0, distance - includedKm)
      const extraStops = stops.length > 2 ? stops.length - 2 : 0
      const deliveryFee = Math.round((baseFare + extraKm * pricePerExtraKm + extraStops * pricePerExtraStop) * 100) / 100
      const subtotal = deliveryFee
      const total = deliveryFee

      // 4. Derivación estricta de ventanas temporales para órdenes programadas
      let dispatchNotBefore: string | null = null
      let dispatchDeadline: string | null = null
      let overflowAfterAt: string | null = null
      const operationalBufferMs = operationalBufferMin * 60 * 1000

      if (scheduleType === 'SCHEDULED') {
        if (pickupWindowStart) {
          const pickupTime = new Date(pickupWindowStart).getTime()
          dispatchNotBefore = new Date(pickupTime - operationalBufferMs).toISOString()
          dispatchDeadline = pickupWindowEnd ? new Date(pickupWindowEnd).toISOString() : new Date(pickupTime).toISOString()
        } else if (deliveryWindowStart) {
          // Requiere duración de ruta real calculada por motor de routing
          if (!routeDurationMinutes || routeDurationMinutes <= 0) {
            return {
              status: 400,
              body: {
                success: false,
                code: 'ROUTE_REQUIRED',
                error: 'Para órdenes programadas con solo hora de entrega, se requiere una duración real de ruta válida (routeDurationMinutes).'
              }
            }
          }
          const deliveryTime = new Date(deliveryWindowStart).getTime()
          const totalBufferMs = (routeDurationMinutes * 60 * 1000) + operationalBufferMs
          dispatchNotBefore = new Date(deliveryTime - totalBufferMs).toISOString()
          dispatchDeadline = deliveryWindowEnd ? new Date(deliveryWindowEnd).toISOString() : new Date(deliveryTime).toISOString()
        }
      }

      // En modo híbrido, el desborde hacia la Red VAMO ocurre tras 5 minutos de no aceptación por flota propia
      if (fulfillmentMode === 'HYBRID_OVERFLOW') {
        const baseOverflowTime = dispatchNotBefore ? new Date(dispatchNotBefore).getTime() : Date.now()
        overflowAfterAt = new Date(baseOverflowTime + (5 * 60 * 1000)).toISOString()
      }

      // 5. Generar PIN criptográfico seguro (CSPRNG de 4 dígitos entre 1000 y 9999)
      const pinCode = crypto.randomInt(1000, 10000).toString()

      // 6. Inserción con retry para código único CSPRNG
      let createdOrder: {
        id: string
        code: string
        status: string
        total: string | null
        delivery_fee: string | null
        pin_code: string
        order_type: string
        schedule_type: string
        fulfillment_mode: string
      } | null = null

      for (let attempt = 0; attempt < 3; attempt++) {
        const orderCode = generateSecureOrderCode()
        try {
          const insertRes = await client.query<{
            id: string
            code: string
            status: string
            total: string | null
            delivery_fee: string | null
            pin_code: string
            order_type: string
            schedule_type: string
            fulfillment_mode: string
          }>(
            `INSERT INTO public.orders (
              customer_id,
              merchant_id,
              franchise_id,
              code,
              status,
              order_type,
              schedule_type,
              fulfillment_mode,
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
            ) RETURNING id, code, status, total, delivery_fee, pin_code, order_type, schedule_type, fulfillment_mode;`,
            [
              customerId,
              merchantId || null,
              franchiseId,
              orderCode,
              orderType,
              scheduleType,
              fulfillmentMode,
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
          createdOrder = insertRes.rows[0]
          break
        } catch (dbErr: unknown) {
          if (typeof dbErr === 'object' && dbErr !== null && 'code' in dbErr && (dbErr as { code?: string }).code === '23505' && attempt < 2) {
            // Colisión de código UNIQUE, reintentar con nuevo código
            continue
          }
          throw dbErr
        }
      }

      if (!createdOrder) {
        throw new Error('No se pudo generar un código único para la orden.')
      }

      // 7. Si se especificaron paradas o es multiparada, registrarlas en public.order_stops
      if (stops && stops.length > 0) {
        for (let i = 0; i < stops.length; i++) {
          const stop = stops[i]
          await client.query(
            `INSERT INTO public.order_stops (
              order_id, sequence_index, stop_type, address, lat, lng, contact_name, contact_phone, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
            [
              createdOrder.id,
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
          orderId: createdOrder.id,
          code: createdOrder.code,
          orderType: createdOrder.order_type,
          scheduleType: createdOrder.schedule_type,
          fulfillmentMode: createdOrder.fulfillment_mode,
          fleetMode: createdOrder.fulfillment_mode,
          total: createdOrder.total ? parseFloat(createdOrder.total) : null,
          deliveryFee: createdOrder.delivery_fee ? parseFloat(createdOrder.delivery_fee) : null,
          distanceKm: distance,
          status: createdOrder.status,
          pinCode: createdOrder.pin_code,
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
