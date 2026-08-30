import { createClient } from '@/lib/supabase/client'
import { Service, ServiceType } from '@/types/database.types'

export async function createServiceFromBase(data: {
  tenantId: string
  customerName: string
  phone: string
  originAddress: string
  destinationAddress: string
  totalPrice: number
  serviceType: ServiceType
}) {
  const supabase = createClient()

  // Generar código de servicio único (ej: VAMO-9482)
  const serviceCode = `VAMO-${Math.floor(1000 + Math.random() * 9000)}`

  const { data: newService, error } = await supabase
    .from('services')
    .insert({
      tenant_id: data.tenantId,
      service_code: serviceCode,
      origin_address: data.originAddress,
      destination_address: data.destinationAddress,
      total_price: data.totalPrice,
      service_type: data.serviceType,
      status: 'CONFIRMADO',
      payment_method: 'CASH',
      payment_status: 'PENDING'
    })
    .select()
    .single()

  if (error) {
    console.error('Error al crear servicio:', error)
    return { success: false, error: error.message }
  }

  return { success: true, service: newService }
}

export async function getCustomerServices(userId?: string) {
  const supabase = createClient()
  try {
    let query = supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
      
    if (userId) {
      query = query.eq('customer_id', userId)
    }

    const { data, error } = await query
    if (error) {
      console.warn('No se pudieron obtener pedidos recientes del cliente:', error.message)
      return []
    }
    return (data || []) as Service[]
  } catch (err) {
    console.warn('Excepción al consultar servicios del cliente:', err)
    return []
  }
}

export async function getPendingRatingService(userId?: string) {
  const supabase = createClient()
  try {
    let query = supabase
      .from('services')
      .select('*, driver:drivers(*)')
      .eq('status', 'ENTREGADO')
      .is('customer_rating', null)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (userId) {
      query = query.eq('customer_id', userId)
    }

    const { data, error } = await query
    if (error || !data || data.length === 0) {
      return null
    }
    return data[0]
  } catch (err) {
    return null
  }
}
