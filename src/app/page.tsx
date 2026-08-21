'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    try {
      const activeRole = localStorage.getItem('vamo_active_role')
      if (activeRole === 'driver') {
        router.replace('/driver/home')
      } else if (activeRole === 'merchant' || activeRole === 'biz') {
        router.replace('/biz')
      } else if (activeRole === 'dispatcher' || activeRole === 'base') {
        router.replace('/base/dispatch')
      } else if (activeRole === 'fleet_owner' || activeRole === 'owner') {
        router.replace('/owner/dashboard')
      } else if (activeRole === 'superadmin' || activeRole === 'admin') {
        router.replace('/admin/dashboard')
      } else {
        // Por defecto: Entrada directa inmediata a la app del cliente
        router.replace('/customer/home')
      }
    } catch {
      router.replace('/customer/home')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex justify-center">
          <img 
            src="/logo-vamo.svg" 
            alt="VAMO" 
            className="h-20 sm:h-24 w-auto object-contain animate-pulse" 
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-extrabold text-[#0056d2]">
            Tú Pides. Nosotros Vamos.
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <span className="w-2 h-2 rounded-full bg-[#c3f400] animate-ping" />
            <span className="text-xs text-[#737785] font-semibold">Iniciando aplicación...</span>
          </div>
        </div>
      </div>
    </div>
  )
}


