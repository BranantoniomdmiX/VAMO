import { createClient } from '@/lib/supabase/client'
import { DriverStatus } from '@/types/database.types'

export async function updateDriverStatus(driverId: string, status: DriverStatus) {
  const supabase = createClient()

  const { error } = await supabase
    .from('drivers')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', driverId)

  if (error) {
    console.error('Error al actualizar estatus del repartidor:', error)
    return false
  }

  return true
}

export async function getActiveDrivers(tenantId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('drivers')
    .select(`
      id,
      tenant_id,
      status,
      wallet_balance,
      vehicle_plate,
      profiles (
        full_name,
        phone
      )
    `)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error al obtener repartidores:', error)
    return []
  }

  return data
}
