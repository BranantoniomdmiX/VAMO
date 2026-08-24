// public/firebase-messaging-sw.js — Service Worker de Notificaciones Push VAMO
// Maneja la recepción de alertas en segundo plano (pantalla apagada o app minimizada)

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Manejo del evento PUSH
self.addEventListener('push', (event) => {
  let data = {
    title: 'VAMO Logística Urbana',
    body: 'Tienes una nueva actualización de tu servicio.',
    icon: '/icons/icon-customer-exact-512.png',
    badge: '/logos/icon-logo.png',
    url: '/customer/home',
    vibrate: [200, 100, 200, 100, 200]
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = {
        title: payload.notification?.title || payload.title || data.title,
        body: payload.notification?.body || payload.body || data.body,
        icon: payload.notification?.icon || payload.icon || data.icon,
        badge: data.badge,
        url: payload.data?.url || payload.url || data.url,
        data: payload.data || {},
        vibrate: payload.vibrate || [250, 100, 250]
      }
    } catch {
      data.body = event.data.text()
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: data.vibrate,
    data: {
      url: data.url,
      ...data.data
    },
    actions: [
      { action: 'open_url', title: 'Ver Detalles 🚀' },
      { action: 'dismiss', title: 'Entendido' }
    ],
    tag: data.data?.tag || 'vamo-service-alert',
    renotify: true
  }

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  )
})

// Manejo del clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una pestaña abierta de VAMO, enfocarla y navegar
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Si no hay pestaña abierta, abrir una nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
