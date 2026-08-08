'use client'

import React from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { DollarSign, CheckCircle2, Wallet, ArrowDownRight } from 'lucide-react'

export default function BaseCashierPage() {
  const cuts = [
    { driver: 'Carlos M.', cashCollected: '$480.00', commissionDue: '$72.00', status: 'ready' },
    { driver: 'Ana P.', cashCollected: '$650.00', commissionDue: '$97.50', status: 'ready' }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="cashier" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Caja Física y Corte de la Base</h1>
            <p className="text-xs text-[#737785] font-semibold">Liquidación de efectivo y comisiones de repartidores</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0056d2] text-white p-6 sm:p-8 rounded-[32px] space-y-2 shadow-lg">
              <span className="text-xs font-extrabold text-[#ccd8ff] uppercase">TOTAL EFECTIVO EN CAJA BASE</span>
              <p className="text-4xl sm:text-5xl font-black text-white">$12,450.00 MXN</p>
              <span className="text-xs font-bold text-[#c3f400] bg-white/10 px-3 py-1 rounded-full inline-block">
                Corte del turno actual
              </span>
            </div>

            <div className="bg-[#fddf33] text-[#726200] p-6 sm:p-8 rounded-[32px] space-y-2 shadow-md border border-[#e2c60f]">
              <span className="text-xs font-extrabold uppercase">COMISIONES RETENIDAS A LIQUIDAR</span>
              <p className="text-4xl sm:text-5xl font-black text-[#161e00]">$1,867.50 MXN</p>
              <span className="text-xs font-bold opacity-90">15% retenido por servicios VAMO</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-extrabold text-[#1c1b1b]">Repartidores Listos para Corte</h2>

            <div className="space-y-3">
              {cuts.map((c, idx) => (
                <div key={idx} className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <strong className="text-base font-extrabold text-[#1c1b1b]">{c.driver}</strong>
                    <p className="text-xs font-semibold text-[#737785]">Efectivo Recolectado: {c.cashCollected} &bull; Comisión VAMO: {c.commissionDue}</p>
                  </div>

                  <button className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-6 py-3 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all">
                    PROCESAR CORTE Y RECIBIR CAJA
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
