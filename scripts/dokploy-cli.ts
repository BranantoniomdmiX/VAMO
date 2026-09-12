import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'

// Credenciales Dokploy en Oracle Cloud
const DOKPLOY_HOST = process.env.DOKPLOY_HOST || '163.192.147.231'
const DOKPLOY_PORT = parseInt(process.env.DOKPLOY_PORT || '3000', 10)
const DOKPLOY_EMAIL = process.env.DOKPLOY_EMAIL || 'branantoniomd@gmail.com'
const DOKPLOY_PASSWORD = process.env.DOKPLOY_PASSWORD || ''
if (!DOKPLOY_PASSWORD && process.env.NODE_ENV === 'production') {
  throw new Error('FAIL_CLOSED: Falta DOKPLOY_PASSWORD')
}

class DokployClient {
  private cookie: string = ''

  async request<T = any>(endpoint: string, method: string = 'GET', data?: any): Promise<{ status: number; data: T }> {
    return new Promise((resolve, reject) => {
      const payload = data ? JSON.stringify(data) : undefined
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      }
      if (payload) {
        headers['Content-Type'] = 'application/json'
        headers['Content-Length'] = Buffer.byteLength(payload).toString()
      }
      if (this.cookie) {
        headers['Cookie'] = this.cookie
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
          if (res.headers['set-cookie']) {
            this.cookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ')
          }
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

  async login(): Promise<boolean> {
    console.log(`🔌 [Dokploy CLI] Conectando a http://${DOKPLOY_HOST}:${DOKPLOY_PORT}...`)
    try {
      // Endpoint tRPC oficial de Dokploy para login: /api/trpc/user.login
      const payload = {
        email: DOKPLOY_EMAIL,
        password: DOKPLOY_PASSWORD,
      }
      const res = await this.request('/api/trpc/user.login?batch=1', 'POST', {
        0: {
          json: payload
        }
      })
      if (res.status === 200 && this.cookie) {
        console.log('✅ [Dokploy CLI] Sesión autenticada con éxito.')
        return true
      }
      console.log(`ℹ️ [Dokploy CLI] Login respondió status ${res.status}. Cookie obtenida:`, this.cookie ? 'Sí' : 'No')
      return !!this.cookie
    } catch (err: any) {
      console.error('❌ [Dokploy CLI Error]:', err.message)
      return false
    }
  }

  async listProjects() {
    return this.request('/api/trpc/project.all?input=%7B%7D')
  }

  async getPostgresServices() {
    return this.request('/api/trpc/postgres.all?input=%7B%7D')
  }
}

async function main() {
  const client = new DokployClient()
  const logged = await client.login()
  if (!logged) {
    console.error('No se pudo conectar a Dokploy.')
    process.exit(1)
  }

  console.log('📦 [Dokploy CLI] Consultando proyectos...')
  try {
    const projects = await client.listProjects()
    console.log('Proyectos:', JSON.stringify(projects.data, null, 2).slice(0, 300))
  } catch (e: any) {
    console.log('Nota consulta:', e.message)
  }
}

main()
