import http from 'http'

const DOKPLOY_HOST = '163.192.147.231'
const DOKPLOY_PORT = 3000
const DOKPLOY_API_KEY = process.env.DOKPLOY_API_KEY || ''

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

async function exposePostgresPort() {
  console.log('🔧 Configurando externalPort = 5432 en vamo-postgres...')
  const updateRes = await dokployRequest('/api/trpc/postgres.update', 'POST', {
    json: {
      postgresId: "qz-RNMNZdwGIwRew4FmMd",
      externalPort: 5432
    }
  });
  console.log('Update Status:', updateRes.status);
  console.log('Update Response:', JSON.stringify(updateRes.data, null, 2));

  console.log('\n🚀 Desplegando / reiniciando vamo-postgres con el puerto publicado...');
  const deployRes = await dokployRequest('/api/trpc/postgres.deploy', 'POST', {
    json: {
      postgresId: "qz-RNMNZdwGIwRew4FmMd"
    }
  });
  console.log('Deploy Status:', deployRes.status);
  console.log('Deploy Response:', JSON.stringify(deployRes.data, null, 2));
}

exposePostgresPort();
