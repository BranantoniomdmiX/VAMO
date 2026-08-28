'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ [VAMO PWA] Service Worker registrado exitosamente con scope:', registration.scope)

            // Comprobar actualizaciones del service worker periódicamente
            registration.onupdatefound = () => {
              const installingWorker = registration.installing
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🚀 [VAMO PWA] Nueva versión disponible en segundo plano.')
                  }
                }
              }
            }
          })
          .catch((error) => {
            console.warn('⚠️ [VAMO PWA] Error al registrar Service Worker:', error)
          })
      })
    }
  }, [])

  return null
}
