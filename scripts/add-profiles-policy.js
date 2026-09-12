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

async function addProfilesPolicy() {
  await pool.query(`
    DROP POLICY IF EXISTS "profiles_self_manage" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

    CREATE POLICY "profiles_read_policy" ON public.profiles FOR SELECT
      USING (id = public.current_app_user_id() OR public.current_app_role() IN ('superadmin', 'master'));

    CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE
      USING (id = public.current_app_user_id() OR public.current_app_role() IN ('superadmin', 'master'))
      WITH CHECK (
        public.current_app_role() IN ('superadmin', 'master')
        OR (id = public.current_app_user_id() AND role NOT IN ('superadmin', 'master'))
      );

    CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT
      WITH CHECK (
        public.current_app_role() IN ('superadmin', 'master')
        OR (id = public.current_app_user_id() AND role NOT IN ('superadmin', 'master'))
      );
  `);
  console.log('✅ Políticas profiles blindadas contra auto-escalamiento a superadmin.');
  await pool.end();
}

addProfilesPolicy().catch(console.error);
