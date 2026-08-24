'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Check, Loader2, X } from 'lucide-react'
import { pushNotificationService } from '@/lib/services/pushNotificationService'

interface PushNotificationBannerProps {
  role?: 'customer' | 'driver' | 'merchant' | 'base' | 'owner' | 'admin'
  userId?: string
}

export function PushNotificationBanner({ role = 'customer', userId }: PushNotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [isActivated, setIsActivated] = useState(false)

  useEffect(() => {
    // Si no está soportado o ya tiene permisos concedidos o el usuario cerró el banner, no mostrar
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const dismissed = localStorage.getItem(`vamo_push_banner_dismissed_${role}`)
    if (!dismissed && Notification.permission === 'default') {
      setIsVisible(true)
    } else if (Notification.permission === 'granted') {
      setIsActivated(true)
    }
  }, [role])

  const handleActivate = async () => {
    setIsActivating(true)
    const res = await pushNotificationService.requestPermissionAndRegister(role, userId)
    setIsActivating(false)

    if (res.success) {
      setIsActivated(true)
      pushNotificationService.showLocalNotification('🔔 ¡Notificaciones VAMO Activas!', {
        body: 'Recibirás avisos en tiempo real cuando tu moto esté en camino o haya un nuevo pedido.'
      })
      setTimeout(() => setIsVisible(false), 2500)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(`vamo_push_banner_dismissed_${role}`, 'true')
  }

  if (!isVisible && !isActivated) return null
  if (!isVisible) return null

  return (
    <div className="bg-[#161e00] text-white p-3.5 sm:p-4 rounded-[24px] border-2 border-[#c3f400]/40 shadow-lg flex items-center justify-between gap-3 animate-fade-in my-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-[#c3f400] text-[#161e00] flex items-center justify-center shrink-0 shadow-xs">
          {isActivated ? <Check className="w-5 h-5" /> : <Bell className="w-5 h-5 animate-bounce" />}
        </div>
        <div className="space-y-0.5 min-w-0">
          <strong className="text-xs sm:text-sm font-black text-[#c3f400] block truncate">
            {isActivated ? '¡Alertas Push Activadas!' : 'Activa Avisos en Vivo con Pantalla Apagada'}
          </strong>
          <p className="text-[11px] text-slate-300 font-medium truncate">
            {isActivated 
              ? 'Tu dispositivo recibirá sonidos de timbre y proximidad.' 
              : 'Entérate al instante cuando el repartidor esté a 50m o haya un nuevo viaje.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isActivated ? (
          <>
            <button
              onClick={handleActivate}
              disabled={isActivating}
              className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-3.5 py-1.5 rounded-full font-black text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Activando...</span>
                </>
              ) : (
                <span>🔔 Activar</span>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <span className="text-xs font-black text-[#c3f400] bg-[#c3f400]/20 px-3 py-1 rounded-full">
            Listo ✅
          </span>
        )}
      </div>
    </div>
  )
}
