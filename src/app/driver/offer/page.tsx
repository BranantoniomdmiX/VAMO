'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { MapPin, Navigation, Clock, Check, X, ArrowLeft, Loader2, AlertCircle, Bike, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface OfferData {
  id: string
  code: string
  originName: string
  originAddress: string
  destinationName: string
  destinationAddress: string
  earnings: number
  paymentMethod: string
  distanceKm: number
  status: string
}

function DriverOfferContent() {
  const [timeLeft, setTimeLeft] = useState(15)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeOffer, setActiveOffer] = useState<OfferData | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const driverId = searchParams.get('driverId') || 'c7e8d9a0-b1c2-4d3e-8f9a-0b1c2d3e4f5a'

  // 1. Cargar oferta real desde Supabase
  useEffect(() => {
    async function fetchOffer() {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/dispatch/active-offer${orderId ? `?orderId=${orderId}` : ''}`, {
          cache: 'no-store'
        })
        const data = await res.json()
        if (res.ok && data.hasOffer && data.offer) {
          setActiveOffer(data.offer)
          setTimeLeft(15)
        } else {
          setActiveOffer(null)
        }
      } catch (err) {
        console.warn('Error consultando oferta activa:', err)
        setActiveOffer(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOffer()
  }, [orderId])

  // 2. Cronómetro regresivo solo si hay oferta viva
  useEffect(() => {
    if (!activeOffer) return

    if (timeLeft <= 0) {
      if (!isSubmitting) {
        setErrorMessage('La oferta de viaje expiró o fue reasignada.')
      }
      return
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isSubmitting, activeOffer])

  const handleAcceptOrder = async () => {
    if (!activeOffer || isSubmitting || timeLeft <= 0) return
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/dispatch/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: activeOffer.id, driverId })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Redirigir a la pantalla de navegación GPS
        router.push(`/driver/navigation?orderId=${activeOffer.id}&code=${data.order_code || activeOffer.code}`)
      } else {
        setErrorMessage(data.message || 'No fue posible aceptar este viaje.')
      }
    } catch {
      setErrorMessage('Error de conexión con el servidor. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Estado de Carga Inicial
  if (isLoading) {
    return (
      <MobileDriverLayout>
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#0056d2]" />
          <span className="text-xs font-black uppercase tracking-wider">Verificando Viajes en Base Operativa...</span>
        </div>
      </MobileDriverLayout>
    )
  }

  // Estado Limpio (Sin Viajes en Espera)
  if (!activeOffer) {
    return (
      <MobileDriverLayout>
        <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
          
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0056d2] flex items-center justify-center shadow-inner">
            <Bike className="w-8 h-8 text-[#0056d2]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900">Radar de Conductor Activo</h2>
            <p className="text-xs font-bold text-slate-500 max-w-xs leading-relaxed">
              No tienes viajes pendientes en este momento. Tu GPS está transmitiendo en vivo a la Base Operativa y recibirás una alerta en cuanto un comercio o cliente solicite un servicio.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-black">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sistema Conectado &bull; Base de Datos Limpia</span>
          </div>

          <Link
            href="/driver/home"
            className="w-full max-w-xs bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-2xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Mi Panel de Conductor</span>
          </Link>
        </div>
      </MobileDriverLayout>
    )
  }

  return (
    <MobileDriverLayout>
      <div className="p-5 space-y-5">
        
        {/* Header Oferta */}
        <header className="flex justify-between items-center pt-2">
          <Link href="/driver/home" className="p-2 rounded-full bg-[#f0eded] text-[#1c1b1b]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-extrabold text-sm text-[#0056d2]">Oferta #{activeOffer.code}</span>
          <div className="w-8" />
        </header>

        {/* Alerta de Error / Orden Tomada */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 animate-fade-in shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-black block">Aviso del Despacho</strong>
              <p>{errorMessage}</p>
              <Link href="/driver/home" className="inline-block mt-2 font-bold underline text-rose-900">
                Volver al Radar de Conductores
              </Link>
            </div>
          </div>
        )}

        {/* Cronómetro Táctil de Aceptación */}
        <div className="bg-[#fff9db] text-[#744210] p-4 rounded-[24px] text-center space-y-1 shadow-xs border border-[#ffe066]">
          <span className="text-[10px] font-black uppercase tracking-wider block">TIEMPO PARA ACEPTAR</span>
          <div className="text-3xl sm:text-4xl font-black flex items-center justify-center gap-1.5 text-amber-900">
            <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
            <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
          </div>
        </div>

        {/* Tarjeta de Ganancia Estimada */}
        <div className="bg-[#0040a1] text-white p-6 rounded-[28px] text-center space-y-1 shadow-md relative overflow-hidden border border-blue-800">
          <span className="text-xs font-black text-blue-200 uppercase tracking-wider block">GANANCIA TOTAL ESTIMADA</span>
          <p className="text-5xl font-black text-[#c3f400]">${Number(activeOffer.earnings).toFixed(2)}</p>
          <span className="text-xs font-black text-slate-900 bg-[#c3f400] px-3.5 py-1 rounded-full inline-block mt-2 shadow-xs">
            {activeOffer.paymentMethod === 'CASH' ? '💵 Cobro en Efectivo con Cliente' : '💳 Pago Digital Acreditado'}
          </span>
        </div>

        {/* Detalles de Ruta (Origen & Destino) */}
        <div className="bg-white p-5 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-4">
          {/* Origen */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0056d2] flex items-center justify-center font-bold shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase block">ORIGEN (RECOGER)</span>
              <strong className="text-sm font-black text-slate-900">{activeOffer.originName}</strong>
              <p className="text-xs font-semibold text-slate-600">{activeOffer.originAddress}</p>
            </div>
          </div>

          <div className="ml-4 border-l-2 border-dashed border-slate-200 h-4" />

          {/* Destino */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-bold shrink-0 mt-0.5">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase block">DESTINO (ENTREGAR)</span>
              <strong className="text-sm font-black text-slate-900">{activeOffer.destinationName}</strong>
              <p className="text-xs font-semibold text-slate-600">{activeOffer.destinationAddress}</p>
            </div>
          </div>
        </div>

        {/* Botones de Acción Gigantes Táctiles */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleAcceptOrder}
            disabled={isSubmitting || timeLeft <= 0}
            className="w-full bg-[#c3f400] hover:bg-[#abd600] disabled:bg-slate-200 disabled:text-slate-500 text-[#161e00] py-4 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>ASIGNANDO VIAJE...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>ACEPTAR VIAJE (${Number(activeOffer.earnings).toFixed(2)}) ⚡</span>
              </>
            )}
          </button>

          <Link
            href="/driver/home"
            className="w-full bg-slate-100 hover:bg-slate-200 text-rose-700 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
            <span>Rechazar Oferta</span>
          </Link>
        </div>
      </div>
    </MobileDriverLayout>
  )
}

export default function DriverOfferPage() {
  return (
    <Suspense fallback={
      <MobileDriverLayout>
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#0056d2]" />
          <span className="text-xs font-black uppercase tracking-wider">Cargando Oferta de Viaje...</span>
        </div>
      </MobileDriverLayout>
    }>
      <DriverOfferContent />
    </Suspense>
  )
}
