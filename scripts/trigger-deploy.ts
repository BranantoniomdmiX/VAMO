import http from 'http'
import fs from 'fs'
import path from 'path'

// Credenciales Dokploy
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

async function triggerDeploy() {
  console.log('🚀 Desplegando en Dokploy vía API...');
  const res = await dokployRequest('/api/trpc/application.deploy', 'POST', {
    json: {
      applicationId: 'SQQlo0V6FVzRvVqPlCOit'
    }
  });
  console.log('Deploy Status:', res.status);
}

triggerDeploy();
