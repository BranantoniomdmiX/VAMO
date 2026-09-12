// =====================================================================
// 🧪 REPRODUCE & REGRESSION SUITE: HIGH-01 & HIGH-02 PRE-FIX FAIL PROOF
// =====================================================================
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const envPath = path.resolve(__dirname, '..', '.env.local');
const env = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
const runtimePool = new Pool({ connectionString: env.DATABASE_URL, ssl: false });

async function withContext(client, ctx, fn) {
  await client.query('BEGIN');
  if (ctx.userId) await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', ctx.userId]);
  if (ctx.role) await client.query('SELECT set_config($1, $2, true)', ['app.current_role', ctx.role]);
  if (ctx.franchiseId) await client.query('SELECT set_config($1, $2, true)', ['app.current_franchise_id', ctx.franchiseId]);
  try {
    const res = await fn(client);
    await client.query('COMMIT');
    return res;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function testVulnerabilities() {
  console.log('--- REPRODUCCIÓN DE VULNERABILIDADES HIGH-01 Y HIGH-02 ---');
  const client = await runtimePool.connect();

  const customerId = 'aaaa0006-0001-4000-8000-000000000001';
  const franchiseAId = 'aaaa0000-0001-4000-8000-000000000001';
  const franchiseBId = 'bbbb0000-0001-4000-8000-000000000001';
  const deliveredOrderId = 'aaaa0022-0001-4000-8000-000000000001';

  try {
    // 1. REPRODUCIR HIGH-01: Customer cambiando su propio rol a 'driver'
    console.log('\n[TEST HIGH-01.1] Customer intenta cambiar su rol a driver...');
    let roleChangeAllowed = false;
    await withContext(client, { userId: customerId, role: 'customer', franchiseId: franchiseAId }, async (c) => {
      const res = await c.query("UPDATE public.profiles SET role = 'driver' WHERE id = $1 RETURNING role;", [customerId]);
      if (res.rows.length > 0 && res.rows[0].role === 'driver') {
        roleChangeAllowed = true;
      }
    });
    console.log('Resultado HIGH-01.1 (Role Tampering):', roleChangeAllowed ? '🚨 VULNERABLE (Allowed)' : '✅ SECURE (Denied)');

    // 2. REPRODUCIR HIGH-01.2: Customer cambiando su franchise_id a Franquicia B
    console.log('\n[TEST HIGH-01.2] Customer intenta transferirse a Franquicia B...');
    let franchiseChangeAllowed = false;
    await withContext(client, { userId: customerId, role: 'customer', franchiseId: franchiseAId }, async (c) => {
      const res = await c.query("UPDATE public.profiles SET franchise_id = $1 WHERE id = $2 RETURNING franchise_id;", [franchiseBId, customerId]);
      if (res.rows.length > 0 && res.rows[0].franchise_id === franchiseBId) {
        franchiseChangeAllowed = true;
      }
    });
    console.log('Resultado HIGH-01.2 (Tenant Tampering):', franchiseChangeAllowed ? '🚨 VULNERABLE (Allowed)' : '✅ SECURE (Denied)');

    // 3. REPRODUCIR HIGH-02: Customer invocando directamente process_order_settlement
    console.log('\n[TEST HIGH-02] Customer invocando process_order_settlement directamente...');
    let settlementAllowed = false;
    await withContext(client, { userId: customerId, role: 'customer', franchiseId: franchiseAId }, async (c) => {
      const res = await c.query("SELECT public.process_order_settlement($1) as r;", [deliveredOrderId]);
      if (res.rows[0].r.success === true || res.rows[0].r.code === 'SETTLEMENT_COMPLETED') {
        settlementAllowed = true;
      }
    });
    console.log('Resultado HIGH-02 (Settlement Authorization):', settlementAllowed ? '🚨 VULNERABLE (Allowed)' : '✅ SECURE (Denied)');

  } finally {
    client.release();
    await runtimePool.end();
  }
}

testVulnerabilities().catch(console.error);
