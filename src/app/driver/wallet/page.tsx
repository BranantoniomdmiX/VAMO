'use client'

import React from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { Wallet, ArrowDownRight, ArrowUpRight, ShieldCheck, History } from 'lucide-react'

export default function DriverWalletPage() {
  const transactions = [
    { id: 1, type: 'trip', title: 'Viaje #V-9042', date: 'Hoy, 14:20 hrs', amount: '+$65.00', isPositive: true },
    { id: 2, type: 'commission', title: 'Comisión VAMO (15%)', date: 'Hoy, 14:20 hrs', amount: '-$9.75', isPositive: false },
    { id: 3, type: 'trip', title: 'Viaje #V-9039', date: 'Hoy, 13:10 hrs', amount: '+$120.00', isPositive: true },
    { id: 4, type: 'settlement', title: 'Corte de Caja en Base', date: 'Ayer, 20:00 hrs', amount: '-$450.00', isPositive: false }
  ]

  return (
    <MobileDriverLayout>
      <div className="p-5 space-y-5">
        
        {/* Header Billetera */}
        <header className="text-center space-y-1 pt-2">
          <h1 className="text-xl font-extrabold text-[#1c1b1b]">Billetera & Caja</h1>
          <p className="text-xs font-semibold text-[#737785]">Control de efectivo y comisiones recolectadas</p>
        </header>

        {/* Tarjeta Principal de Saldo */}
        <div className="bg-[#0056d2] text-white p-6 rounded-[32px] text-center space-y-2 shadow-lg relative overflow-hidden">
          <span className="text-xs font-extrabold text-[#ccd8ff] uppercase tracking-wider block">EFECTIVO EN TU CAJA REPARTIDOR</span>
          <p className="text-4xl font-black text-white">$480.00 MXN</p>
          <span className="text-xs font-bold text-[#c3f400] bg-white/10 px-3 py-1 rounded-full inline-block">
            Límite de caja: $1,500.00
          </span>
        </div>

        {/* Movimientos Recientes */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-extrabold text-[#1c1b1b] flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#0056d2]" />
            <span>Últimos Movimientos</span>
          </h2>

          <div className="space-y-2.5">
            {transactions.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-[20px] border border-[#e5e2e1] shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                    t.isPositive ? 'bg-[#c3f400]/40 text-[#161e00]' : 'bg-[#ffdad6] text-[#ba1a1a]'
                  }`}>
                    {t.isPositive ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <strong className="text-xs sm:text-sm font-extrabold text-[#1c1b1b] block">{t.title}</strong>
                    <span className="text-[10px] font-semibold text-[#737785]">{t.date}</span>
                  </div>
                </div>

                <span className={`text-sm font-extrabold ${t.isPositive ? 'text-[#161e00]' : 'text-[#ba1a1a]'}`}>
                  {t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MobileDriverLayout>
  )
}
