const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

const env = dotenv.parse(fs.readFileSync('.env.local'));

async function main() {
  const client = new Client({ connectionString: env.DATABASE_URL, ssl: false });
  await client.connect();

  const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name");
  const tables = tablesRes.rows.map(r => r.table_name);

  const counts = {};
  for (const t of tables) {
    const c = await client.query(`SELECT count(*)::int as cnt FROM "${t}"`);
    counts[t] = c.rows[0].cnt;
  }
  console.log('COUNTS:', JSON.stringify(counts, null, 2));

  // Check all databases on this PostgreSQL instance
  const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
  console.log('DATABASES_ON_PG:', dbs.rows.map(r => r.datname));

  // Check roles
  const roles = await client.query("SELECT rolname, rolsuper, rolcanlogin, rolbypassrls FROM pg_roles WHERE rolname IN ('vamo_admin', 'vamo_app', 'postgres')");
  console.log('ROLES:', JSON.stringify(roles.rows, null, 2));

  // Check if there are other schemas
  const schemas = await client.query("SELECT schema_name FROM information_schema.schemata");
  console.log('SCHEMAS:', schemas.rows.map(r => r.schema_name));

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
