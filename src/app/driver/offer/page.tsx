'use client'

import React, { useState, useEffect } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { MapPin, Navigation, DollarSign, Clock, Check, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DriverOfferPage() {
  const [timeLeft, setTimeLeft] = useState(15)
  const router = useRouter()

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  return (
    <MobileDriverLayout>
      <div className="p-5 space-y-5">
        
        {/* Header Oferta */}
        <header className="flex justify-between items-center pt-2">
          <Link href="/driver/home" className="p-2 rounded-full bg-[#f0eded] text-[#1c1b1b]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-extrabold text-sm text-[#0056d2]">Oferta #V-9042</span>
          <div className="w-8" />
        </header>

        {/* Cronómetro Táctil de Aceptación */}
        <div className="bg-[#fddf33] text-[#726200] p-4 rounded-[24px] text-center space-y-1 shadow-sm border border-[#e2c60f]">
          <span className="text-xs font-bold uppercase tracking-wider block">TIEMPO PARA ACEPTAR</span>
          <div className="text-4xl font-black flex items-center justify-center gap-1">
            <Clock className="w-7 h-7" />
            <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
          </div>
        </div>

        {/* Tarjeta de Ganancia Estimada */}
        <div className="bg-[#0056d2] text-white p-6 rounded-[32px] text-center space-y-1 shadow-lg relative overflow-hidden">
          <span className="text-xs font-extrabold text-[#ccd8ff] uppercase tracking-wider block">GANANCIA TOTAL ESTIMADA</span>
          <p className="text-5xl font-black text-[#c3f400]">$65.00</p>
          <span className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full inline-block mt-2">
            Cobro en Efectivo con Cliente
          </span>
        </div>

        {/* Detalles de Ruta (Origen & Destino) */}
        <div className="bg-white p-5 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-4">
          {/* Origen */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0056d2]/10 text-[#0056d2] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#737785] uppercase block">ORIGEN (RECOGER)</span>
              <strong className="text-sm font-extrabold text-[#1c1b1b]">Taquería El Pastor</strong>
              <p className="text-xs font-semibold text-[#424654]">Av. Hidalgo #104, Centro &bull; 1.8 km</p>
            </div>
          </div>

          <div className="ml-4 border-l-2 border-dashed border-[#e5e2e1] h-4" />

          {/* Destino */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#737785] uppercase block">DESTINO (ENTREGAR)</span>
              <strong className="text-sm font-extrabold text-[#1c1b1b]">Calle Juárez #452, Col. San José</strong>
              <p className="text-xs font-semibold text-[#424654]">Cliente: Maria G. &bull; 3.2 km</p>
            </div>
          </div>
        </div>

        {/* Botones de Acción Gigantes Táctiles */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => router.push('/driver/navigation')}
            className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-4 rounded-full font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-6 h-6" />
            <span>ACEPTAR VIAJE ($65.00)</span>
          </button>

          <Link
            href="/driver/home"
            className="w-full bg-[#f0eded] hover:bg-[#e5e2e1] text-[#ba1a1a] py-3.5 rounded-full font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
            <span>RECHAZAR OFERTA</span>
          </Link>
        </div>

      </div>
    </MobileDriverLayout>
  )
}
