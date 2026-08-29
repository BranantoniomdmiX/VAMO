import { NextResponse, type NextRequest } from 'next/server'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

interface KdsStatusRequestBody {
  orderId: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
}

export async function POST(request: NextRequest) {
  try {
    const body: KdsStatusRequestBody = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', message: 'Se requieren orderId y status obligatorios.' },
        { status: 400 }
      )
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
