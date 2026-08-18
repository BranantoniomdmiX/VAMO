import { createClient } from '@/lib/supabase/client'

export type UserRole = 'superadmin' | 'fleet_owner' | 'dispatcher' | 'merchant' | 'driver' | 'customer'

export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  created_at?: string
}

export const ROLE_HOME_MAP: Record<UserRole, string> = {
  superadmin: '/admin/dashboard',
  fleet_owner: '/owner/dashboard',
  dispatcher: '/base/dispatch',
  merchant: '/biz',
  driver: '/driver/home',
  customer: '/customer/home'
}

/**
 * Obtener todos los roles asociados a un usuario en la tabla public.user_roles
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  if (error || !data || data.length === 0) {
    return ['customer']
  }

  return data.map(r => r.role as UserRole)
}

/**
 * Guardar el rol activo de sesión en el almacenamiento local para alternar vista (Multi-Rol)
 */
export function setActiveSessionRole(role: UserRole): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vamo_active_role', role)
  }
}

/**
 * Leer el rol activo de sesión desde localStorage o retornar el por defecto
 */
export function getActiveSessionRole(): UserRole | null {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('vamo_active_role') as UserRole) || null
  }
  return null
}
