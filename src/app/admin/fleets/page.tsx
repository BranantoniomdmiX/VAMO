'use client'

import React from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { Building2, ShieldCheck, Edit, Power } from 'lucide-react'

export default function AdminFleetsPage() {
  const fleets = [
    { id: 1, name: 'VAMO Flotilla Centro', owner: 'Don Manuel H.', city: 'Ciudad de México', riders: 18, status: 'active' },
    { id: 2, name: 'Motomandados Express Sur', owner: 'Carlos R.', city: 'Puebla', riders: 12, status: 'active' },
    { id: 3, name: 'VAMO Bajío', owner: 'Ana G.', city: 'Querétaro', riders: 8, status: 'active' }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="fleets" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Gestión de Tenants & Flotas SaaS</h1>
            <p className="text-xs text-[#737785] font-semibold">Administración de clientes corporativos y dueños de flotillas</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fleets.map(f => (
              <div key={f.id} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <strong className="text-base font-extrabold text-[#1c1b1b]">{f.name}</strong>
                    <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full">
                      {f.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs font-semibold text-[#737785]">
                    <p className="text-[#1c1b1b] font-bold">Dueño: {f.owner}</p>
                    <p>Ciudad: {f.city}</p>
                    <p className="text-[#0056d2] font-bold">Flota: {f.riders} Riders activos</p>
                  </div>
                </div>

                <button className="w-full bg-[#f0eded] hover:bg-[#e5e2e1] text-[#1c1b1b] py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1 transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                  <span>Administrar Tenant</span>
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
