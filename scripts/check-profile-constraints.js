const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

const env = dotenv.parse(fs.readFileSync('.env.local'));
const client = new Client({ connectionString: env.DATABASE_ADMIN_URL, ssl: false });

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'profiles';
  `);
  console.log('PROFILES_CONSTRAINTS:', res.rows);
  await client.end();
}
check().catch(console.error);
