import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cheoxokdpgbjgfdghhzt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')

  try {
    // Si se pasa un orderId específico, consultar esa orden real
    if (orderId && orderId !== 'mock' && orderId.length > 5) {
      const { data: order, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle()

      if (order && !error) {
        return NextResponse.json({
          hasOffer: true,
          offer: {
            id: order.id,
            code: order.order_code || `V-${order.id.slice(0, 4).toUpperCase()}`,
            originName: order.pickup_contact_name || order.merchant_name || 'Punto de Recolección',
            originAddress: order.pickup_address || 'Dirección de Recolección',
            destinationName: order.delivery_contact_name || order.customer_name || 'Cliente',
            destinationAddress: order.delivery_address || 'Dirección de Entrega',
            earnings: order.driver_fee || order.delivery_fee || 0,
            paymentMethod: order.payment_method || 'CASH',
            distanceKm: order.distance_km || 0,
            status: order.status
          }
        })
      }
    }

    // Si no hay orderId o no existe, consultar si hay alguna orden en estado 'PENDING' o 'ASSIGNING'
    const { data: latestPending } = await supabase
      .from('service_orders')
      .select('*')
      .in('status', ['PENDING', 'ASSIGNING', 'READY_FOR_PICKUP'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestPending) {
      return NextResponse.json({
        hasOffer: true,
        offer: {
          id: latestPending.id,
          code: latestPending.order_code || `V-${latestPending.id.slice(0, 4).toUpperCase()}`,
          originName: latestPending.pickup_contact_name || latestPending.merchant_name || 'Punto de Recolección',
          originAddress: latestPending.pickup_address || 'Dirección de Recolección',
          destinationName: latestPending.delivery_contact_name || latestPending.customer_name || 'Cliente',
          destinationAddress: latestPending.delivery_address || 'Dirección de Entrega',
          earnings: latestPending.driver_fee || latestPending.delivery_fee || 0,
          paymentMethod: latestPending.payment_method || 'CASH',
          distanceKm: latestPending.distance_km || 0,
          status: latestPending.status
        }
      })
    }

    // Si la base de datos está limpia y no hay viajes activos
    return NextResponse.json({
      hasOffer: false,
      offer: null,
      message: 'No hay ofertas de viaje activas en este momento.'
    })
  } catch (error: any) {
    return NextResponse.json({
      hasOffer: false,
      offer: null,
      error: error.message
    })
  }
}
