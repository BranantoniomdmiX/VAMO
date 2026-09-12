const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

const env = dotenv.parse(fs.readFileSync('.env.local'));
const client = new Client({ connectionString: env.DATABASE_ADMIN_URL, ssl: false });

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT routine_schema, routine_name, data_type
    FROM information_schema.routines
    WHERE routine_schema IN ('public', 'auth')
    ORDER BY routine_schema, routine_name;
  `);
  console.log('FUNCTIONS_FOUND:', res.rows.map(r => `${r.routine_schema}.${r.routine_name}`));
  await client.end();
}
check().catch(console.error);
