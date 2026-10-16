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
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
      
    if (userId) {
      query = query.eq('customer_id', userId)
    }

    const { data, error } = await query
    if (error || !data || data.length === 0) {
      // Fallback a services si orders no tiene filas aún
      const { data: legacyData } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      return (legacyData || []) as Service[]
    }

    return (data as Array<Record<string, unknown>>).map((o) => ({
      id: String(o.id || ''),
      tenant_id: String(o.franchise_id || '00000000-0000-0000-0000-000000000001'),
      service_code: String(o.code || `V-${String(o.id || '').slice(0, 4)}`),
      customer_id: o.customer_id ? String(o.customer_id) : null,
      driver_id: o.driver_id ? String(o.driver_id) : null,
      service_type: 'DIRECT' as const,
      status: o.status === 'DELIVERED' ? ('ENTREGADO' as const) : ('CONFIRMADO' as const),
      origin_address: String(o.origin_address || 'Origen'),
      destination_address: String(o.destination_address || 'Destino'),
      distance_km: parseFloat(String(o.distance_km || 0)) || 0,
      total_price: parseFloat(String(o.total || 0)) || 0,
      driver_earnings: parseFloat(String(o.delivery_fee || 0)) || 0,
      company_earnings: 0,
      payment_method: 'CASH' as const,
      payment_status: String(o.payment_status || 'PENDING'),
      created_at: String(o.created_at || ''),
      updated_at: String(o.updated_at || '')
    })) as Service[]
  } catch (err) {
    console.warn('Excepción al consultar servicios del cliente:', err)
    return []
  }
}

export async function getPendingRatingService(userId?: string) {
  const supabase = createClient()
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('status', 'DELIVERED')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (userId) {
      query = query.eq('customer_id', userId)
    }

    const { data, error } = await query
    if (error || !data || data.length === 0) {
      return null
    }

    const o = data[0]
    return {
      id: o.id,
      service_code: o.code,
      customer_id: o.customer_id,
      driver_id: o.driver_id,
      driver: { full_name: 'Conductor VAMO' },
      status: 'ENTREGADO',
      updated_at: o.updated_at
    }
  } catch {
    return null
  }
}
