import http from 'http'

// Credenciales y API Key de Dokploy
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
        timeout: 10000,
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

async function testDokployTunnel() {
  console.log('🚀 [Dokploy Direct Tunnel] Probando conexion con x-api-key...')
  try {
    // 1. Probar consulta de proyectos
    const projectsRes = await dokployRequest('/api/trpc/project.all?input=%7B%7D')
    console.log('📡 [Status Proyectos]:', projectsRes.status)
    if (projectsRes.status === 200) {
      console.log('✅ [Túnel Dokploy]: Conexión exitosa y autorizada al 100%!')
      console.log('Proyectos encontrados:', JSON.stringify(projectsRes.data, null, 2).slice(0, 500))
    } else {
      console.log('Respuesta:', JSON.stringify(projectsRes.data, null, 2))
    }

    // 2. Probar consulta de servicios postgres
    const postgresRes = await dokployRequest('/api/trpc/postgres.all?input=%7B%7D')
    console.log('🐘 [Status Postgres Services]:', postgresRes.status)
    if (postgresRes.status === 200) {
      console.log('Servicios Postgres:', JSON.stringify(postgresRes.data, null, 2).slice(0, 500))
    }
  } catch (err: any) {
    console.error('❌ Error en el túnel:', err.message)
  }
}

testDokployTunnel()
