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

async function checkPolicies() {
  const client = await pool.connect();
  const res = await client.query(`
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual as using_expr,
      with_check as with_check_expr
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);
  console.log('--- PG POLICIES INVENTORY ---');
  res.rows.forEach(p => {
    console.log(`TABLE: ${p.tablename.padEnd(20)} | POLICY: ${p.policyname.padEnd(25)} | CMD: ${p.cmd.padEnd(6)} | ROLES: ${p.roles} | USING: ${p.using_expr}`);
  });
  client.release();
  await pool.end();
}

checkPolicies().catch(err => {
  console.error(err);
  process.exit(1);
});
