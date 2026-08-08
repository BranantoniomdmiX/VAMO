'use client'

import React from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { Map, Radio, Bike, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export default function BaseRadarPage() {
  const drivers = [
    { id: 1, name: 'Carlos M.', status: 'busy', statusLabel: 'En Viaje (#V-9042)', battery: '85%', speed: '32 km/h' },
    { id: 2, name: 'Roberto M.', status: 'available', statusLabel: 'Disponible en Base', battery: '92%', speed: '0 km/h' },
    { id: 3, name: 'Ana P.', status: 'busy', statusLabel: 'En Viaje (#V-9040)', battery: '64%', speed: '28 km/h' }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="radar" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Radar Operativo Macro</h1>
            <p className="text-xs text-[#737785] font-semibold">Monitor en tiempo real de la flota de motociclistas</p>
          </div>

          <span className="bg-[#c3f400] text-[#161e00] px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#161e00] animate-pulse" />
            12 Motos Conectadas
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Mapa GPS Interactivo Simulado */}
          <div className="h-96 bg-[#e5e2e1] rounded-[32px] border-2 border-[#e5e2e1] overflow-hidden relative flex items-center justify-center p-6 shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(#0056d2_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
            
            <div className="relative z-10 text-center space-y-2">
              <div className="bg-[#1c1b1b] text-[#c3f400] p-4 rounded-full shadow-2xl inline-block border-4 border-white">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
              <span className="bg-white text-[#1c1b1b] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-md block">
                COBERTURAS EN TIEMPO REAL &bull; ZONA CENTRO Y SUR
              </span>
            </div>
          </div>

          {/* Estado de Repartidores en Vivo */}
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#1c1b1b] flex items-center gap-2">
              <Bike className="w-5 h-5 text-[#0056d2]" />
              <span>Estado de la Flota en Campo</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {drivers.map(d => (
                <div key={d.id} className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <strong className="text-base font-extrabold text-[#1c1b1b]">{d.name}</strong>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      d.status === 'available' ? 'bg-[#c3f400] text-[#161e00]' : 'bg-[#0056d2] text-white'
                    }`}>
                      {d.statusLabel}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold text-[#737785] pt-2 border-t border-[#f0eded]">
                    <span>Batería: {d.battery}</span>
                    <span>Velocidad: {d.speed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
