'use client'

import React, { useState } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { Sliders, Save, CheckCircle2 } from 'lucide-react'

export default function OwnerRatesPage() {
  const [baseFee, setBaseFee] = useState(35)
  const [perKm, setPerKm] = useState(8)
  const [nightSurge, setNightSurge] = useState(1.2)
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="rates" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Motor de Tarifas de la Flota</h1>
            <p className="text-xs text-[#737785] font-semibold">Configuración de precio base, precio por km y tarifa dinámica</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
          <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Tarifa Banderazo Base ($ MXN)</label>
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
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Multiplicador Nocturno / Lluvia (x.x)</label>
              <input 
                type="number"
                step="0.1"
                value={nightSurge}
                onChange={e => setNightSurge(Number(e.target.value))}
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-base font-extrabold outline-none"
              />
            </div>

            {saved ? (
              <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-full text-center font-extrabold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>¡TARIFA ACTUALIZADA EN TODA LA RED!</span>
              </div>
            ) : (
              <button 
                type="submit"
                className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-4 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>GUARDAR CONFIGURACIÓN DE TARIFA</span>
              </button>
            )}

          </form>
        </main>
      </div>
    </div>
  )
}
