const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envPath = path.resolve(__dirname, '..', '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
let adminUrl = '';
for (const line of content.split('\n')) {
  if (line.trim().startsWith('DATABASE_ADMIN_URL=')) {
    adminUrl = line.trim().split('DATABASE_ADMIN_URL=')[1].trim();
    break;
  }
}

const pool = new Pool({ connectionString: adminUrl });

async function fixWalletPolicy() {
  await pool.query(`
    DROP POLICY IF EXISTS "wallet_accounts_owner_only" ON public.wallet_accounts;
    CREATE POLICY "wallet_accounts_owner_only" ON public.wallet_accounts FOR ALL
      USING (profile_id = public.current_app_user_id() OR public.current_app_role() IN ('superadmin', 'master'))
      WITH CHECK (profile_id = public.current_app_user_id() OR public.current_app_role() IN ('superadmin', 'master'));
  `);
  console.log('✅ Policy wallet_accounts_owner_only actualizada con WITH CHECK');
  await pool.end();
}

fixWalletPolicy().catch(console.error);
