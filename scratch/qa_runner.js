const http = require('http');

const PORT = 3333;
const BASE_URL = `http://localhost:${PORT}`;

const routes = [
  '/',
  '/auth/login',
  '/auth/register-biz',
  '/auth/register-driver',
  '/auth/register-customer',
  '/biz',
  '/biz/kds',
  '/biz/manager',
  '/biz/catalog',
  '/biz/finances',
  '/biz/settings',
  '/customer',
  '/customer/home',
  '/customer/quote',
  '/customer/radar',
  '/customer/combo-errand',
  '/customer/tracking/DEMO-123',
  '/driver',
  '/driver/home',
  '/driver/offer',
  '/driver/navigation',
  '/driver/pod',
  '/driver/wallet',
  '/base',
  '/base/dispatch',
  '/base/radar',
  '/base/routes-tracking',
  '/base/call-register',
  '/base/cashier',
  '/base/warehouse',
  '/owner',
  '/owner/dashboard',
  '/owner/kyc',
  '/owner/rates',
  '/owner/wallets',
  '/owner/agreements',
  '/owner/payments',
  '/admin',
  '/admin/control-tower',
  '/admin/crm',
  '/admin/dashboard',
  '/admin/fleets',
  '/admin/new-fleet',
  '/admin/plans',
  '/admin/infrastructure',
  '/kds/auth',
  '/kds/display'
];

function fetchRoute(route) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${route}`;
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const buttonCount = (data.match(/<button/g) || []).length;
        const linkCount = (data.match(/<a\s/g) || []).length;
        const inputCount = (data.match(/<input/g) || []).length;

        resolve({
          route,
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          buttonCount,
          linkCount,
          inputCount,
          bytes: Buffer.byteLength(data)
        });
      });
    }).on('error', (err) => {
      resolve({
        route,
        status: 'ERROR',
        ok: false,
        error: err.message
      });
    });
  });
}

async function runQA() {
  console.log('========================================================================');
  console.log('🤖 SKILL-AGENTE QA ENGINE — AUDITORÍA AUTOMÁTICA COMPLETA DE VAMO (33 RUTAS)');
  console.log(`Probando ${routes.length} rutas nativas en ${BASE_URL}...`);
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  let totalButtons = 0;
  let totalLinks = 0;
  let totalInputs = 0;

  for (const r of routes) {
    const res = await fetchRoute(r);
    if (res.ok) {
      passed++;
      totalButtons += res.buttonCount;
      totalLinks += res.linkCount;
      totalInputs += res.inputCount;
      console.log(`✅ [HTTP ${res.status}] ${res.route.padEnd(32)} ➔ ${res.buttonCount} botones, ${res.linkCount} links, ${res.inputCount} inputs (${(res.bytes/1024).toFixed(1)} KB)`);
    } else {
      failed++;
      console.log(`❌ [FAIL ${res.status}] ${res.route.padEnd(32)} ➔ Error: ${res.error || 'Respuesta inválida'}`);
    }
  }

  console.log('\n========================================================================');
  console.log(`📊 RESULTADO AUDITORÍA DE BOTONES & NAVEGACIÓN:`);
  console.log(`- Rutas probadas: ${passed}/${routes.length} (${(passed/routes.length*100).toFixed(0)}% Éxito)`);
  console.log(`- Elementos Interactivos Auditados: ${totalButtons} Botones | ${totalLinks} Enlaces | ${totalInputs} Inputs`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runQA();
