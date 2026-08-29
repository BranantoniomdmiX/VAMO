import { NextResponse, type NextRequest } from 'next/server'
import { vamoDispatchEngine } from '@/lib/services/vamoDispatchEngine'

export const dynamic = 'force-dynamic'

interface AcceptRequestBody {
  orderId: string
  driverId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AcceptRequestBody = await request.json()
    const { orderId, driverId } = body

    // 1. Validaciones básicas de entrada
    if (!orderId || !driverId) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_INPUT',
          message: 'Se requieren los campos orderId y driverId obligatorios.'
        },
        { status: 400 }
      )
    }

    // 2. Ejecutar la asignación atómica en PostgreSQL Dokploy (Row-Level Lock)
    const result = await vamoDispatchEngine.acceptOrderAtomic(orderId, driverId)

    // 3. Manejo de respuesta según resultado del bloqueo
    if (!result.success) {
      // 409 Conflict si la orden ya fue tomada por otro conductor
      const statusCode = result.code === 'ORDER_ALREADY_TAKEN' ? 409 : 400
      return NextResponse.json(result, { status: statusCode })
    }

    // 4. Éxito: El conductor ganó la asignación
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error inesperado al procesar la asignación del pedido.'
      },
      { status: 500 }
    )
  }
}
