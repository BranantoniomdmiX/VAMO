'use client'

import React, { useState } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { Bike, Power, Wallet, Trophy, ArrowRight, ShieldCheck, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function DriverHomePage() {
  const [isAvailable, setIsAvailable] = useState(true)

  return (
    <MobileDriverLayout>
      <div className="p-5 space-y-6">
        
        {/* Header Rider */}
        <header className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black text-lg shadow-md border-2 border-white">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#1c1b1b] leading-tight">
                ¡Hola, Carlos! 🏍️
              </h1>
              <p className="text-xs font-bold text-[#737785] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0056d2]" /> Zona Centro &bull; VAMO
              </p>
            </div>
          </div>

          <Link href="/" className="text-xs font-bold text-[#0056d2] bg-[#0056d2]/10 px-3 py-1.5 rounded-full">
            Salir
          </Link>
        </header>

        {/* Switch Gigante DISPONIBLE / NO DISPONIBLE (VAMO Rider Friendly) */}
        <div 
          onClick={() => setIsAvailable(!isAvailable)}
          className={`
            p-5 rounded-[28px] cursor-pointer transition-all duration-300 shadow-md flex items-center justify-between border-2 active:scale-98
            ${isAvailable 
              ? 'bg-[#c3f400] border-[#abd600] text-[#161e00]' 
              : 'bg-[#f0eded] border-[#e5e2e1] text-[#737785]'}
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              isAvailable ? 'bg-[#161e00] text-[#c3f400]' : 'bg-[#737785] text-white'
            }`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-wide block">
                {isAvailable ? 'ESTÁS DISPONIBLE' : 'NO DISPONIBLE'}
              </span>
              <span className="text-xs font-semibold opacity-90">
                {isAvailable ? 'Recibiendo ofertas en tiempo real' : 'Toca para conectarte'}
              </span>
            </div>
          </div>

          <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isAvailable ? 'bg-[#161e00]' : 'bg-[#c3c6d6]'}`}>
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Tarjetas Métricas Rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-[#0056d2] font-bold text-xs">
              <Wallet className="w-4 h-4" />
              <span>Ganancias Hoy</span>
            </div>
            <p className="text-xl font-extrabold text-[#1c1b1b]">$480.00</p>
            <span className="text-[10px] font-semibold text-[#737785]">6 viajes realizados</span>
          </div>

          <div className="bg-white p-4 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-[#726200] font-bold text-xs">
              <Trophy className="w-4 h-4 text-[#fddf33]" />
              <span>Bono Meta</span>
            </div>
            <p className="text-xl font-extrabold text-[#1c1b1b]">$150.00</p>
            <span className="text-[10px] font-bold text-[#c3f400] bg-[#161e00] px-1.5 py-0.5 rounded">
              Faltan 2 viajes
            </span>
          </div>
        </div>

        {/* Banner de Oferta Entrante Simulada */}
        <div className="bg-[#0056d2] text-white p-5 rounded-[28px] shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
              OFERTA DISPONIBLE
            </span>
            <span className="text-xs font-extrabold text-[#ccd8ff]">Paga $65.00 en efectivo</span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">Taquería El Pastor &bull; Centro</h3>
            <p className="text-xs font-medium text-[#ccd8ff]">Distancia: 1.8 km &bull; Entrega a 3.2 km</p>
          </div>

          <Link
            href="/driver/offer"
            className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3 rounded-full font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span>VER OFERTA COMPLETA</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </MobileDriverLayout>
  )
}
