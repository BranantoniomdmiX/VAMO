import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { query } from '@/lib/db/postgres'

export interface TrustedAuthContext {
  userId: string
  email: string
  role: string
  franchiseId: string | null
  baseId: string | null
  driverId: string | null
  merchantId: string | null
}

/**
 * 🛡️ Resuelve la identidad y contexto operativo confiable a partir de la sesión Supabase Auth y PostgreSQL
 * Fail-closed: Si no hay sesión válida retorna null.
 */
export async function getTrustedAuthContext(): Promise<TrustedAuthContext | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Consultar el perfil confiable directamente en Dokploy PostgreSQL
    const profileRes = await query<{
      id: string
      role: string
      franchise_id: string | null
    }>('SELECT id, role, franchise_id FROM public.profiles WHERE id = $1;', [user.id])

    const profile = profileRes.rows[0]
    const role = profile?.role || (user.app_metadata?.user_role as string) || (user.user_metadata?.role as string) || 'customer'
    const franchiseId = profile?.franchise_id || null

    // Si es driver, resolver su registro en public.drivers
    let driverId: string | null = null
    if (role === 'driver' || role === 'superadmin') {
      const drvRes = await query<{ id: string }>('SELECT id FROM public.drivers WHERE id = $1;', [user.id])
      if (drvRes.rows.length > 0) {
        driverId = drvRes.rows[0].id
      }
    }

    // Si es merchant, resolver su registro en public.merchants
    let merchantId: string | null = null
    if (role === 'merchant' || role === 'superadmin') {
      const merchRes = await query<{ id: string }>('SELECT id FROM public.merchants WHERE profile_id = $1;', [user.id])
      if (merchRes.rows.length > 0) {
        merchantId = merchRes.rows[0].id
      }
    }

    return {
      userId: user.id,
      email: user.email || '',
      role,
      franchiseId,
      baseId: null,
      driverId,
      merchantId,
    }
  } catch (err) {
    console.error('❌ [getTrustedAuthContext Error]:', err)
    return null
  }
}
