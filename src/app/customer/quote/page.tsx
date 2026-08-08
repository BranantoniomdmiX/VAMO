'use client'

import React, { useState } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { MapPin, Navigation, DollarSign, Bike, ArrowRight, ShieldCheck, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CustomerQuotePage() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const router = useRouter()

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination) return
    const calculatedKm = 3.5
    const baseFee = 35
    const perKm = 8
    const total = baseFee + (calculatedKm * perKm)
    setDistanceKm(calculatedKm)
    setEstimatedPrice(total)
  }

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Cotizador */}
        <header className="text-center space-y-1">
          <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-3 py-1 rounded-full uppercase">
            COTIZADOR INSTANTÁNEO
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c1b1b]">Cotizar Motomandado</h1>
          <p className="text-xs sm:text-sm font-semibold text-[#737785]">Ingresa origen y destino para conocer la tarifa exacta</p>
        </header>

        {/* Formulario de Cotización */}
        <form onSubmit={handleCalculate} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-5">
          
          {/* Campo Origen */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Dirección de Origen (Recoger)
            </label>
            <input 
              type="text" 
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="Ej. Av. Hidalgo #104, Centro"
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-colors"
            />
          </div>

          {/* Campo Destino */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#726200] uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-[#fddf33]" /> Dirección de Destino (Entregar)
            </label>
            <input 
              type="text" 
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="Ej. Calle Juárez #452, Col. San José"
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-colors"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-full font-black text-sm shadow-md active:scale-95 transition-all"
          >
            CALCULAR TARIFA DE ENVÍO
          </button>
        </form>

        {/* Tarjeta Resultado de Cotización */}
        {estimatedPrice !== null && (
          <div className="bg-[#0056d2] text-white p-6 rounded-[32px] shadow-lg space-y-4 text-center animate-fade-in">
            <div>
              <span className="text-xs font-extrabold text-[#ccd8ff] uppercase tracking-wider block">TARIFA ESTIMADA DE ENVÍO</span>
              <p className="text-5xl font-black text-[#c3f400] mt-1">${estimatedPrice.toFixed(2)} MXN</p>
              <p className="text-xs font-bold text-[#ccd8ff] mt-1">Distancia aproximada: {distanceKm} km &bull; Llega en 15-20 min</p>
            </div>

            <button 
              onClick={() => router.push('/customer/tracking/1')}
              className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-4 rounded-full font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Bike className="w-5 h-5" />
              <span>SOLICITAR MOTOMANDADO AHORA</span>
            </button>
          </div>
        )}

      </div>
    </CustomerLayout>
  )
}
