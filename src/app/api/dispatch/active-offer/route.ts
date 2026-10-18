import { NextResponse, type NextRequest } from 'next/server'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    const authResult = await withTrustedAuthContext(async (authContext, client) => {
      // 1. Roles autorizados: driver, dispatcher, superadmin, master
      if (!['driver', 'dispatcher', 'superadmin', 'master'].includes(authContext.role)) {
        return {
          status: 403,
          body: {
            hasOffer: false,
            code: 'FORBIDDEN_ROLE',
            message: `El rol ${authContext.role} no tiene permisos para consultar ofertas de despacho.`
          }
        }
      }

      // 2. Si se solicitó un orderId específico
      if (orderId && orderId !== 'mock' && orderId.length > 5) {
        // Distinguir UUID vs Code de forma segura para evitar error de inferencia de tipos en PostgreSQL
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
        let queryStr = isUuid
          ? 'SELECT * FROM public.orders WHERE id = $1::uuid'
          : 'SELECT * FROM public.orders WHERE code = $1'
        const queryParams: (string | number | null)[] = [orderId]

        // 🛡️ REGLA: Ninguna orden con distance_km, delivery_fee o total NULL puede ser ofertada
        queryStr += ' AND distance_km IS NOT NULL AND delivery_fee IS NOT NULL AND total IS NOT NULL'

        // Restricción anti cross-franchise para roles no globales
        if (authContext.role !== 'superadmin' && authContext.role !== 'master' && authContext.franchiseId) {
          queryStr += ` AND (franchise_id = $${queryParams.length + 1} OR franchise_id IS NULL)`
          queryParams.push(authContext.franchiseId)
        }

        // Restricción de flota y horario para choferes consultando por orderId
        if (authContext.role === 'driver') {
          // Obtener empleador del conductor si pertenece a flota propia
          const driverRes = await client.query<{ employer_merchant_id: string | null }>(
            'SELECT employer_merchant_id FROM public.drivers WHERE id = $1 LIMIT 1;',
            [authContext.userId]
          )
          const driverEmployerId = driverRes.rows[0]?.employer_merchant_id || null

          // Si es SCHEDULED: Solo elegible cuando dispatch_not_before IS NOT NULL AND dispatch_not_before <= NOW()
          // dispatch_not_before = NULL es fail-closed.
          queryStr += ` AND (
            (
              (schedule_type = 'ASAP')
              OR (schedule_type = 'SCHEDULED' AND dispatch_not_before IS NOT NULL AND dispatch_not_before <= NOW())
            )
            AND (
              fulfillment_mode = 'VAMO_NETWORK'
              OR (
                fulfillment_mode = 'OWN_FLEET'
                AND $${queryParams.length + 1}::uuid IS NOT NULL 
                AND merchant_id = $${queryParams.length + 1}::uuid
              )
              OR (
                fulfillment_mode = 'HYBRID_OVERFLOW'
                AND (
                  (overflow_after_at IS NOT NULL AND overflow_after_at <= NOW())
                  OR ($${queryParams.length + 1}::uuid IS NOT NULL AND merchant_id = $${queryParams.length + 1}::uuid)
                )
              )
            )
          )`
          queryParams.push(driverEmployerId)
        }

        const res = await client.query(queryStr, queryParams)
        const order = res.rows[0]

        if (order) {
          return {
            status: 200,
            body: {
              hasOffer: true,
              offer: {
                id: order.id,
                code: order.code || `V-${order.id.slice(0, 4).toUpperCase()}`,
                originName: order.origin_address || 'Punto de Recolección',
                originAddress: order.origin_address || 'Dirección de Recolección',
                destinationName: order.destination_address || 'Cliente',
                destinationAddress: order.destination_address || 'Dirección de Entrega',
                earnings: parseFloat(order.delivery_fee) || 0,
                paymentMethod: order.payment_method || 'CASH',
                distanceKm: parseFloat(order.distance_km) || 0,
                status: order.status
              }
            }
          }
        }

        return {
          status: 404,
          body: {
            hasOffer: false,
            offer: null,
            message: 'Pedido no encontrado o fuera de tu jurisdicción/flota autorizada.'
          }
        }
      }

      // 3. Buscar orden pendiente elegible para el conductor o despachador
      // 🛡️ Reglas Canónicas:
      // - Status: 'PENDING', 'CONFIRMED', 'ACCEPTED_BIZ', 'PREPARING', 'READY_BIZ', 'READY_FOR_PICKUP'
      // - Si es SCHEDULED: Solo elegible si dispatch_not_before <= NOW()
      // - OWN_FLEET: Conductor de flota propia (employer_merchant_id = orders.merchant_id) puede verla durante toda la ventana.
      // - HYBRID_OVERFLOW: Conductor de flota propia puede verla desde el inicio; Conductor de Red VAMO solo si overflow_after_at <= NOW().
      // - VAMO_NETWORK: Conductor de red y choferes disponibles.
      
      let driverEmployerId: string | null = null
      if (authContext.role === 'driver') {
        const driverRes = await client.query<{ employer_merchant_id: string | null }>(
          'SELECT employer_merchant_id FROM public.drivers WHERE id = $1 LIMIT 1;',
          [authContext.userId]
        )
        driverEmployerId = driverRes.rows[0]?.employer_merchant_id || null
      }

      let pendingQuery = `
        SELECT * FROM public.orders 
        WHERE status IN ('PENDING', 'CONFIRMED', 'ACCEPTED_BIZ', 'PREPARING', 'READY_BIZ', 'READY_FOR_PICKUP')
          AND driver_id IS NULL
          AND distance_km IS NOT NULL 
          AND delivery_fee IS NOT NULL 
          AND total IS NOT NULL
          AND (
            (schedule_type = 'ASAP')
            OR (schedule_type = 'SCHEDULED' AND dispatch_not_before IS NOT NULL AND dispatch_not_before <= NOW())
          )
          AND (
            fulfillment_mode = 'VAMO_NETWORK'
            OR (
              fulfillment_mode = 'OWN_FLEET'
              AND $1::uuid IS NOT NULL AND merchant_id = $1::uuid
            )
            OR (
              fulfillment_mode = 'HYBRID_OVERFLOW'
              AND (
                (overflow_after_at IS NOT NULL AND overflow_after_at <= NOW())
                OR ($1::uuid IS NOT NULL AND merchant_id = $1::uuid)
              )
            )
          )
      `
      const pendingParams: (string | number | null)[] = [driverEmployerId]

      if (authContext.role !== 'superadmin' && authContext.role !== 'master' && authContext.franchiseId) {
        pendingQuery += ` AND (franchise_id = $${pendingParams.length + 1} OR franchise_id IS NULL)`
        pendingParams.push(authContext.franchiseId)
      }

      pendingQuery += ' ORDER BY created_at DESC LIMIT 1;'

      const pendingRes = await client.query(pendingQuery, pendingParams)
      const latestPending = pendingRes.rows[0]

      if (latestPending) {
        return {
          status: 200,
          body: {
            hasOffer: true,
            offer: {
              id: latestPending.id,
              code: latestPending.code || `V-${latestPending.id.slice(0, 4).toUpperCase()}`,
              originName: latestPending.origin_address || 'Punto de Recolección',
              originAddress: latestPending.origin_address || 'Dirección de Recolección',
              destinationName: latestPending.destination_address || 'Cliente',
              destinationAddress: latestPending.destination_address || 'Dirección de Entrega',
              earnings: parseFloat(latestPending.delivery_fee) || 0,
              paymentMethod: latestPending.payment_method || 'CASH',
              distanceKm: parseFloat(latestPending.distance_km) || 0,
              status: latestPending.status
            }
          }
        }
      }

      return {
        status: 200,
        body: {
          hasOffer: false,
          offer: null,
          message: 'No hay ofertas de viaje activas en este momento.'
        }
      }
    })

    if (!authResult) {
      return NextResponse.json(
        {
          hasOffer: false,
          code: 'UNAUTHORIZED',
          message: 'Debe iniciar sesión para consultar ofertas activas.'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(authResult.body, { status: authResult.status })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error al consultar oferta activa.'
    return NextResponse.json(
      {
        hasOffer: false,
        offer: null,
        error: errorMsg
      },
      { status: 500 }
    )
  }
}
