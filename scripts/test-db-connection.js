const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Cargar variables de entorno desde .env.local de forma limpia
const envPath = path.resolve(__dirname, '..', '.env.local');
let databaseUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      databaseUrl = trimmed.split('DATABASE_URL=')[1].trim();
      break;
    }
  }
}

if (!databaseUrl) {
  console.error('❌ FAIL_CLOSED: No se encontró DATABASE_URL en el entorno ni en .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5000,
});

async function verifyDb() {
  const start = Date.now();
  console.log('🔄 Iniciando prueba de conexión segura a la base de datos...\n');
  try {
    const client = await pool.connect();
    const versionRes = await client.query('SELECT version();');
    const dbRes = await client.query('SELECT current_database(), current_user, inet_server_addr(), inet_server_port();');
    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
    const rlsRes = await client.query("SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' ORDER BY relname;");
    
    client.release();
    await pool.end();

    const latency = Date.now() - start;

    console.log('====================================================');
    console.log('✅ ESTADO: CONEXIÓN EXITOSA Y AUTORIZADA');
    console.log('====================================================');
    console.log(`⏱️ Latencia de respuesta: ${latency} ms`);
    console.log(`🌐 Servidor:            ${dbRes.rows[0].inet_server_addr}:${dbRes.rows[0].inet_server_port} (Oracle Cloud Dokploy)`);
    console.log(`📦 Base de Datos:        ${dbRes.rows[0].current_database}`);
    console.log(`👤 Usuario de Sesión:    ${dbRes.rows[0].current_user}`);
    console.log(`🐘 Motor:               ${versionRes.rows[0].version.split(' on ')[0]}`);
    console.log(`📊 Tablas Activas:       ${tablesRes.rows.length} tablas en schema public`);
    console.log('----------------------------------------------------');
    console.log('🔒 ESTADO DE BLINDAJE RLS (Row Level Security):');
    rlsRes.rows.forEach(r => {
      const status = r.relrowsecurity ? '✅ RLS_ENABLED (Activo)' : '❌ RLS_DISABLED (Inactivo)';
      console.log(`   - ${r.relname.padEnd(22)}: ${status}`);
    });
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR DE CONEXIÓN A LA BASE DE DATOS:');
    console.error(`   ${err.message}\n`);
    process.exit(1);
  }
}

verifyDb();
