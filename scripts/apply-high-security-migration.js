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
    const migrationFile = path.join(__dirname, '../supabase/migrations/20260911_final_high_security_hardening.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('🐘 Aplicando migración: 20260911_final_high_security_hardening.sql ...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migración aplicada exitosamente en PostgreSQL Dokploy.');

    // Verificar trigger
    const trg = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'profiles' AND trigger_name = 'trg_protect_profile_authority_fields';
    `);
    console.log('📋 Trigger verificado:');
    console.table(trg.rows);

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
