import { NextResponse } from 'next/server'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authResult = await withTrustedAuthContext(async (authContext, client) => {
      // 1. Validar roles con acceso a KDS
      if (!['merchant', 'superadmin', 'master'].includes(authContext.role)) {
        return {
          status: 403,
          body: {
            success: false,
            code: 'FORBIDDEN_ROLE',
            message: 'Solo comercios o administradores pueden acceder a comandas KDS.'
          }
        }
      }

      let queryStr = `
        SELECT o.id, o.code, o.status, o.customer_id, o.merchant_id, o.franchise_id,
               o.origin_address, o.destination_address, o.subtotal, o.total, o.created_at,
               p.full_name as customer_name
        FROM public.orders o
        LEFT JOIN public.profiles p ON p.id = o.customer_id
        WHERE o.status IN ('PENDING', 'ACCEPTED_BIZ', 'CONFIRMED', 'PREPARING', 'READY_BIZ', 'READY_FOR_PICKUP', 'IN_TRANSIT')
      `
      const params: (string | number)[] = []

      // Si es merchant, filtrar estrictamente por su merchant_id (Aislamiento Multi-Tenant)
      if (authContext.role === 'merchant') {
        if (!authContext.merchantId) {
          return {
            status: 200,
            body: { success: true, tickets: [] }
          }
        }
        queryStr += ' AND o.merchant_id = $1'
        params.push(authContext.merchantId)
      } else if (authContext.franchiseId && authContext.role !== 'superadmin' && authContext.role !== 'master') {
        queryStr += ' AND (o.franchise_id = $1 OR o.franchise_id IS NULL)'
        params.push(authContext.franchiseId)
      }

      queryStr += ' ORDER BY o.created_at DESC LIMIT 50;'

      const res = await client.query(queryStr, params)

      const tickets = res.rows.map(o => {
        let uiStatus: 'new' | 'preparing' | 'waiting_driver' | 'on_way' = 'new'
        if (o.status === 'PREPARING') uiStatus = 'preparing'
        else if (o.status === 'READY_BIZ' || o.status === 'READY_FOR_PICKUP') uiStatus = 'waiting_driver'
        else if (o.status === 'IN_TRANSIT') uiStatus = 'on_way'

        return {
          id: o.code || `V-${o.id.slice(0, 4).toUpperCase()}`,
          orderId: o.id,
          customer: o.customer_name || 'Cliente VAMO',
          items: [
            `Envío local: ${o.origin_address || 'Comercio'} ➔ ${o.destination_address || 'Cliente'}`
          ],
          status: uiStatus,
          canonicalStatus: o.status,
          time: new Date(o.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        }
      })

      return {
        status: 200,
        body: { success: true, tickets }
      }
    })

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Debe iniciar sesión para consultar comandas KDS.' },
        { status: 401 }
      )
    }

    return NextResponse.json(authResult.body, { status: authResult.status })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error interno al consultar KDS.'
    console.error('Error al listar comandas KDS:', error)
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}
