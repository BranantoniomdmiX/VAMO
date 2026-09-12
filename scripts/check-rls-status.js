const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

const env = dotenv.parse(fs.readFileSync('.env.local'));

async function checkRLS() {
  const client = new Client({ connectionString: env.DATABASE_URL, ssl: false });
  await client.connect();
  const res = await client.query(`
    SELECT c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `);
  console.log('RLS_STATUS_TABLES:', JSON.stringify(res.rows, null, 2));
  await client.end();
}
checkRLS().catch(e => console.error(e));
