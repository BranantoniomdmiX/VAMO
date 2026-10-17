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
        let queryStr = 'SELECT * FROM public.orders WHERE (id = $1 OR code = $1)'
        const queryParams: (string | number)[] = [orderId]

        // Restricción anti cross-franchise para roles no globales
        if (authContext.role !== 'superadmin' && authContext.role !== 'master' && authContext.franchiseId) {
          queryStr += ' AND (franchise_id = $2 OR franchise_id IS NULL)'
          queryParams.push(authContext.franchiseId)
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
            message: 'Pedido no encontrado o fuera de tu jurisdicción territorial.'
          }
        }
      }

      // 3. Buscar orden pendiente elegible para el conductor o despachador
      // 🛡️ Reglas Canónicas:
      // - Si es SCHEDULED: Solo elegible si dispatch_not_before IS NULL o <= NOW()
      // - OWN_FLEET: Solo elegible para choferes vinculados al comercio
      // - HYBRID_OVERFLOW: Solo elegible para choferes de red si overflow_after_at IS NULL o <= NOW()
      let pendingQuery = `
        SELECT * FROM public.orders 
        WHERE status IN ('PENDING', 'ACCEPTED_BIZ', 'PREPARING', 'READY_BIZ', 'READY_FOR_PICKUP')
          AND driver_id IS NULL
          AND (schedule_type = 'ASAP' OR dispatch_not_before IS NULL OR dispatch_not_before <= NOW())
          AND (
            fleet_mode = 'VAMO_NETWORK'
            OR (fleet_mode = 'HYBRID_OVERFLOW' AND (overflow_after_at IS NULL OR overflow_after_at <= NOW()))
          )
      `
      const pendingParams: (string | number)[] = []

      if (authContext.role !== 'superadmin' && authContext.role !== 'master' && authContext.franchiseId) {
        pendingQuery += ' AND (franchise_id = $1 OR franchise_id IS NULL)'
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
