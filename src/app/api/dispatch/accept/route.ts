import { NextResponse, type NextRequest } from 'next/server'
import { vamoDispatchEngine } from '@/lib/services/vamoDispatchEngine'
import { getTrustedAuthContext } from '@/lib/auth/contextResolver'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

interface AcceptRequestBody {
  orderId: string
  driverId?: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. Obtener contexto de autenticación confiable del servidor
    const authContext = await getTrustedAuthContext()
    if (!authContext) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Sesión no válida o ausente. Debe autenticarse para aceptar pedidos.'
        },
        { status: 401 }
      )
    }

    // 2. Verificar rol autorizado (driver, dispatcher, superadmin)
    if (!['driver', 'dispatcher', 'superadmin', 'master'].includes(authContext.role)) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_ROLE',
          message: `El rol ${authContext.role} no tiene permisos para aceptar o asignar pedidos.`
        },
        { status: 403 }
      )
    }

    const body: AcceptRequestBody = await request.json().catch(() => ({}))
    const { orderId, driverId: requestedDriverId } = body

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_INPUT',
          message: 'Se requiere el campo orderId obligatorio.'
        },
        { status: 400 }
      )
    }

    // 3. Determinar driverId confiable:
    // Si el actor es un driver, el driverId DEBE ser forzosamente su propia identidad autenticada.
    // Prohibido suplantar o representar a otro driver.
    let effectiveDriverId = authContext.userId
    if (authContext.role === 'driver') {
      if (requestedDriverId && requestedDriverId !== authContext.userId) {
        return NextResponse.json(
          {
            success: false,
            code: 'FORBIDDEN_DRIVER_IMPERSONATION',
            message: 'Un conductor no puede aceptar pedidos en representación de otro conductor.'
          },
          { status: 403 }
        )
      }
      effectiveDriverId = authContext.userId
    } else if (['dispatcher', 'superadmin', 'master'].includes(authContext.role)) {
      // Dispatcher o Superadmin asignando a un conductor específico
      if (!requestedDriverId) {
        return NextResponse.json(
          {
            success: false,
            code: 'DRIVER_REQUIRED',
            message: 'El despachador debe especificar el conductor a asignar.'
          },
          { status: 400 }
        )
      }
      effectiveDriverId = requestedDriverId
    }

    // 4. Validar límite territorial y de franquicia (Anti Cross-Franchise)
    if (authContext.role !== 'superadmin' && authContext.role !== 'master') {
      const orderCheck = await query<{ franchise_id: string }>(
        'SELECT franchise_id FROM public.orders WHERE id = $1;',
        [orderId]
      )
      if (orderCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, code: 'ORDER_NOT_FOUND', message: 'Pedido no encontrado.' },
          { status: 404 }
        )
      }

      const orderFranchiseId = orderCheck.rows[0].franchise_id
      if (authContext.franchiseId && orderFranchiseId && authContext.franchiseId !== orderFranchiseId) {
        return NextResponse.json(
          {
            success: false,
            code: 'FORBIDDEN_FRANCHISE_MISMATCH',
            message: 'No está autorizado para aceptar pedidos de una franquicia o plaza ajena.'
          },
          { status: 403 }
        )
      }
    }

    // 5. Ejecutar la asignación atómica en PostgreSQL Dokploy con Row-Level Locking
    const result = await vamoDispatchEngine.acceptOrderAtomic(orderId, effectiveDriverId)

    if (!result.success) {
      const statusCode = result.code === 'ORDER_ALREADY_TAKEN' ? 409 : 400
      return NextResponse.json(result, { status: statusCode })
    }

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
