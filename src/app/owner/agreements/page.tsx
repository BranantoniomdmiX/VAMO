'use client'

import React from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { Handshake, Store, Plus } from 'lucide-react'

export default function OwnerAgreementsPage() {
  const agreements = [
    { name: 'Taquería El Pastor', type: 'Descuento 10% por volumen', volume: '150+ envíos/mes', status: 'Vigente' },
    { name: 'Farmacia del Pueblo', type: 'Tarifa plana $25/envío', volume: '80+ envíos/mes', status: 'Vigente' }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="agreements" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Convenios Comerciales B2B</h1>
            <p className="text-xs text-[#737785] font-semibold">Contratos y tarifas especiales con tiendas y negocios afiliados</p>
          </div>

          <button className="bg-[#0056d2] text-white px-5 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Convenio</span>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agreements.map((a, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <strong className="text-base font-extrabold text-[#1c1b1b]">{a.name}</strong>
                  <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full">
                    {a.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#737785]">Acuerdo: {a.type}</p>
                <span className="text-xs font-bold text-[#0056d2] bg-[#0056d2]/10 px-3 py-1 rounded-full inline-block">
                  Volumen: {a.volume}
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
