const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

const env = dotenv.parse(fs.readFileSync('.env.local'));

async function inspectColumns() {
  const client = new Client({ connectionString: env.DATABASE_URL, ssl: false });
  await client.connect();

  const tables = [
    'profiles', 'franchises', 'territories', 'cities', 'drivers', 
    'merchants', 'products', 'orders', 'wallet_accounts', 
    'wallet_transactions', 'bank_accounts', 'device_tokens'
  ];

  for (const t of tables) {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [t]);
    console.log(`\n=== TABLE: ${t} ===`);
    res.rows.forEach(r => {
      console.log(`  ${r.column_name.padEnd(25)} : ${r.data_type.padEnd(15)} (nullable: ${r.is_nullable})`);
    });
  }

  await client.end();
}

inspectColumns().catch(console.error);
