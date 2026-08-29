import { NextResponse, type NextRequest } from 'next/server'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', message: 'Se requiere el orderId.' },
        { status: 400 }
      )
    }

    const res = await query<{ process_order_settlement: any }>(
      'SELECT public.process_order_settlement($1) as process_order_settlement;',
      [orderId]
    )

    const result = res.rows[0]?.process_order_settlement

    if (!result?.success) {
      return NextResponse.json(result || { success: false, message: 'Error de liquidación.' }, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: error.message || 'Error al liquidar el pedido.' },
      { status: 500 }
    )
  }
}
