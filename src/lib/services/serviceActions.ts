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

export async function getActiveServices(tenantId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener servicios:', error)
    return []
  }

  return data as Service[]
}
