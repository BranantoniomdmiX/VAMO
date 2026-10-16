import { NextRequest, NextResponse } from 'next/server'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere orderId.' },
        { status: 400 }
      )
    }

    const authResult = await withTrustedAuthContext(async (authContext, client) => {
      // 1. Consultar orden desde public.orders
      const res = await client.query<{
        id: string
        code: string
        customer_id: string
        driver_id: string | null
        merchant_id: string | null
        franchise_id: string | null
        status: string
        origin_address: string
        destination_address: string
        distance_km: string
        subtotal: string
        delivery_fee: string
        total: string
        payment_method: string
        payment_status: string
        pin_code: string | null
        created_at: string
      }>(
        `SELECT id, code, customer_id, driver_id, merchant_id, franchise_id, status,
                origin_address, destination_address, distance_km, subtotal, delivery_fee, total,
                payment_method, payment_status, pin_code, created_at
         FROM public.orders
         WHERE id = $1 OR code = $1;`,
        [orderId]
      )

      if (res.rows.length === 0) {
        return {
          status: 404,
          body: { success: false, error: 'Pedido no encontrado.' }
        }
      }

      const order = res.rows[0]

      // 2. Control de acceso RLS:
      // Roles globales (superadmin, master) pueden ver cualquier orden
      // Dueño del pedido (customer_id == userId)
      // Conductor asignado (driver_id == userId)
      // Comercio de la orden (merchant_id == authContext.merchantId)
      // Despachador de la franquicia (franchise_id == authContext.franchiseId)
      const isGlobal = authContext.role === 'superadmin' || authContext.role === 'master'
      const isCustomerOwner = order.customer_id === authContext.userId
      const isAssignedDriver = order.driver_id === authContext.userId
      const isMerchantOwner = authContext.merchantId && order.merchant_id === authContext.merchantId
      const isFranchiseStaff = authContext.role === 'dispatcher' && (!order.franchise_id || order.franchise_id === authContext.franchiseId)

      if (!isGlobal && !isCustomerOwner && !isAssignedDriver && !isMerchantOwner && !isFranchiseStaff) {
        return {
          status: 403,
          body: { success: false, error: 'No está autorizado para consultar este pedido.' }
        }
      }

      // Regla de seguridad de PIN:
      // El cliente dueño y roles administrativos pueden ver el PIN.
      // El conductor NO debe recibir el PIN esperado en este endpoint.
      const shouldHidePin = authContext.role === 'driver' && !isCustomerOwner && !isGlobal

      return {
        status: 200,
        body: {
          success: true,
          order: {
            id: order.id,
            code: order.code,
            status: order.status,
            originAddress: order.origin_address,
            destinationAddress: order.destination_address,
            distanceKm: parseFloat(order.distance_km) || 0,
            subtotal: parseFloat(order.subtotal) || 0,
            deliveryFee: parseFloat(order.delivery_fee) || 0,
            total: parseFloat(order.total) || 0,
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            pinCode: shouldHidePin ? null : order.pin_code,
            customerId: order.customer_id,
            driverId: order.driver_id,
            merchantId: order.merchant_id,
            createdAt: order.created_at
          }
        }
      }
    })

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Debe iniciar sesión para consultar el pedido.' },
        { status: 401 }
      )
    }

    return NextResponse.json(authResult.body, { status: authResult.status })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error interno al consultar orden.'
    console.error('Error consultando orden:', error)
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}
