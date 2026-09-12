const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const env = dotenv.parse(fs.readFileSync('.env.local'));

async function inspectSupabaseProfiles() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('SUPABASE_PROFILES_DATA:', data);
  console.log('SUPABASE_PROFILES_ERR:', error);

  // Check store-assets bucket files
  const { data: files, error: filesErr } = await supabase.storage.from('store-assets').list();
  console.log('STORE_ASSETS_FILES:', files);
}

inspectSupabaseProfiles();
