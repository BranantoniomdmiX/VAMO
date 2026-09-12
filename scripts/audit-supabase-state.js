const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const env = dotenv.parse(fs.readFileSync('.env.local'));

async function auditSupabase() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log('SUPABASE_NOT_CONFIGURED');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 1. List Auth Users
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('AUTH_ERR:', authErr.message);
  } else {
    console.log('SUPABASE_AUTH_USERS_COUNT:', users ? users.length : 0);
    if (users && users.length > 0) {
      console.log('USERS_LIST:', users.map(u => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        app_metadata: u.app_metadata,
        user_metadata: u.user_metadata
      })));
    }
  }

  // 2. Check service_orders table on Supabase if accessible via REST
  const { data: soData, error: soErr, count: soCount } = await supabase
    .from('service_orders')
    .select('id, created_at, status', { count: 'exact', head: false })
    .limit(10);
  
  if (soErr) {
    console.log('SERVICE_ORDERS_QUERY_ERR:', soErr.message);
  } else {
    console.log('SUPABASE_SERVICE_ORDERS_COUNT:', soData ? soData.length : 0);
    console.log('SERVICE_ORDERS_SAMPLE:', soData);
  }

  // 3. Check profiles on Supabase if exists
  const { data: profData, error: profErr } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .limit(10);
  if (profErr) {
    console.log('SUPABASE_PROFILES_ERR:', profErr.message);
  } else {
    console.log('SUPABASE_PROFILES_COUNT:', profData ? profData.length : 0);
    console.log('SUPABASE_PROFILES:', profData);
  }

  // 4. List storage buckets
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    console.log('STORAGE_BUCKETS_ERR:', bucketErr.message);
  } else {
    console.log('STORAGE_BUCKETS:', buckets ? buckets.map(b => b.name) : []);
  }
}

auditSupabase().catch(e => console.error(e));
