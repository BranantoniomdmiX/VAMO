'use client'

import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, ArrowLeft, Home, ShoppingBag, Bike } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    setIsChecking(true)
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload()
      } else {
        setIsChecking(false)
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-4 selection:bg-[#0040A1] selection:text-white">
      <div className="w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-xl text-center relative overflow-hidden">
        {/* Header decorativo */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-[#FF5722] via-[#0040A1] to-[#C3F400]" />

        {/* Icono de estado */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-[#FF5722] mb-6 shadow-inner">
          <WifiOff className="w-10 h-10 animate-pulse" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-black tracking-wide uppercase mb-3">
          <span className="w-2 h-2 rounded-full bg-[#FF5722] animate-ping" />
          Modo Fuera de Línea
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#0040A1] tracking-tight mb-2">
          Sin Conexión a Internet
        </h1>

        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
          No te preocupes. Puedes seguir navegando por las pantallas guardadas en tu dispositivo. En cuanto recuperes señal, tus datos y pedidos se sincronizarán automáticamente.
        </p>

        {/* Botón Principal de Reintentar */}
        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="w-full bg-[#0040A1] hover:bg-[#003080] text-white py-4 px-6 rounded-2xl font-black text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Comprobando conexión...' : 'Reintentar Conexión'}</span>
        </button>

        {/* Accesos rápidos a secciones en caché */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Explorar Secciones Guardadas
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/customer/home"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-[#0040A1]/5 border border-slate-100 text-slate-700 transition-all text-xs font-bold gap-1.5"
            >
              <Home className="w-4 h-4 text-[#0040A1]" />
              <span className="truncate">Cliente</span>
            </Link>
            <Link
              href="/driver/home"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-[#0040A1]/5 border border-slate-100 text-slate-700 transition-all text-xs font-bold gap-1.5"
            >
              <Bike className="w-4 h-4 text-[#FF5722]" />
              <span className="truncate">Chofer</span>
            </Link>
            <Link
              href="/biz"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-[#0040A1]/5 border border-slate-100 text-slate-700 transition-all text-xs font-bold gap-1.5"
            >
              <ShoppingBag className="w-4 h-4 text-[#161e00]" />
              <span className="truncate">Comercio</span>
            </Link>
          </div>
        </div>

        {/* Estado en vivo */}
        <div className="mt-6 text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {isOnline ? 'Señal detectada. Pulsa Reintentar.' : 'Dispositivo desconectado de la red.'}
        </div>
      </div>
    </div>
  )
}
