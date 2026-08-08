'use client'

import React from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { CreditCard, Check } from 'lucide-react'

export default function AdminPlansPage() {
  const plans = [
    { name: 'Plan Starter Flotilla', price: '$2,499 MXN / mes', desc: 'Hasta 10 motociclistas y 1 base de despacho.', active: true },
    { name: 'Plan Pro Flotilla', price: '$4,999 MXN / mes', desc: 'Hasta 30 motociclistas y múltiples zonas.', active: true },
    { name: 'Plan Enterprise Multi-Ciudad', price: 'Personalizado', desc: 'Motociclistas ilimitados y soporte 24/7.', active: true }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="plans" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Planes de Suscripción SaaS VAMO</h1>
            <p className="text-xs text-[#737785] font-semibold">Configuración de paquetes y cobro recurrente para flotillas</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1c1b1b]">{p.name}</h3>
                  <p className="text-2xl font-black text-[#0056d2] mt-1">{p.price}</p>
                  <p className="text-xs font-semibold text-[#737785] mt-2">{p.desc}</p>
                </div>

                <button className="w-full bg-[#1c1b1b] hover:bg-black text-[#c3f400] py-3 rounded-full font-black text-xs transition-all">
                  Editar Configuración
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
