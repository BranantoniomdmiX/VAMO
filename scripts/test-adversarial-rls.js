// Test Adversarial de RLS y Aislamiento Multi-Tenant (Fase 5 & 6)
// Valida que el rol de runtime vamo_app respete RLS y no pueda cruzar tenants
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envPath = path.resolve(__dirname, '..', '.env.local');
const content = fs.readFileSync(envPath, 'utf8');

let adminUrl = '';
let runtimeUrl = '';
for (const line of content.split('\n')) {
  if (line.trim().startsWith('DATABASE_ADMIN_URL=')) {
    adminUrl = line.trim().split('DATABASE_ADMIN_URL=')[1].trim();
  }
  if (line.trim().startsWith('DATABASE_URL=')) {
    runtimeUrl = line.trim().split('DATABASE_URL=')[1].trim();
  }
}

const adminPool = new Pool({ connectionString: adminUrl });
const runtimePool = new Pool({ connectionString: runtimeUrl });

async function withContext(client, ctx, fn) {
  await client.query('BEGIN');
  if (ctx.userId) await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', ctx.userId]);
  if (ctx.role) await client.query('SELECT set_config($1, $2, true)', ['app.current_role', ctx.role]);
  if (ctx.franchiseId) await client.query('SELECT set_config($1, $2, true)', ['app.current_franchise_id', ctx.franchiseId]);
  const res = await fn(client);
  await client.query('COMMIT');
  return res;
}

async function runAdversarialRlsTest() {
  console.log('--- INICIANDO TEST ADVERSARIAL RLS (RUNTIME ROLE: vamo_app) ---');

  const adminClient = await adminPool.connect();
  const runtimeClient = await runtimePool.connect();

  const cityId = '33333333-3333-3333-3333-333333333333';
  const franchiseA = '11111111-1111-1111-1111-111111111111';
  const franchiseB = '22222222-2222-2222-2222-222222222222';
  const customerA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const customerB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  try {
    // 0. Setup administrativo de fixtures
    await adminClient.query(`
      INSERT INTO public.cities (id, name, state, country)
      VALUES ('${cityId}', 'Ciudad Test', 'GTO', 'MEX')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.franchises (id, city_id, name, slug, status)
      VALUES 
        ('${franchiseA}', '${cityId}', 'Plaza Norte', 'plaza-norte', 'active'),
        ('${franchiseB}', '${cityId}', 'Plaza Sur', 'plaza-sur', 'active')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO auth.users (id, email)
      VALUES 
        ('${customerA}', 'cust_a@vamo.mx'),
        ('${customerB}', 'cust_b@vamo.mx')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.profiles (id, full_name, phone, role)
      VALUES 
        ('${customerA}', 'Cliente A', '5511111111', 'customer'),
        ('${customerB}', 'Cliente B', '5522222222', 'customer')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 1. Contexto A: Insertar orden como Cliente A en Franquicia A
    await withContext(runtimeClient, { userId: customerA, role: 'customer', franchiseId: franchiseA }, async (c) => {
      await c.query(`
        INSERT INTO public.orders (id, customer_id, franchise_id, code, origin_address, destination_address, origin_lat, origin_lng, destination_lat, destination_lng, total, status)
        VALUES ('99999999-9999-9999-9999-aaaaaaaaaaaa', $1, $2, 'TEST-A', 'Calle A', 'Dest A', 20.52, -100.81, 20.53, -100.82, 100.00, 'PENDING')
        ON CONFLICT (id) DO NOTHING;
      `, [customerA, franchiseA]);
    });

    // 2. Contexto B: Insertar orden como Cliente B en Franquicia B
    await withContext(runtimeClient, { userId: customerB, role: 'customer', franchiseId: franchiseB }, async (c) => {
      await c.query(`
        INSERT INTO public.orders (id, customer_id, franchise_id, code, origin_address, destination_address, origin_lat, origin_lng, destination_lat, destination_lng, total, status)
        VALUES ('99999999-9999-9999-9999-bbbbbbbbbbbb', $1, $2, 'TEST-B', 'Calle B', 'Dest B', 20.54, -100.83, 20.55, -100.84, 200.00, 'PENDING')
        ON CONFLICT (id) DO NOTHING;
      `, [customerB, franchiseB]);
    });

    // 3. Test: Cliente A lee su propia orden (A -> A)
    const readA = await withContext(runtimeClient, { userId: customerA, role: 'customer', franchiseId: franchiseA }, async (c) => {
      return await c.query("SELECT id, code FROM public.orders WHERE id = '99999999-9999-9999-9999-aaaaaaaaaaaa';");
    });
    console.log('TEST 1 (A -> A SELECT):', readA.rows.length === 1 ? '✅ PASS (Permitido legítimo)' : '❌ FAIL');

    // 4. Test Adversarial: Cliente A intenta leer orden de Cliente B (A -> B Cross-Tenant)
    const readCross = await withContext(runtimeClient, { userId: customerA, role: 'customer', franchiseId: franchiseA }, async (c) => {
      return await c.query("SELECT id, code FROM public.orders WHERE id = '99999999-9999-9999-9999-bbbbbbbbbbbb';");
    });
    console.log('TEST 2 (A -> B CROSS-TENANT READ):', readCross.rows.length === 0 ? '✅ PASS (Bloqueado por RLS)' : '❌ FAIL (Fuga de datos)');

    // 5. Test Adversarial: Consulta anónima sin contexto (Fail-Closed)
    const readAnon = await withContext(runtimeClient, {}, async (c) => {
      return await c.query("SELECT id, code FROM public.orders;");
    });
    console.log('TEST 3 (ANON / FAIL-CLOSED):', readAnon.rows.length === 0 ? '✅ PASS (Denegado total)' : '❌ FAIL');

    // 6. Test: Superadmin consulta ambas órdenes (Visión Global Autorizada)
    const masterUuid = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const readAdmin = await withContext(runtimeClient, { userId: masterUuid, role: 'superadmin' }, async (c) => {
      return await c.query("SELECT id, code FROM public.orders WHERE id IN ('99999999-9999-9999-9999-aaaaaaaaaaaa', '99999999-9999-9999-9999-bbbbbbbbbbbb');");
    });
    console.log('TEST 4 (SUPERADMIN VISION):', readAdmin.rows.length === 2 ? '✅ PASS (Visión global autorizada)' : '❌ FAIL');

    // Limpieza
    await adminClient.query(`
      DELETE FROM public.orders WHERE id IN ('99999999-9999-9999-9999-aaaaaaaaaaaa', '99999999-9999-9999-9999-bbbbbbbbbbbb');
      DELETE FROM public.profiles WHERE id IN ('${customerA}', '${customerB}');
      DELETE FROM auth.users WHERE id IN ('${customerA}', '${customerB}');
      DELETE FROM public.franchises WHERE id IN ('${franchiseA}', '${franchiseB}');
      DELETE FROM public.cities WHERE id = '${cityId}';
    `);
    console.log('✅ Limpieza de fixtures completada.');

  } catch (err) {
    console.error('❌ Error en test adversarial:', err);
    process.exit(1);
  } finally {
    adminClient.release();
    runtimeClient.release();
    await adminPool.end();
    await runtimePool.end();
  }
}

runAdversarialRlsTest();
