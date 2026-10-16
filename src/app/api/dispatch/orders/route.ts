import { NextResponse } from 'next/server'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authResult = await withTrustedAuthContext(async (authContext, client) => {
      // 1. Roles autorizados: dispatcher, superadmin, master
      if (!['dispatcher', 'superadmin', 'master'].includes(authContext.role)) {
        return {
          status: 403,
          body: {
            success: false,
            code: 'FORBIDDEN_ROLE',
            message: `El rol ${authContext.role} no tiene permisos de despacho.`
          }
        }
      }

      // 2. Consultar órdenes activas desde public.orders
      let queryStr = `
        SELECT o.id, o.code, o.status, o.customer_id, o.driver_id, o.franchise_id,
               o.origin_address, o.destination_address, o.total, o.created_at,
               p_cust.full_name as customer_name,
               p_drv.full_name as driver_name
        FROM public.orders o
        LEFT JOIN public.profiles p_cust ON p_cust.id = o.customer_id
        LEFT JOIN public.profiles p_drv ON p_drv.id = o.driver_id
        WHERE o.status IN ('PENDING', 'ACCEPTED_BIZ', 'CONFIRMED', 'PREPARING', 'READY_BIZ', 'READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'IN_TRANSIT')
      `
      const params: (string | number)[] = []

      // Multi-tenant: Despachador sólo ve su franquicia
      if (authContext.role !== 'superadmin' && authContext.role !== 'master' && authContext.franchiseId) {
        queryStr += ' AND (o.franchise_id = $1 OR o.franchise_id IS NULL)'
        params.push(authContext.franchiseId)
      }

      queryStr += ' ORDER BY o.created_at DESC LIMIT 50;'

      const res = await client.query(queryStr, params)

      // 3. Obtener conductores disponibles en la franquicia para asignación
      let drvQuery = `
        SELECT d.id, d.status, p.full_name
        FROM public.drivers d
        JOIN public.profiles p ON p.id = d.id
        WHERE d.status IN ('AVAILABLE', 'BUSY')
      `
      const drvParams: (string | number)[] = []
      if (authContext.role !== 'superadmin' && authContext.role !== 'master' && authContext.franchiseId) {
        drvQuery += ' AND (d.franchise_id = $1 OR d.franchise_id IS NULL)'
        drvParams.push(authContext.franchiseId)
      }
      drvQuery += ' LIMIT 20;'

      const drvRes = await client.query(drvQuery, drvParams)

      const orders = res.rows.map(o => {
        const isAssigned = o.driver_id != null || ['DRIVER_ASSIGNED', 'IN_TRANSIT'].includes(o.status)
        const elapsed = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 1000)

        return {
          id: o.code || `V-${o.id.slice(0, 4).toUpperCase()}`,
          orderId: o.id,
          origin: o.origin_address || 'Origen',
          destination: o.destination_address || 'Destino',
          customer: o.customer_name || 'Cliente VAMO',
          status: isAssigned ? 'assigned' : 'unassigned',
          driver: o.driver_name || undefined,
          driverId: o.driver_id || undefined,
          canonicalStatus: o.status,
          elapsedSeconds: elapsed,
          primaryFleet: 'Flota Centro Titular',
          overflowFleet: 'Flota Galery Norte'
        }
      })

      const availableDrivers = drvRes.rows.map(d => ({
        id: d.id,
        name: d.full_name || `Conductor ${d.id.slice(0, 4)}`,
        status: d.status
      }))

      return {
        status: 200,
        body: {
          success: true,
          orders,
          drivers: availableDrivers
        }
      }
    })

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Debe iniciar sesión para acceder a despacho.' },
        { status: 401 }
      )
    }

    return NextResponse.json(authResult.body, { status: authResult.status })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error interno al consultar despacho.'
    console.error('Error al consultar lista de despacho:', error)
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}
