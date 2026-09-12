const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const envPath = path.resolve(__dirname, '..', '.env.local');
const env = dotenv.parse(fs.readFileSync(envPath, 'utf8'));

const pool = new Pool({ connectionString: env.DATABASE_ADMIN_URL });

async function setupMerchantPolicies() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Políticas RLS para merchants
    await client.query(`
      DROP POLICY IF EXISTS "merchants_party_isolation" ON public.merchants;
      CREATE POLICY "merchants_party_isolation" ON public.merchants FOR SELECT
        USING (
          profile_id = public.current_app_user_id() 
          OR franchise_id = public.current_app_franchise_id()
          OR is_open = true
          OR public.current_app_role() IN ('superadmin', 'master')
        );

      DROP POLICY IF EXISTS "merchants_manage_owner" ON public.merchants;
      CREATE POLICY "merchants_manage_owner" ON public.merchants FOR ALL
        USING (
          profile_id = public.current_app_user_id() 
          OR (franchise_id = public.current_app_franchise_id() AND public.current_app_role() IN ('dispatcher', 'franchise_owner', 'base_operator'))
          OR public.current_app_role() IN ('superadmin', 'master')
        )
        WITH CHECK (
          profile_id = public.current_app_user_id() 
          OR (franchise_id = public.current_app_franchise_id() AND public.current_app_role() IN ('dispatcher', 'franchise_owner', 'base_operator'))
          OR public.current_app_role() IN ('superadmin', 'master')
        );
    `);

    // 2. Políticas RLS para products
    await client.query(`
      DROP POLICY IF EXISTS "products_read_policy" ON public.products;
      CREATE POLICY "products_read_policy" ON public.products FOR SELECT
        USING (
          is_available = true 
          OR merchant_id IN (SELECT id FROM public.merchants WHERE profile_id = public.current_app_user_id())
          OR public.current_app_role() IN ('superadmin', 'master')
        );

      DROP POLICY IF EXISTS "products_manage_merchant" ON public.products;
      CREATE POLICY "products_manage_merchant" ON public.products FOR ALL
        USING (
          merchant_id IN (SELECT id FROM public.merchants WHERE profile_id = public.current_app_user_id())
          OR public.current_app_role() IN ('superadmin', 'master')
        )
        WITH CHECK (
          merchant_id IN (SELECT id FROM public.merchants WHERE profile_id = public.current_app_user_id())
          OR public.current_app_role() IN ('superadmin', 'master')
        );
    `);

    // 3. Extender orders para permitir a los merchants ver y actualizar sus pedidos
    await client.query(`
      DROP POLICY IF EXISTS "orders_party_isolation" ON public.orders;
      CREATE POLICY "orders_party_isolation" ON public.orders FOR SELECT
        USING (
          customer_id = public.current_app_user_id() 
          OR driver_id = public.current_app_user_id() 
          OR merchant_id IN (SELECT id FROM public.merchants WHERE profile_id = public.current_app_user_id())
          OR franchise_id = public.current_app_franchise_id()
          OR public.current_app_role() IN ('superadmin', 'master')
        );

      DROP POLICY IF EXISTS "orders_merchant_update" ON public.orders;
      CREATE POLICY "orders_merchant_update" ON public.orders FOR UPDATE
        USING (
          merchant_id IN (SELECT id FROM public.merchants WHERE profile_id = public.current_app_user_id())
          OR driver_id = public.current_app_user_id()
          OR franchise_id = public.current_app_franchise_id()
          OR public.current_app_role() IN ('superadmin', 'master')
        )
        WITH CHECK (
          merchant_id IN (SELECT id FROM public.merchants WHERE profile_id = public.current_app_user_id())
          OR driver_id = public.current_app_user_id()
          OR franchise_id = public.current_app_franchise_id()
          OR public.current_app_role() IN ('superadmin', 'master')
        );
    `);

    await client.query('COMMIT');
    console.log('✅ Políticas RLS de merchants, products y orders actualizadas exitosamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error aplicando políticas:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupMerchantPolicies();
