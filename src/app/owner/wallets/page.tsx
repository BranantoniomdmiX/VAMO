'use client'

import React from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { Wallet, Bike, ShieldCheck, Edit } from 'lucide-react'

export default function OwnerWalletsPage() {
  const wallets = [
    { id: 1, driver: 'Carlos M.', balance: '$480.00', limit: '$1,500.00', tripsToday: 6, status: 'ok' },
    { id: 2, name: 'Ana P.', balance: '$1,320.00', limit: '$1,500.00', tripsToday: 11, status: 'warning' },
    { id: 3, name: 'Roberto M.', balance: '$210.00', limit: '$1,500.00', tripsToday: 3, status: 'ok' }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="wallets" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Billeteras de Motociclistas</h1>
            <p className="text-xs text-[#737785] font-semibold">Supervisión de caja en efectivo individual por rider</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wallets.map(w => (
              <div key={w.id} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <strong className="text-base font-extrabold text-[#1c1b1b]">{w.driver || w.name}</strong>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      w.status === 'warning' ? 'bg-[#fddf33] text-[#726200]' : 'bg-[#c3f400] text-[#161e00]'
                    }`}>
                      {w.status === 'warning' ? 'Cerca del Límite' : 'Caja Normal'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <span className="text-xs font-bold text-[#737785] block">Saldo en Caja</span>
                    <p className="text-2xl font-black text-[#0056d2]">{w.balance}</p>
                    <p className="text-xs font-semibold text-[#737785]">Límite permitido: {w.limit}</p>
                  </div>
                </div>

                <button className="w-full bg-[#f0eded] hover:bg-[#e5e2e1] text-[#1c1b1b] py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1 transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                  <span>Ajustar Límite de Caja</span>
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
