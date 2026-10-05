import { NextResponse, type NextRequest } from 'next/server'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'

export const dynamic = 'force-dynamic'

interface KdsStatusRequestBody {
  orderId: string
  status: 'PENDING' | 'ACCEPTED_BIZ' | 'CONFIRMED' | 'PREPARING' | 'READY_BIZ' | 'READY_FOR_PICKUP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
}

export async function POST(request: NextRequest) {
  try {
    const body: KdsStatusRequestBody = await request.json().catch(() => ({}))
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', message: 'Se requieren orderId y status obligatorios.' },
        { status: 400 }
      )
    }

    // Ejecutar todo el flujo dentro de una transacción con contexto RLS coherente
    const result = await withTrustedAuthContext(async (authContext, client) => {
      // 1. Verificar rol autorizado (merchant, superadmin, master)
      if (!['merchant', 'superadmin', 'master'].includes(authContext.role)) {
        return {
          status: 403,
          payload: {
            success: false,
            code: 'FORBIDDEN_ROLE',
            message: 'Solo los comercios o superadministradores pueden actualizar el estado de cocina.'
          }
        }
      }

      // 2. Si es merchant, validar que la orden pertenezca a su propio comercio bajo RLS
      if (authContext.role === 'merchant') {
        const orderCheck = await client.query<{ merchant_id: string }>(
          'SELECT merchant_id FROM public.orders WHERE id = $1;',
          [orderId]
        )

        if (orderCheck.rows.length === 0) {
          return {
            status: 404,
            payload: { success: false, code: 'ORDER_NOT_FOUND', message: 'Pedido no encontrado.' }
          }
        }

        if (orderCheck.rows[0].merchant_id !== authContext.merchantId) {
          return {
            status: 403,
            payload: {
              success: false,
              code: 'FORBIDDEN_MERCHANT_MISMATCH',
              message: 'No tiene autorización para modificar comandas de otro comercio.'
            }
          }
        }
      }

      // 3. Ejecutar función autorizada de KDS bajo RLS
      const res = await client.query<{ update_kds_order_status: any }>(
        'SELECT public.update_kds_order_status($1, $2) as update_kds_order_status;',
        [orderId, status]
      )

      const kdsResult = res.rows[0]?.update_kds_order_status

      if (!kdsResult?.success) {
        return {
          status: 400,
          payload: kdsResult || { success: false, message: 'No fue posible actualizar la comanda.' }
        }
      }

      return {
        status: 200,
        payload: kdsResult
      }
    })

    if (!result) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'Sesión no válida o ausente.' },
        { status: 401 }
      )
    }

    return NextResponse.json(result.payload, { status: result.status })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: error.message || 'Error actualizando estado KDS.' },
      { status: 500 }
    )
  }
}
