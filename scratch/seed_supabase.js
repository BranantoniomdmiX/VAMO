const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(url, key);

async function seedData() {
  console.log('⚡ Conectando a Supabase para verificar e inyectar registros iniciales...');

  // 1. Tenant demo
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const { data: tenant, error: tErr } = await supabase.from('tenants').upsert({
    id: tenantId,
    name: 'VAMO Flota Centro Demo',
    slug: 'flota-centro',
    status: 'active',
    created_at: new Date().toISOString()
  }).select();

  if (tErr) console.log('Notice Tenant:', tErr.message);
  else console.log('✓ Tenant activo configurado:', tenantId);

  // 2. Profile demo
  const profileId = '00000000-0000-0000-0000-000000000002';
  const { data: profile, error: pErr } = await supabase.from('profiles').upsert({
    id: profileId,
    role: 'driver',
    full_name: 'Carlos Motomandado (Rider #1)',
    phone: '+525512345678',
    created_at: new Date().toISOString()
  }).select();

  if (pErr) console.log('Notice Profile:', pErr.message);
  else console.log('✓ Profile Rider configurado:', profileId);

  console.log('✅ Verificación y Sembrado de Supabase completado con éxito.');
}

seedData();
