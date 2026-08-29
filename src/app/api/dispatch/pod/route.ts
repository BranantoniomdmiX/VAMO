import { NextResponse, type NextRequest } from 'next/server'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

interface PodRequestBody {
  orderId: string
  pin?: string
  photoUrl?: string
  lat?: number
  lng?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: PodRequestBody = await request.json()
    const { orderId, pin, photoUrl, lat, lng } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', message: 'Se requiere el orderId.' },
        { status: 400 }
      )
    }

    if (!pin && !photoUrl) {
      return NextResponse.json(
        { success: false, code: 'PROOF_REQUIRED', message: 'Se requiere el PIN del cliente o la fotografía POD.' },
        { status: 400 }
      )
    }

    const res = await query<{ verify_order_pod: any }>(
      'SELECT public.verify_order_pod($1, $2, $3, $4, $5) as verify_order_pod;',
      [orderId, pin || null, photoUrl || null, lat || null, lng || null]
    )

    const result = res.rows[0]?.verify_order_pod

    if (!result?.success) {
      return NextResponse.json(result || { success: false, message: 'No fue posible validar la entrega.' }, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: error.message || 'Error al verificar la entrega.' },
      { status: 500 }
    )
  }
}
