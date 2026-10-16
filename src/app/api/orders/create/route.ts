import { NextRequest, NextResponse } from 'next/server'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

interface CreateOrderPayload {
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

function calculateAuthoritativePricing(distanceKm: number) {
  // Fórmula operativa autorizada VAMO: Base $35 + $8 por km
  const baseFee = 35.0
  const perKmRate = 8.0
  const deliveryFee = Math.round((baseFee + distanceKm * perKmRate) * 100) / 100
  const subtotal = deliveryFee
  const total = deliveryFee
  return { deliveryFee, subtotal, total }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderPayload = await req.json().catch(() => ({}))
    const {
      originAddress,
      destinationAddress,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      distanceKm: reportedKm,
      merchantId,
      paymentMethod = 'CASH'
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

      // 2. Calcular distancia y precios en servidor (Browser NO es autoridad financiera)
      const distance = calculateAuthoritativeDistance(
        originLat,
        originLng,
        destinationLat,
        destinationLng,
        reportedKm
      )
      const { deliveryFee, subtotal, total } = calculateAuthoritativePricing(distance)

      // 3. Generar código y PIN criptográfico
      const randomDigits = Math.floor(1000 + Math.random() * 9000).toString()
      const orderCode = `V-${randomDigits}`
      const pinCode = crypto.randomInt(1000, 9999).toString()

      // 4. Crear orden directamente en public.orders
      const insertRes = await client.query<{
        id: string
        code: string
        status: string
        total: string
        delivery_fee: string
        pin_code: string
      }>(
        `INSERT INTO public.orders (
          customer_id,
          merchant_id,
          franchise_id,
          code,
          status,
          origin_address,
          destination_address,
          distance_km,
          subtotal,
          delivery_fee,
          total,
          payment_method,
          payment_status,
          pin_code
        ) VALUES (
          $1, $2, $3, $4, 'PENDING', $5, $6, $7, $8, $9, $10, $11, 'PENDING', $12
        ) RETURNING id, code, status, total, delivery_fee, pin_code;`,
        [
          customerId,
          merchantId || null,
          franchiseId,
          orderCode,
          originAddress,
          destinationAddress,
          distance,
          subtotal,
          deliveryFee,
          total,
          paymentMethod,
          pinCode
        ]
      )

      const created = insertRes.rows[0]

      return {
        status: 201,
        body: {
          success: true,
          orderId: created.id,
          code: created.code,
          total: parseFloat(created.total),
          deliveryFee: parseFloat(created.delivery_fee),
          distanceKm: distance,
          status: created.status,
          pinCode: created.pin_code
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
