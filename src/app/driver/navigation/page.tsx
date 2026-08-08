'use client'

import React, { useState } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { MapPin, Navigation, Phone, CheckCircle2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DriverNavigationPage() {
  const [step, setStep] = useState<'to_origin' | 'arrived_origin' | 'to_destination'>('to_origin')
  const router = useRouter()

  return (
    <MobileDriverLayout>
      <div className="flex flex-col h-full relative bg-[#f0eded]">
        
        {/* Mapa GPS Simulado de Alta Fidelidad */}
        <div className="flex-1 bg-[#e5e2e1] relative overflow-hidden flex items-center justify-center p-6 min-h-[300px]">
          <div className="absolute inset-0 bg-[radial-gradient(#0056d2_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          {/* Marcador GPS Repartidor */}
          <div className="relative z-10 flex flex-col items-center animate-bounce">
            <div className="bg-[#0056d2] text-white p-3 rounded-full shadow-xl border-4 border-white">
              <Navigation className="w-6 h-6 rotate-45" />
            </div>
            <span className="bg-[#1c1b1b] text-white text-[10px] font-black px-2 py-0.5 rounded-full mt-1 shadow-md">
              TÚ EN RUTA (GPS ACTIVE)
            </span>
          </div>
        </div>

        {/* Tarjeta Inferior de Estado de Viaje */}
        <div className="bg-white p-5 rounded-t-[32px] shadow-[0_-10px_25px_rgba(0,0,0,0.08)] space-y-4">
          
          {/* Header Indicador */}
          <div className="flex justify-between items-center border-b border-[#f0eded] pb-3">
            <div>
              <span className="text-[10px] font-black text-[#0056d2] uppercase tracking-wider block">
                {step === 'to_origin' && 'PASO 1: EN RUTA A RECOGER'}
                {step === 'arrived_origin' && 'PASO 2: EN LOCAL RECOGIENDO'}
                {step === 'to_destination' && 'PASO 3: EN RUTA A ENTREGAR CON CLIENTE'}
              </span>
              <h2 className="text-base font-extrabold text-[#1c1b1b]">
                {step === 'to_destination' ? 'Calle Juárez #452' : 'Taquería El Pastor'}
              </h2>
            </div>

            <a href="tel:5551234567" className="w-10 h-10 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-bold shadow-sm">
              <Phone className="w-5 h-5" />
            </a>
          </div>

          {/* Detalles del Pedido */}
          <div className="bg-[#f6f3f2] p-3.5 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-[#737785] block">ORDEN #V-9042 &bull; 2 ARTÍCULOS</span>
            <p className="text-xs font-extrabold text-[#1c1b1b]">2x Combo Tacos al Pastor + 1x Agua de Horchata</p>
          </div>

          {/* Botón Acción Secuencial */}
          {step === 'to_origin' && (
            <button
              onClick={() => setStep('arrived_origin')}
              className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-4 rounded-full font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>LLEGUÉ AL LOCAL ORIGEN</span>
            </button>
          )}

          {step === 'arrived_origin' && (
            <button
              onClick={() => setStep('to_destination')}
              className="w-full bg-[#fddf33] hover:bg-[#e2c60f] text-[#726200] py-4 rounded-full font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>YA TENGO EL PEDIDO &bull; INICIAR RUTA A CLIENTE</span>
            </button>
          )}

          {step === 'to_destination' && (
            <button
              onClick={() => router.push('/driver/pod')}
              className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-4 rounded-full font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>LLEGUÉ CON CLIENTE &bull; ENTREGAR</span>
            </button>
          )}

        </div>

      </div>
    </MobileDriverLayout>
  )
}
