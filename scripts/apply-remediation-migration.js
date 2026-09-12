require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const adminUrl = process.env.DATABASE_ADMIN_URL;
  if (!adminUrl) {
    console.error('❌ [FATAL]: DATABASE_ADMIN_URL no está definida en .env.local');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: adminUrl, ssl: false });
  const client = await pool.connect();

  try {
    const migrationFile = path.join(__dirname, '../supabase/migrations/20260911_synthetic_remediation_core.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('🐘 Aplicando migración versionada: 20260911_synthetic_remediation_core.sql ...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migración aplicada exitosamente en Dokploy PostgreSQL.');

    // Verificar las funciones creadas
    const fnCheck = await client.query(`
      SELECT routine_name, routine_type, security_type
      FROM information_schema.routines
      WHERE routine_schema = 'public' 
        AND routine_name IN ('assign_order_atomic', 'update_kds_order_status', 'verify_order_pod', 'process_order_settlement', 'request_wallet_withdrawal');
    `);
    console.log('📋 Funciones verificadas:');
    console.table(fnCheck.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error aplicando migración:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
