import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { getTransactionClient, withAuthenticatedDbContext } from '@/lib/db/postgres'
import type { PoolClient } from 'pg'

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
 * 🛡️ Resuelve la identidad y contexto operativo confiable a partir de la sesión Supabase Auth y PostgreSQL.
 *
 * Flujo de Bootstrap RLS Seguro:
 * 1. Supabase auth.getUser() verifica criptográficamente la sesión (solo se extraen user.id y email).
 * 2. Se abre una transacción PostgreSQL aislada del pool.
 * 3. Se establece primero app.current_user_id = user.id con set_config(..., true) (transaction-scoped).
 * 4. Se lee public.profiles bajo FORCE RLS.
 * 5. role y franchise_id salen EXCLUSIVAMENTE del registro en PostgreSQL (nunca de user_metadata / app_metadata).
 * 6. Si aún no existe profile en PostgreSQL, se usa 'customer' como rol mínimo para onboarding.
 * 7. Dentro de LA MISMA transacción se establecen app.current_role y app.current_franchise_id.
 * 8. Se resuelven driverId y merchantId bajo RLS dentro de la misma transacción.
 * 9. Fail-closed: ante cualquier error o sesión inválida retorna null.
 */
export async function getTrustedAuthContext(): Promise<TrustedAuthContext | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    const client = await getTransactionClient()
    try {
      await client.query('BEGIN')

      // Paso 1 de Bootstrap: Establecer app.current_user_id para que RLS permita leer el propio perfil
      await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', user.id])

      // Paso 2: Leer public.profiles bajo FORCE RLS
      const profileRes = await client.query<{
        id: string
        role: string
        franchise_id: string | null
      }>('SELECT id, role, franchise_id FROM public.profiles WHERE id = $1;', [user.id])

      const profile = profileRes.rows[0]
      // REGLA SUPREMA: role y franchise_id deben salir exclusivamente del profile PostgreSQL.
      // Si no existe, rol mínimo seguro 'customer' para onboarding (NUNCA elevar desde metadata de cliente).
      const role = profile?.role || 'customer'
      const franchiseId = profile?.franchise_id || null

      // Paso 3: Establecer el rol y franchise_id dentro de LA MISMA transacción
      await client.query('SELECT set_config($1, $2, true)', ['app.current_role', role])
      if (franchiseId) {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_franchise_id', franchiseId])
      }

      // Paso 4: Resolver driverId si aplica
      let driverId: string | null = null
      if (role === 'driver' || role === 'superadmin' || role === 'master') {
        const drvRes = await client.query<{ id: string }>('SELECT id FROM public.drivers WHERE id = $1;', [user.id])
        if (drvRes.rows.length > 0) {
          driverId = drvRes.rows[0].id
        }
      }

      // Paso 5: Resolver merchantId si aplica
      let merchantId: string | null = null
      if (role === 'merchant' || role === 'superadmin' || role === 'master') {
        const merchRes = await client.query<{ id: string }>('SELECT id FROM public.merchants WHERE profile_id = $1;', [user.id])
        if (merchRes.rows.length > 0) {
          merchantId = merchRes.rows[0].id
        }
      }

      await client.query('COMMIT')

      return {
        userId: user.id,
        email: user.email || '',
        role,
        franchiseId,
        baseId: null,
        driverId,
        merchantId,
      }
    } catch (dbErr) {
      await client.query('ROLLBACK').catch(() => {})
      throw dbErr
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('❌ [getTrustedAuthContext Error]:', err)
    return null
  }
}

/**
 * 🛡️ Helper de Orden Superior: Resuelve la autenticación y ejecuta la callback dentro
 * de una transacción PostgreSQL con el contexto RLS debidamente inyectado (SET LOCAL).
 *
 * Garantiza que las consultas subsecuentes no pierdan el contexto RLS ni dependan de query() fuera de transacción.
 */
export async function withTrustedAuthContext<T>(
  callback: (ctx: TrustedAuthContext, client: PoolClient) => Promise<T>
): Promise<T | null> {
  const authContext = await getTrustedAuthContext()
  if (!authContext) {
    return null
  }

  return withAuthenticatedDbContext(
    {
      userId: authContext.userId,
      role: authContext.role,
      franchiseId: authContext.franchiseId,
      baseId: authContext.baseId,
    },
    async (client: PoolClient) => {
      return callback(authContext, client)
    }
  )
}
