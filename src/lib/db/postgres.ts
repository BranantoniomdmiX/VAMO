import { Pool, QueryResult, QueryResultRow } from 'pg'

// String de conexión PostgreSQL (Oracle Cloud Always Free o Local)
const connectionString = process.env.DATABASE_URL || 'postgresql://vamo_admin:tMEMwBsulRU5ZdulEp8g@163.192.147.231:5432/vamo_production'

let pool: Pool | null = null

export function getPostgresPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 20, // Máximo de conexiones concurrentes en pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') && !connectionString.includes('163.192')
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
