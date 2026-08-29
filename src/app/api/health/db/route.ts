import { NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  try {
    // 1. Probar conectividad básica y versión de PostgreSQL
    const versionRes = await query<{ version: string }>('SELECT version();')
    
    // 2. Probar extensión PostGIS
    const postgisRes = await query<{ postgis_version: string }>('SELECT PostGIS_Version();')
    
    // 3. Probar conteo de tablas en esquema public
    const tablesRes = await query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    )

    const latencyMs = Date.now() - start

    return NextResponse.json({
      status: 'healthy',
      database: 'PostgreSQL 16 (Oracle Cloud Always Free - Dokploy)',
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
      postgres_version: versionRes.rows[0]?.version || 'unknown',
      postgis_version: postgisRes.rows[0]?.postgis_version || 'unknown',
      tables_count: tablesRes.rowCount,
      tables: tablesRes.rows.map(r => r.table_name),
    }, { status: 200 })
  } catch (error: any) {
    const latencyMs = Date.now() - start
    return NextResponse.json({
      status: 'unhealthy',
      database: 'PostgreSQL 16 (Oracle Cloud Always Free - Dokploy)',
      latency_ms: latencyMs,
      error: error.message,
      code: error.code || 'UNKNOWN_DB_ERROR',
      hint: 'Verifica que el servicio vamo-postgres esté en estado Running en Dokploy y las credenciales sean correctas.',
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
