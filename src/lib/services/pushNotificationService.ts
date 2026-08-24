'use client'

import { audioService } from './audioService'

export interface PushTokenRegistration {
  userId?: string
  role: 'customer' | 'driver' | 'merchant' | 'base' | 'owner' | 'admin'
  deviceToken: string
  platform: 'android_apk' | 'pwa_mobile' | 'web_desktop'
  deviceInfo?: Record<string, unknown>
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null
  private currentToken: string | null = null

  /**
   * Inicializa y registra el Service Worker de notificaciones
   */
  async init(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('ℹ️ [PushService] Service Worker no disponible en este entorno.')
      return false
    }

    try {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      })
      this.swRegistration = reg
      console.log('✅ [PushService] Service Worker registrado exitosamente.')
      return true
    } catch (err) {
      console.warn('⚠️ [PushService] Error registrando Service Worker:', err)
      return false
    }
  }

  /**
   * Solicita permisos de notificación al usuario y registra el token en el backend
   */
  async requestPermissionAndRegister(
    role: 'customer' | 'driver' | 'merchant' | 'base' | 'owner' | 'admin' = 'customer',
    userId?: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'Este dispositivo no soporta notificaciones push.' }
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        return { success: false, error: 'Permiso de notificaciones denegado por el usuario.' }
      }

      await this.init()

      // Generar o recuperar token de dispositivo (hash persistente o token Web Push)
      let token = this.currentToken
      if (!token) {
        token = localStorage.getItem('vamo_push_device_token')
      }

      if (!token) {
        const randomSeed = Math.random().toString(36).substring(2) + Date.now().toString(36)
        token = `fcm_dev_${role}_${randomSeed}`
        localStorage.setItem('vamo_push_device_token', token)
      }
      this.currentToken = token

      // Detectar plataforma
      const isAndroid = /android/i.test(navigator.userAgent)
      const platform = isAndroid ? 'android_apk' : 'web_desktop'

      // Registrar en el backend
      const res = await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role,
          deviceToken: token,
          platform,
          deviceInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screen: `${window.innerWidth}x${window.innerHeight}`
          }
        })
      })

      if (!res.ok) {
        console.warn('⚠️ [PushService] Falló sincronización con backend, token guardado localmente.')
      }

      // Reproducir sonido de confirmación
      audioService.playStatusUpdateTone()

      return { success: true, token }
    } catch (err) {
      console.error('❌ [PushService] Error solicitando permisos:', err)
      return { success: false, error: 'Ocurrió un error al configurar las notificaciones.' }
    }
  }

  /**
   * Muestra una notificación local inmediata (incluso con la app abierta)
   */
  showLocalNotification(title: string, options?: NotificationOptions) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          this.swRegistration.showNotification(title, {
            icon: '/icons/icon-customer-exact-512.png',
            badge: '/logos/icon-logo.png',
            ...options
          })
        } else {
          new Notification(title, {
            icon: '/icons/icon-customer-exact-512.png',
            ...options
          })
        }
      } catch (err) {
        console.log('Error mostrando notificación local:', err)
      }
    }
  }

  /**
   * Verifica si ya están concedidos los permisos
   */
  hasPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false
    return Notification.permission === 'granted'
  }
}

export const pushNotificationService = new PushNotificationService()
