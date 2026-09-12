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

async function setupUsers() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    INSERT INTO auth.users (id, email)
    VALUES 
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test_a@vamo.mx'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'test_b@vamo.mx')
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('✅ Usuarios dummy creados en auth.users.');
  await pool.end();
}

setupUsers().catch(console.error);
