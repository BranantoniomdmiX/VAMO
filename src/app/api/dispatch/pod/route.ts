import { NextResponse, type NextRequest } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTrustedAuthContext } from '@/lib/auth/contextResolver'

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
    const authContext = await getTrustedAuthContext()
    if (!authContext) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'Sesión no válida o ausente.' },
        { status: 401 }
      )
    }

    if (!['driver', 'superadmin', 'master'].includes(authContext.role)) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN_ROLE', message: 'Solo los conductores asignados o superadministradores pueden registrar la entrega POD.' },
        { status: 403 }
      )
    }

    const body: PodRequestBody = await request.json().catch(() => ({}))
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

    // Validar que el chofer autenticado sea el asignado a esta orden
    if (authContext.role === 'driver') {
      const orderCheck = await query<{ driver_id: string }>(
        'SELECT driver_id FROM public.orders WHERE id = $1;',
        [orderId]
      )

      if (orderCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, code: 'ORDER_NOT_FOUND', message: 'Pedido no encontrado.' },
          { status: 404 }
        )
      }

      if (orderCheck.rows[0].driver_id !== authContext.userId) {
        return NextResponse.json(
          { success: false, code: 'FORBIDDEN_WRONG_DRIVER', message: 'No es el conductor asignado a esta orden.' },
          { status: 403 }
        )
      }
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
