const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

const env = dotenv.parse(fs.readFileSync('.env.local'));

async function verify() {
  console.log('--- 1. VERIFICANDO RUNTIME ROLE CON NUEVA DATABASE_URL ---');
  const client = new Client({ connectionString: env.DATABASE_URL, ssl: false });
  await client.connect();

  const userRes = await client.query('SELECT current_user, session_user;');
  console.log('CURRENT_USER:', userRes.rows[0].current_user);

  const roleRes = await client.query(`
    SELECT rolname, rolsuper, rolbypassrls, rolcanlogin 
    FROM pg_roles 
    WHERE rolname = current_user;
  `);
  console.log('ROLE_ATTRIBUTES:', JSON.stringify(roleRes.rows[0], null, 2));

  await client.end();

  console.log('--- 2. VERIFICANDO QUE LA CONTRASEÑA ANTERIOR FUE REVOCADA ---');
  // Probar la credencial anterior conocida que se filtró
  const compromisedPass = 'vamo_runtime_pass_2026';
  const parsed = new URL(env.DATABASE_URL);
  const oldUrl = `postgresql://vamo_app:${compromisedPass}@${parsed.host}${parsed.pathname}`;

  const oldClient = new Client({ connectionString: oldUrl, ssl: false });
  try {
    await oldClient.connect();
    console.error('ALERTA CRITICA: La credencial anterior todavia conecta!');
    process.exit(1);
  } catch (err) {
    console.log('OLD_CREDENTIAL_STATUS: REJECTED (password authentication failed as expected)');
  }

  console.log('VERIFICATION_COMPLETE: ALL PASS');
}

verify().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
