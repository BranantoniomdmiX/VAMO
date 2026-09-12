// VAMO Progressive Web App (PWA) Service Worker v3.0
// Resilient Offline Cache Engine & Strict Resource-Segregated Strategies

const CACHE_NAME = 'vamo-offline-cache-v3'
const TILES_CACHE_NAME = 'vamo-map-tiles-v1'

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/logo-vamo.svg',
  '/customer/home',
  '/driver/home',
  '/biz'
]

// Instalación: Precargar recursos estáticos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response)
              }
            })
            .catch(() => {
              // Silencioso si alguna ruta falla durante el install
            })
        )
      )
    })
  )
  self.skipWaiting()
})

// Activación: Limpieza rigurosa de caches obsoletos
self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE_NAME, TILES_CACHE_NAME]
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!allowedCaches.includes(key)) {
            console.log('🧹 [VAMO PWA SW] Limpiando cache obsoleto:', key)
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Manejo de mensajes (para recarga segura o skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Estrategia de Fetch Dinámica por Tipo de Recurso
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar peticiones no-GET, WebSockets o endpoints de streaming/socket
  if (request.method !== 'GET') return
  if (url.protocol.startsWith('ws')) return
  if (url.pathname.startsWith('/api/')) {
    // Para APIs, pasar directo a la red
    return
  }

  // ==========================================
  // 1. Map Tiles & Vector Tile Protocols
  // ==========================================
  const isMapTile =
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('basemaps.cartocdn.com') ||
    url.hostname.includes('openfreemap.org') ||
    url.hostname.includes('tiles.openfreemap.org') ||
    url.pathname.includes('/tiles/') ||
    url.pathname.endsWith('.pbf')

  if (isMapTile) {
    // Network First con fallback a caché de teselas. JAMÁS retornar logo-vamo.svg
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone()
            caches.open(TILES_CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return networkResponse
        })
        .catch(async () => {
          const cachedTile = await caches.match(request)
          if (cachedTile) {
            return cachedTile
          }
          // Error controlado sin romper la tubería gráfica del canvas
          return new Response(null, { status: 504, statusText: 'Tile Gateway Timeout' })
        })
    )
    return
  }

  // ==========================================
  // 2. Recursos Estáticos de Aplicación (JS, CSS, Fuentes)
  // ==========================================
  const isAppStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'

  if (isAppStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidación en segundo plano
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse))
              }
            })
            .catch(() => {})
          return cachedResponse
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return networkResponse
        })
      })
    )
    return
  }

  // ==========================================
  // 3. Imágenes de Interfaz (No Tiles)
  // ==========================================
  const isImage =
    request.destination === 'image' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/logos/')

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            }
            return networkResponse
          })
          .catch(async () => {
            // Solo para imágenes de UI generales retornar logo si existe
            const fallbackLogo = await caches.match('/logo-vamo.svg')
            return fallbackLogo || new Response(null, { status: 404 })
          })
      })
    )
    return
  }

  // ==========================================
  // 4. Navegación de páginas HTML (Documentos)
  // ==========================================
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 2500)
          )
          const networkResponse = (await Promise.race([fetch(request), timeoutPromise])) as Response

          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))
            return networkResponse
          }
        } catch {
          // Conexión caída o timeout
        }

        const cachedMatch = await caches.match(request)
        if (cachedMatch) {
          return cachedMatch
        }

        const fallbackPage =
          (await caches.match('/offline')) ||
          (await caches.match('/customer/home')) ||
          (await caches.match('/'))
        if (fallbackPage) {
          return fallbackPage
        }

        return new Response(
          `<!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VAMO — Modo Fuera de Línea</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FCF9F8; color: #1C1B1B; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
              .card { background: #FFFFFF; border-radius: 28px; padding: 32px 24px; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; }
              .badge { background: #FFF3E0; color: #E65100; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 16px; }
              h1 { font-size: 22px; font-weight: 900; margin: 0 0 10px; color: #0040A1; }
              p { font-size: 14px; color: #64748B; line-height: 1.5; margin: 0 0 24px; }
              .btn { background: #0040A1; color: #FFFFFF; border: none; padding: 14px 28px; border-radius: 9999px; font-size: 14px; font-weight: 800; cursor: pointer; text-decoration: none; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="card">
              <span class="badge">📡 MODO FUERA DE LÍNEA</span>
              <h1>Sin Conexión a Internet</h1>
              <p>No tienes acceso a internet en este momento. La aplicación se sincronizará automáticamente tan pronto recuperes la señal.</p>
              <button class="btn" onclick="window.location.reload()">🔄 Reintentar Conexión</button>
            </div>
          </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      })()
    )
  }
})
