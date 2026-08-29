import http from 'http'

const DOKPLOY_HOST = '163.192.147.231'
const DOKPLOY_PORT = 3000
const DOKPLOY_API_KEY = 'krysHjaGCjeowFNDdSHzHJOUhQIFXJJOhTRgmkgiXvrlxRHqMESgmWyvcmAKHVFM'

async function dokployRequest<T = any>(endpoint: string, method: string = 'GET', data?: any): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : undefined
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'x-api-key': DOKPLOY_API_KEY,
    }
    if (payload) {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = Buffer.byteLength(payload).toString()
    }

    const req = http.request(
      {
        host: DOKPLOY_HOST,
        port: DOKPLOY_PORT,
        path: endpoint,
        method,
        headers,
        timeout: 15000,
      },
      (res) => {
        let body = ''
        res.on('data', chunk => body += chunk)
        res.on('end', () => {
          try {
            const json = body ? JSON.parse(body) : {}
            resolve({ status: res.statusCode || 200, data: json as T })
          } catch {
            resolve({ status: res.statusCode || 200, data: body as unknown as T })
          }
        })
      }
    )

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Dokploy API request timeout'))
    })

    if (payload) req.write(payload)
    req.end()
  })
}

async function injectDatabaseUrlAndRedeploy() {
  console.log('🔍 Obteniendo variables actuales de la aplicación VAMO...');
  const appRes = await dokployRequest('/api/trpc/application.one?input=' + encodeURIComponent(JSON.stringify({ json: { applicationId: "SQQlo0V6FVzRvVqPlCOit" } })));
  const currentEnv = appRes.data?.result?.data?.json?.env || '';

  // Cadena interna Docker con 0 ms de latencia
  const dbEnv = '\nDATABASE_URL=postgresql://vamo_admin:tMEMwBsulRU5ZdulEp8g@vamo-db-5vojdb:5432/vamo_production\n';
  const newEnv = currentEnv.includes('DATABASE_URL') ? currentEnv : (currentEnv + dbEnv);

  console.log('💾 Guardando variables de entorno con DATABASE_URL interna...');
  const updateRes = await dokployRequest('/api/trpc/application.saveEnvironment', 'POST', {
    json: {
      applicationId: "SQQlo0V6FVzRvVqPlCOit",
      env: newEnv
    }
  });
  console.log('Update Env Status:', updateRes.status);

  console.log('\n🚀 Desplegando VAMO en Dokploy (Compilando y activando)...');
  const deployRes = await dokployRequest('/api/trpc/application.deploy', 'POST', {
    json: {
      applicationId: "SQQlo0V6FVzRvVqPlCOit"
    }
  });
  console.log('Deploy Status:', deployRes.status);
  console.log('Deploy Result:', JSON.stringify(deployRes.data, null, 2));
}

injectDatabaseUrlAndRedeploy();
