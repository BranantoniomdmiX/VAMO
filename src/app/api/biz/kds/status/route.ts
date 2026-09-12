import { NextResponse, type NextRequest } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTrustedAuthContext } from '@/lib/auth/contextResolver'

export const dynamic = 'force-dynamic'

interface KdsStatusRequestBody {
  orderId: string
  status: 'PENDING' | 'ACCEPTED_BIZ' | 'CONFIRMED' | 'PREPARING' | 'READY_BIZ' | 'READY_FOR_PICKUP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
}

export async function POST(request: NextRequest) {
  try {
    // 1. Obtener contexto de autenticación confiable
    const authContext = await getTrustedAuthContext()
    if (!authContext) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'Sesión no válida o ausente.' },
        { status: 401 }
      )
    }

    // 2. Verificar rol autorizado (merchant, superadmin)
    if (!['merchant', 'superadmin', 'master'].includes(authContext.role)) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN_ROLE', message: 'Solo los comercios o superadministradores pueden actualizar el estado de cocina.' },
        { status: 403 }
      )
    }

    const body: KdsStatusRequestBody = await request.json().catch(() => ({}))
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', message: 'Se requieren orderId y status obligatorios.' },
        { status: 400 }
      )
    }

    // 3. Si es merchant, validar que la orden pertenezca a su propio comercio
    if (authContext.role === 'merchant') {
      const orderCheck = await query<{ merchant_id: string }>(
        'SELECT merchant_id FROM public.orders WHERE id = $1;',
        [orderId]
      )

      if (orderCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, code: 'ORDER_NOT_FOUND', message: 'Pedido no encontrado.' },
          { status: 404 }
        )
      }

      if (orderCheck.rows[0].merchant_id !== authContext.merchantId) {
        return NextResponse.json(
          { success: false, code: 'FORBIDDEN_MERCHANT_MISMATCH', message: 'No tiene autorización para modificar comandas de otro comercio.' },
          { status: 403 }
        )
      }
    }

    const res = await query<{ update_kds_order_status: any }>(
      'SELECT public.update_kds_order_status($1, $2) as update_kds_order_status;',
      [orderId, status]
    )

    const result = res.rows[0]?.update_kds_order_status

    if (!result?.success) {
      return NextResponse.json(result || { success: false, message: 'No fue posible actualizar la comanda.' }, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: error.message || 'Error al actualizar el estado de cocina.' },
      { status: 500 }
    )
  }
}
