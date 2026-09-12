import { Pool, QueryResult, QueryResultRow } from 'pg'

// String de conexión PostgreSQL (Oracle Cloud Always Free o Local)
const connectionString = process.env.DATABASE_URL

if (!connectionString && process.env.NODE_ENV === 'production') {
  console.error('🚨 [SECURITY FATAL]: DATABASE_URL no está configurada en las variables de entorno.')
}

let pool: Pool | null = null

export function getPostgresPool(): Pool {
  if (!connectionString) {
    throw new Error('FAIL_CLOSED: DATABASE_URL environment variable is missing.')
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 20, // Máximo de conexiones concurrentes en pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') && !connectionString.includes('163.192') && !connectionString.includes('vamo-db') && !connectionString.includes('internal')
        ? { rejectUnauthorized: false }
        : false,
    })

    pool.on('error', (err) => {
      console.error('⚠️ [PostgreSQL Pool Error]:', err.message)
    })
  }
  return pool
}

/**
 * Ejecutar una consulta SQL con parámetros preparados
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  const client = getPostgresPool()
  try {
    const res = await client.query<T>(text, params)
    const duration = Date.now() - start
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🐘 [SQL Query] (${duration}ms):`, text.slice(0, 80))
    }
    return res
  } catch (error: any) {
    console.error('❌ [SQL Execution Error]:', error.message, '\nQuery:', text)
    throw error
  }
}

/**
 * Obtener un cliente para transacciones multi-paso (BEGIN / COMMIT / ROLLBACK)
 */
export async function getTransactionClient() {
  const pool = getPostgresPool()
  const client = await pool.connect()
  return client
}

export interface AuthenticatedDbContext {
  userId?: string | null
  role?: string | null
  franchiseId?: string | null
  baseId?: string | null
}

/**
 * 🛡️ Helper de Ejecución en Contexto de Transacción Autenticada
 * Inyecta las variables de sesión de manera transaction-scoped (SET LOCAL)
 * Evita fugas entre conexiones reutilizadas en el Connection Pool.
 */
export async function withAuthenticatedDbContext<T>(
  context: AuthenticatedDbContext,
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await getTransactionClient()
  try {
    await client.query('BEGIN')

    // Inyectar variables locales de la transacción (Fail-closed si es null)
    if (context.userId) {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', context.userId])
    }
    if (context.role) {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_role', context.role])
    }
    if (context.franchiseId) {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_franchise_id', context.franchiseId])
    }

    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
