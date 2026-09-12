const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envPath = path.resolve(__dirname, '..', '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';
for (const line of content.split('\n')) {
  if (line.trim().startsWith('DATABASE_URL=')) {
    dbUrl = line.trim().split('DATABASE_URL=')[1].trim();
    break;
  }
}

const pool = new Pool({ connectionString: dbUrl });

async function checkRole() {
  const client = await pool.connect();
  const res = await client.query(`
    SELECT 
      current_user,
      session_user,
      r.rolsuper,
      r.rolbypassrls,
      r.rolcanlogin
    FROM pg_roles r
    WHERE r.rolname = current_user;
  `);
  console.log('--- ROLE PERMISSIONS ---');
  console.log(JSON.stringify(res.rows[0], null, 2));
  
  const tablesRes = await client.query(`
    SELECT 
      c.relname as table_name,
      pg_get_userbyid(c.relowner) as table_owner,
      c.relrowsecurity as rls_enabled,
      c.relforcerowsecurity as force_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `);
  console.log('--- TABLES OWNERSHIP & FORCE RLS ---');
  console.log(JSON.stringify(tablesRes.rows, null, 2));

  client.release();
  await pool.end();
}

checkRole().catch(err => {
  console.error(err);
  process.exit(1);
});
