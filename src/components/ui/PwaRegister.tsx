'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        console.log('🔄 [VAMO PWA] Nueva versión activada. Recargando de forma controlada...')
        window.location.reload()
      }
    })

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ [VAMO PWA] Service Worker registrado exitosamente:', registration.scope)

          // Forzar verificación de actualización en cada carga
          registration.update().catch(() => {})

          // Detectar si hay un worker instalado esperando activación
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          }

          registration.onupdatefound = () => {
            const installingWorker = registration.installing
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🚀 [VAMO PWA] Nueva versión disponible. Activando...')
                  installingWorker.postMessage({ type: 'SKIP_WAITING' })
                }
              }
            }
          }
        })
        .catch((error) => {
          console.warn('⚠️ [VAMO PWA] Error al registrar Service Worker:', error)
        })
    })
  }, [])

  return null
}
