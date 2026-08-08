'use client'

import React from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Bike, Navigation, Phone, ShieldCheck, CheckCircle2, Clock } from 'lucide-react'

export default function CustomerTrackingPage() {
  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Tracking */}
        <header className="flex justify-between items-center">
          <div>
            <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-3 py-1 rounded-full uppercase">
              EN CAMINO
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1c1b1b] mt-1">Seguimiento de Envío #V-9042</h1>
          </div>
          <a href="tel:5551234567" className="w-11 h-11 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-bold shadow-md">
            <Phone className="w-5 h-5" />
          </a>
        </header>

        {/* PIN DE SEGURIDAD HIGHLIGHT */}
        <div className="bg-[#fddf33] text-[#726200] p-5 rounded-[28px] text-center space-y-1 shadow-sm border-2 border-[#e2c60f]">
          <span className="text-xs font-black uppercase tracking-wider block">TU PIN DE SEGURIDAD DE ENTREGA</span>
          <p className="text-4xl font-black text-[#161e00] tracking-widest font-mono">8 4 9 2</p>
          <p className="text-xs font-bold opacity-90">Muestra este PIN de 4 dígitos al motociclista para recibir tu pedido.</p>
        </div>

        {/* Mapa GPS de Seguimiento Simulado */}
        <div className="h-64 bg-[#e5e2e1] rounded-[32px] border-2 border-[#e5e2e1] overflow-hidden relative flex items-center justify-center p-6 shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(#0056d2_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          <div className="relative z-10 flex flex-col items-center animate-pulse">
            <div className="bg-[#c3f400] text-[#161e00] p-3.5 rounded-full shadow-xl border-4 border-white">
              <Bike className="w-7 h-7" />
            </div>
            <span className="bg-[#161e00] text-white text-[10px] font-black px-3 py-1 rounded-full mt-1.5 shadow-md">
              MOTO CARLOS M. (A 4 MINUTOS)
            </span>
          </div>
        </div>

        {/* Detalles del Conductor y Estado */}
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0eded] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                CM
              </div>
              <div>
                <strong className="text-base font-extrabold text-[#1c1b1b] block">Carlos M. &bull; Motociclista VAMO</strong>
                <span className="text-xs font-bold text-[#737785]">Italika FT150 &bull; Placas MX-984</span>
              </div>
            </div>
            <span className="text-xs font-black text-[#0056d2] bg-[#0056d2]/10 px-3 py-1 rounded-full">
              4.9 ★ (120 viajes)
            </span>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-[#424654]">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-[#0056d2]" /> Tiempo estimado: 4-8 min
            </span>
            <span className="text-[#0056d2]">Monto en efectivo: $65.00</span>
          </div>
        </div>

      </div>
    </CustomerLayout>
  )
}
