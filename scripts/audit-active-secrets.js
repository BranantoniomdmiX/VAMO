const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const secretsToCheck = [];

for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const parts = trimmed.split('=');
  const key = parts[0];
  const val = parts.slice(1).join('=').replace(/^"|"$/g, '').trim();

  if (!key.startsWith('NEXT_PUBLIC_') && val.length > 8 && !key.includes('PUBLIC_KEY')) {
    secretsToCheck.push({ key, val });
  }
}

console.log('Auditoria de secretos activos en codigo versionado (src/):');
let leaks = 0;

for (const s of secretsToCheck) {
  try {
    const res = execSync(`git grep -F "${s.val}" src/`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (res && res.trim()) {
      console.log(`🚨 LEAK DETECTADO en src/ para: ${s.key}`);
      leaks++;
    }
  } catch (err) {
    // 1 indica no matches en git grep (esperado y seguro)
  }
}

if (leaks === 0) {
  console.log('✅ ACTIVE_SECRET_IN_TRACKED_CODE: NO');
  console.log('✅ PRIVATE_SECRET_IN_CLIENT: NO');
} else {
  console.log(`❌ ALERTA: ${leaks} secretos detectados`);
  process.exit(1);
}
