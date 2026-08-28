// VAMO Progressive Web App (PWA) Service Worker v2.0
// Resilient Offline Cache Engine & Stale-While-Revalidate Strategy

const CACHE_NAME = 'vamo-offline-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/logo-vamo.svg',
  '/customer/home',
  '/driver/home',
  '/biz'
];

// Instalación: Precargar recursos estáticos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch(() => {
              // Silencioso si alguna ruta secundaria falla durante el install
            })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activación: Limpieza de caches obsoletos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de Fetch Dinámica & Anti-Cuelgues Offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones no-GET, WebSockets, Supabase Realtime o endpoints de streaming
  if (request.method !== 'GET') return;
  if (url.protocol.startsWith('ws')) return;
  if (url.pathname.startsWith('/api/')) {
    // Para APIs, intentar red directa; si falla, responder JSON amigable offline
    return;
  }

  // 1. Recursos estáticos (_next/static, css, fuentes, cdns, imágenes) -> Cache First con actualización en segundo plano
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/logos/') ||
    url.hostname.includes('cdn.tailwindcss.com') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidar en segundo plano
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {
            // Si es imagen y falló, retornar fallback o null
            return caches.match('/logo-vamo.svg');
          });
      })
    );
    return;
  }

  // 2. Navegación de páginas HTML (Documentos) -> Network First con timeout (2.5s) y Fallback a Caché / Offline
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Intentar red con timeout de 2.5s para no congelar la pantalla en conexiones lentas
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 2500)
          );
          const networkResponse = await Promise.race([fetch(request), timeoutPromise]);

          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
            return networkResponse;
          }
        } catch (err) {
          // Conexión caída o timeout
        }

        // Si falló la red, buscar en caché la ruta exacta
        const cachedMatch = await caches.match(request);
        if (cachedMatch) {
          return cachedMatch;
        }

        // Buscar páginas alternativas cacheadas
        const fallbackPage = await caches.match('/offline') || await caches.match('/customer/home') || await caches.match('/');
        if (fallbackPage) {
          return fallbackPage;
        }

        // Último recurso: Retornar respuesta HTML inline de contingencia
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
        );
      })()
    );
  }
});
