'use client'

import React, { useState } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { Sliders, Save, CheckCircle2, Calculator, Zap, MapPin } from 'lucide-react'

export default function OwnerRatesPage() {
  const [baseFee, setBaseFee] = useState(35)
  const [perKm, setPerKm] = useState(8)
  const [nightSurge, setNightSurge] = useState(1.2)
  const [saved, setSaved] = useState(false)

  // Estado del Simulador en Tiempo Real
  const [simKm, setSimKm] = useState(5)
  const [isNightSim, setIsNightSim] = useState(false)

  const calculatedPrice = Math.round((baseFee + (simKm * perKm)) * (isNightSim ? nightSurge : 1))

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="rates" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Motor de Tarifas & Simulador en Tiempo Real</h1>
            <p className="text-xs text-[#737785] font-semibold">Configuración de precio base, precio por km y tarifa dinámica para tu flotilla</p>
          </div>

          <span className="bg-[#161e00] text-[#c3f400] px-4 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5">
            <Sliders className="w-4 h-4" />
            Algoritmo VAMO Active
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMNA 1: FORMULARIO DE PARÁMETROS TARIFARIOS */}
          <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <h2 className="text-sm font-extrabold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0056d2]" />
                Parámetros de la Flotilla
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Banderazo Base ($ MXN)</label>
                <input 
                  type="number"
                  value={baseFee}
                  onChange={e => setBaseFee(Number(e.target.value))}
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-base font-extrabold outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Costo Adicional por Kilómetro ($ MXN)</label>
                <input 
                  type="number"
                  value={perKm}
                  onChange={e => setPerKm(Number(e.target.value))}
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-base font-extrabold outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Multiplicador Dinámico Lluvia / Noche (x.x)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={nightSurge}
                  onChange={e => setNightSurge(Number(e.target.value))}
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-base font-extrabold outline-none"
                />
              </div>
            </div>

            {saved ? (
              <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-full text-center font-extrabold text-xs flex items-center justify-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-5 h-5" />
                <span>¡TARIFA ACTUALIZADA EN TODA LA RED!</span>
              </div>
            ) : (
              <button 
                type="submit"
                className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-4 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Save className="w-4 h-4" />
                <span>GUARDAR PARÁMETROS EN LA RED</span>
              </button>
            )}
          </form>

          {/* COLUMNA 2: SIMULADOR DE COTIZACIÓN EN TIEMPO REAL */}
          <div className="bg-[#161e00] text-white p-6 sm:p-8 rounded-[32px] shadow-lg border border-[#c3f400]/30 space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" /> SIMULADOR EN VIVO
                </span>
                <span className="text-xs font-bold text-slate-300">Prueba instantánea</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Distancia del Envío Simulado:</span>
                    <span className="text-[#c3f400] font-black">{simKm} km</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="25"
                    value={simKm}
                    onChange={e => setSimKm(Number(e.target.value))}
                    className="w-full accent-[#c3f400] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-xs font-bold text-slate-300">¿Aplicar Tarifa Dinámica / Lluvia?</span>
                  <button 
                    onClick={() => setIsNightSim(!isNightSim)}
                    className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                      isNightSim ? 'bg-[#c3f400] text-[#161e00]' : 'bg-white/20 text-white'
                    }`}
                  >
                    {isNightSim ? 'ACTIVADO (x' + nightSurge + ')' : 'DESACTIVADO'}
                  </button>
                </div>
              </div>

              {/* Resultado del Cálculo */}
              <div className="bg-white/10 p-6 rounded-2xl border border-white/20 space-y-2 text-center">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">PRECIO ESTIMADO AL CLIENTE</span>
                <p className="text-5xl font-black text-[#c3f400]">${calculatedPrice}.00 <span className="text-lg font-bold text-white">MXN</span></p>
                <p className="text-[11px] font-semibold text-slate-300">
                  Banderazo (${baseFee}) + {simKm}km × ${perKm} {isNightSim ? `× ${nightSurge} dinámico` : ''}
                </p>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-400 bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[#c3f400] font-black block">📌 Regla de Algoritmo:</span>
              Las tarifas se aplican automáticamente en la app del Cliente y en el Cotizador de la Base Operativa.
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
