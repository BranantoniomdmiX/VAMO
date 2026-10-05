// Script para aprovisionar y rotar el rol de runtime vamo_app en PostgreSQL Dokploy
// Requiere DATABASE_ADMIN_URL para mantenimiento
// Soporta VAMO_APP_DB_PASSWORD explícito o genera criptográficamente uno nuevo
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const envPath = path.resolve(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('FAIL_CLOSED: No se encontró el archivo .env.local');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath, 'utf8'));

const adminDbUrl = envConfig.DATABASE_ADMIN_URL || (envConfig.DATABASE_URL && envConfig.DATABASE_URL.includes('vamo_admin') ? envConfig.DATABASE_URL : null);

if (!adminDbUrl) {
  console.error('FAIL_CLOSED: Falta DATABASE_ADMIN_URL para aprovisionar o rotar el rol de runtime');
  process.exit(1);
}

// Obtener contraseña provista por variable de entorno o generar un secreto criptográfico no predecible
const appPassword = process.env.VAMO_APP_DB_PASSWORD || crypto.randomBytes(32).toString('base64url');

if (!appPassword || appPassword.length < 16) {
  console.error('FAIL_CLOSED: La contraseña provista no cumple con la longitud mínima requerida');
  process.exit(1);
}

const adminPool = new Pool({ connectionString: adminDbUrl, ssl: false });

async function setupRuntimeRole() {
  const client = await adminPool.connect();

  try {
    await client.query('BEGIN');

    // 1. Crear o actualizar rol vamo_app estrictamente sin privilegios superusuario ni bypassrls
    const checkRole = await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'vamo_app'");
    // Escapar de forma segura para sentencia DDL (base64url no contiene comillas ni caracteres especiales)
    const sanitizedPassword = appPassword.replace(/[^a-zA-Z0-9_\-]/g, '');
    if (checkRole.rows.length === 0) {
      await client.query(`
        CREATE ROLE vamo_app WITH 
          LOGIN 
          NOSUPERUSER 
          NOBYPASSRLS 
          NOCREATEDB 
          NOCREATEROLE 
          NOREPLICATION 
          PASSWORD '${sanitizedPassword}';
      `);
    } else {
      await client.query(`
        ALTER ROLE vamo_app WITH 
          LOGIN 
          NOSUPERUSER 
          NOBYPASSRLS 
          NOCREATEDB 
          NOCREATEROLE 
          NOREPLICATION 
          PASSWORD '${sanitizedPassword}';
      `);
    }

    // 2. Permisos mínimos indispensables (Deny-by-default)
    await client.query('GRANT CONNECT ON DATABASE vamo_production TO vamo_app;');
    await client.query('GRANT USAGE ON SCHEMA public TO vamo_app;');

    // Revocar acceso al schema auth para vamo_app
    await client.query('REVOKE ALL ON SCHEMA auth FROM vamo_app;');
    await client.query('REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM vamo_app;');
    await client.query('REVOKE ALL ON ALL ROUTINES IN SCHEMA auth FROM vamo_app;');

    // Tablas y secuencias públicas
    await client.query('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vamo_app;');
    await client.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vamo_app;');

    // Deny-by-default en funciones
    await client.query('REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM vamo_app;');
    await client.query('REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA auth FROM vamo_app;');
    await client.query('REVOKE USAGE ON SCHEMA auth FROM vamo_app;');

    // Evitar que futuras funciones creadas por vamo_admin sean ejecutables por PUBLIC
    await client.query('ALTER DEFAULT PRIVILEGES FOR ROLE vamo_admin IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;');

    // GRANT explícito ÚNICAMENTE a funciones aprobadas para runtime con verificación de contexto
    const approvedFunctions = [
      'assign_order_atomic(uuid, uuid)',
      'update_kds_order_status(uuid, text)',
      'verify_order_pod(uuid, text, text, numeric, numeric)',
      'request_wallet_withdrawal(uuid, numeric, text)',
      'current_app_user_id()',
      'current_app_role()',
      'current_app_franchise_id()'
    ];

    for (const fn of approvedFunctions) {
      await client.query(`GRANT EXECUTE ON FUNCTION public.${fn} TO vamo_app;`);
    }

    // Funciones críticas que DEBEN permanecer inaccesibles para PUBLIC y vamo_app
    const forbiddenFunctions = [
      'process_order_settlement(uuid)',
      'ensure_wallet_account(uuid)',
      'process_wallet_payout(uuid, numeric, text)',
      'register_bank_account(uuid, text, text, text)',
      'register_device_token(uuid, text, text)'
    ];

    for (const fn of forbiddenFunctions) {
      await client.query(`REVOKE EXECUTE ON FUNCTION public.${fn} FROM PUBLIC, vamo_app;`);
    }

    // 3. Forzar RLS en todas las tablas maestras
    const tables = [
      'bank_accounts', 'cities', 'device_tokens', 'drivers', 'franchises',
      'merchants', 'orders', 'products', 'profiles', 'territories',
      'wallet_accounts', 'wallet_transactions'
    ];

    for (const tbl of tables) {
      await client.query(`ALTER TABLE public.${tbl} FORCE ROW LEVEL SECURITY;`);
    }

    await client.query('COMMIT');

    // 4. Actualizar .env.local con la nueva DATABASE_URL sin imprimir la contraseña
    const parsed = new URL(adminDbUrl);
    const runtimeUrl = `postgresql://vamo_app:${encodeURIComponent(appPassword)}@${parsed.host}${parsed.pathname}`;

    const rawEnv = fs.readFileSync(envPath, 'utf8');
    let updatedEnv = '';
    let hasAdmin = false;
    let hasRuntime = false;

    for (const line of rawEnv.split('\n')) {
      if (line.trim().startsWith('DATABASE_URL=')) {
        updatedEnv += `DATABASE_URL=${runtimeUrl}\n`;
        hasRuntime = true;
      } else if (line.trim().startsWith('DATABASE_ADMIN_URL=')) {
        updatedEnv += `DATABASE_ADMIN_URL=${adminDbUrl}\n`;
        hasAdmin = true;
      } else {
        updatedEnv += line + '\n';
      }
    }

    if (!hasAdmin) {
      updatedEnv = `DATABASE_ADMIN_URL=${adminDbUrl}\n` + updatedEnv;
    }
    if (!hasRuntime) {
      updatedEnv += `DATABASE_URL=${runtimeUrl}\n`;
    }

    fs.writeFileSync(envPath, updatedEnv.trim() + '\n', 'utf8');
    console.log('✅ Runtime role vamo_app aprovisionado/rotado con éxito y .env.local actualizado de forma segura.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error configurando rol de runtime:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await adminPool.end();
  }
}

setupRuntimeRole();
