'use client'

import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Comprobación de estado inicial
    setIsOffline(!navigator.onLine)

    const handleOffline = () => {
      setIsOffline(true)
      setShowReconnected(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
      }, 3500)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showReconnected) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] pointer-events-auto transition-all animate-bounce-short">
      {isOffline ? (
        <div className="bg-[#1C1B1B]/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl border-2 border-[#FF5722] shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FF5722] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <WifiOff className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF5722] animate-ping shrink-0" />
                <strong className="text-xs sm:text-sm font-black text-[#FF5722] block truncate">
                  Sin Internet / Fuera de Línea
                </strong>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-tight">
                Puedes seguir usando la app en caché. Todo se sincronizará automáticamente al volver la conexión.
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-white/10 hover:bg-white/20 active:scale-95 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1"
            title="Reintentar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="bg-[#161e00]/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl border-2 border-[#C3F400] shadow-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C3F400] text-[#161e00] flex items-center justify-center shrink-0 shadow-sm">
            <Wifi className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <strong className="text-xs sm:text-sm font-black text-[#C3F400] block truncate">
              ¡Conexión Restaurada!
            </strong>
            <p className="text-[11px] text-slate-200 font-medium leading-tight">
              Sincronizando datos y reactivando radares en tiempo real...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
