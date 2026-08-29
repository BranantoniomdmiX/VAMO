import { NextResponse, type NextRequest } from 'next/server'
import { query } from '@/lib/db/postgres'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-master-key')
    const expectedKey = process.env.MASTER_MIGRATION_KEY || 'vamo-master-dokploy-2026'

    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'No autorizado. Se requiere x-master-key válida.' }, { status: 401 })
    }

    // Ruta al archivo SQL maestro
    const sqlPath = path.join(process.cwd(), 'supabase', 'VAMO_MASTER_ORACLE_INIT.sql')
    if (!fs.existsSync(sqlPath)) {
      return NextResponse.json({ error: 'Archivo VAMO_MASTER_ORACLE_INIT.sql no encontrado en el servidor.' }, { status: 404 })
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    const start = Date.now()

    // Ejecutar el script SQL completo
    await query(sqlContent)

    // Obtener las tablas creadas para verificar
    const tablesRes = await query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    )

    const duration = Date.now() - start

    return NextResponse.json({
      success: true,
      message: 'Migración maestra PostgreSQL 16 ejecutada con éxito en Oracle Cloud.',
      duration_ms: duration,
      tables_count: tablesRes.rowCount,
      tables: tablesRes.rows.map(r => r.table_name),
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail,
    }, { status: 500 })
  }
}
