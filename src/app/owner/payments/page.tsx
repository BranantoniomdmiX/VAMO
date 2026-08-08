'use client'

import React from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { CreditCard, Check } from 'lucide-react'

export default function OwnerPaymentsPage() {
  const schemes = [
    { title: 'Comisión Estándar 15%', desc: 'Se descuenta el 15% automático por cada viaje completado.', active: true },
    { title: 'Cuota Fija Diaria ($120 MXN)', desc: 'Rider paga una tarifa plana al día sin comisiones por viaje.', active: false },
    { title: 'Suscripción Semanal ($700 MXN)', desc: 'Acceso ilimitado a viajes durante 7 días.', active: false }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="payments" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Esquemas de Pago a Repartidores</h1>
            <p className="text-xs text-[#737785] font-semibold">Modalidades de cobro de comisión o cuota para la flotilla</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {schemes.map((s, idx) => (
              <div key={idx} className={`p-6 rounded-[28px] border shadow-sm space-y-4 flex flex-col justify-between ${
                s.active ? 'bg-white border-[#0056d2] shadow-md ring-2 ring-[#0056d2]/20' : 'bg-white border-[#e5e2e1]'
              }`}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <strong className="text-base font-extrabold text-[#1c1b1b]">{s.title}</strong>
                    {s.active && <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full">ACTIVO</span>}
                  </div>
                  <p className="text-xs font-semibold text-[#737785]">{s.desc}</p>
                </div>

                <button className={`w-full py-3 rounded-full font-extrabold text-xs transition-all ${
                  s.active ? 'bg-[#0056d2] text-white shadow-sm' : 'bg-[#f0eded] text-[#1c1b1b] hover:bg-[#e5e2e1]'
                }`}>
                  {s.active ? 'Esquema Activo Actual' : 'Activar Esquema'}
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
