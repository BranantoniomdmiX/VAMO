require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const adminUrl = process.env.DATABASE_ADMIN_URL;
  if (!adminUrl) {
    console.error('❌ [FATAL]: DATABASE_ADMIN_URL no está configurada.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: adminUrl, ssl: false });
  const client = await pool.connect();

  try {
    const migrationFile = path.join(__dirname, '../supabase/migrations/20260911_settlement_privilege_boundary.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('🐘 Aplicando migración: 20260911_settlement_privilege_boundary.sql ...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migración aplicada exitosamente en Dokploy PostgreSQL.');

    // Verificar ACL de process_order_settlement
    const aclRes = await client.query(`
      SELECT p.proname, p.proacl
      FROM pg_proc p
      WHERE p.proname = 'process_order_settlement';
    `);
    console.log('📋 ACL de process_order_settlement:');
    console.table(aclRes.rows);

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
