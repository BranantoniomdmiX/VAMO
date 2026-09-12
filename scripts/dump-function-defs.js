const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

const env = dotenv.parse(fs.readFileSync('.env.local'));
const client = new Client({ connectionString: env.DATABASE_ADMIN_URL, ssl: false });

async function dumpFuncs() {
  await client.connect();
  const res = await client.query(`
    SELECT p.proname, pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname IN ('assign_order_atomic', 'update_kds_order_status', 'verify_order_pod', 'process_order_settlement', 'request_wallet_withdrawal');
  `);
  for (const r of res.rows) {
    console.log('----------------------------------------------------');
    console.log('FUNCTION:', r.proname);
    console.log('----------------------------------------------------');
    console.log(r.def);
  }
  await client.end();
}
dumpFuncs().catch(console.error);
