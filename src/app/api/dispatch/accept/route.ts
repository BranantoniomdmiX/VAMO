import { NextResponse, type NextRequest } from 'next/server'
import { vamoDispatchEngine } from '@/lib/services/vamoDispatchEngine'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'

export const dynamic = 'force-dynamic'

interface AcceptRequestBody {
  orderId: string
  driverId?: string
}

export async function POST(request: NextRequest) {
  try {
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

    const result = await withTrustedAuthContext(async (authContext, client) => {
      // 1. Verificar rol autorizado (driver, dispatcher, superadmin, master)
      if (!['driver', 'dispatcher', 'superadmin', 'master'].includes(authContext.role)) {
        return {
          status: 403,
          payload: {
            success: false,
            code: 'FORBIDDEN_ROLE',
            message: `El rol ${authContext.role} no tiene permisos para aceptar o asignar pedidos.`
          }
        }
      }

      // 2. Determinar driverId confiable:
      // Si el actor es un driver, el driverId DEBE ser forzosamente su propia identidad autenticada.
      // Prohibido suplantar o representar a otro driver.
      let effectiveDriverId = authContext.userId
      if (authContext.role === 'driver') {
        if (requestedDriverId && requestedDriverId !== authContext.userId) {
          return {
            status: 403,
            payload: {
              success: false,
              code: 'FORBIDDEN_DRIVER_IMPERSONATION',
              message: 'Un conductor no puede aceptar pedidos en representación de otro conductor.'
            }
          }
        }
        effectiveDriverId = authContext.userId
      } else if (['dispatcher', 'superadmin', 'master'].includes(authContext.role)) {
        // Dispatcher o Superadmin asignando a un conductor específico
        if (!requestedDriverId) {
          return {
            status: 400,
            payload: {
              success: false,
              code: 'DRIVER_REQUIRED',
              message: 'El despachador debe especificar el conductor a asignar.'
            }
          }
        }
        effectiveDriverId = requestedDriverId
      }

      // 3. Validar límite territorial y de franquicia (Anti Cross-Franchise)
      if (authContext.role !== 'superadmin' && authContext.role !== 'master') {
        const orderCheck = await client.query<{ franchise_id: string }>(
          'SELECT franchise_id FROM public.orders WHERE id = $1;',
          [orderId]
        )
        if (orderCheck.rows.length === 0) {
          return {
            status: 404,
            payload: { success: false, code: 'ORDER_NOT_FOUND', message: 'Pedido no encontrado.' }
          }
        }

        const orderFranchiseId = orderCheck.rows[0].franchise_id
        if (authContext.franchiseId && orderFranchiseId && authContext.franchiseId !== orderFranchiseId) {
          return {
            status: 403,
            payload: {
              success: false,
              code: 'FORBIDDEN_FRANCHISE_MISMATCH',
              message: 'No está autorizado para aceptar pedidos de una franquicia o plaza ajena.'
            }
          }
        }
      }

      // 4. Ejecutar la asignación atómica en PostgreSQL Dokploy dentro de la misma transacción
      const assignRes = await vamoDispatchEngine.acceptOrderAtomic(orderId, effectiveDriverId, client)

      if (!assignRes.success) {
        const statusCode = assignRes.code === 'ORDER_ALREADY_TAKEN' ? 409 : 400
        return {
          status: statusCode,
          payload: assignRes
        }
      }

      return {
        status: 200,
        payload: assignRes
      }
    })

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Sesión no válida o ausente. Debe autenticarse para aceptar pedidos.'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(result.payload, { status: result.status })
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
