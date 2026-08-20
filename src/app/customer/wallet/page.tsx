'use client'

import React from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Wallet, CreditCard, PlusCircle, ArrowUpRight, ArrowDownLeft, Gift, ShieldCheck, Zap } from 'lucide-react'

export default function CustomerWalletPage() {
  const [balance] = React.useState(250.00)
  const [points] = React.useState(420)

  const transactions = [
    {
      id: 'TX-101',
      type: 'RECHARGE',
      title: 'Recarga VAMO Pay (OXXO / Tarjeta)',
      date: '18 Ago 2026, 04:20 PM',
      amount: 300.00,
      isPositive: true
    },
    {
      id: 'TX-102',
      type: 'PAYMENT',
      title: 'Pago Pedido Taquería El Pastorcito',
      date: '18 Ago 2026, 08:45 PM',
      amount: -145.00,
      isPositive: false
    },
    {
      id: 'TX-103',
      type: 'CASHBACK',
      title: 'Recompensa 5% Cashback VAMO Puntos',
      date: '18 Ago 2026, 08:45 PM',
      amount: 7.25,
      isPositive: true
    }
  ]

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <span className="bg-[#0056d2]/10 text-[#0056d2] text-xs font-black px-3 py-1 rounded-full uppercase">
              BILLETERA DIGITAL VAMO
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1c1b1b] mt-1">Mi Saldo & Métodos de Pago</h1>
          </div>
        </header>

        {/* Tarjeta de Saldo VAMO Pay */}
        <div className="bg-gradient-to-br from-[#0040A1] to-[#0056D2] text-white p-6 sm:p-7 rounded-[32px] shadow-lg relative overflow-hidden space-y-4">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 block">SALDO DISPONIBLE</span>
              <p className="text-3xl sm:text-4xl font-black text-[#c3f400] mt-1 tracking-tight">
                ${balance.toFixed(2)} <span className="text-base text-white font-bold">MXN</span>
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border border-white/20">
              <Gift className="w-4 h-4 text-[#c3f400]" />
              <span>{points} Puntos VAMO</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 relative z-10">
            <button className="flex-1 bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
              <PlusCircle className="w-4 h-4" />
              Recargar Saldo
            </button>
            <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition-all">
              <CreditCard className="w-4 h-4" />
              Nueva Tarjeta
            </button>
          </div>

          {/* Decoración de fondo */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#c3f400]/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Métodos de Pago Guardados */}
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-[#1c1b1b]">MÉTODOS DE PAGO ACTIVOS</h2>
            <span className="text-xs font-bold text-[#0056d2]">Administrar</span>
          </div>

          <div className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-[#fcf9f8] border border-[#e5e2e1] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                  VISA
                </div>
                <div>
                  <strong className="text-xs font-black text-[#1c1b1b] block">Tarjeta Débito &bull;&bull;&bull;&bull; 4812</strong>
                  <span className="text-[11px] font-semibold text-[#737785]">Expira 08/29 &bull; Predeterminada</span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">Activa</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#fcf9f8] border border-[#e5e2e1] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#161e00] text-[#c3f400] flex items-center justify-center font-black text-xs">
                  💵
                </div>
                <div>
                  <strong className="text-xs font-black text-[#1c1b1b] block">Efectivo al Recibir (COD)</strong>
                  <span className="text-[11px] font-semibold text-[#737785]">Pagas al motociclista con PIN</span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">Activo</span>
            </div>
          </div>
        </div>

        {/* Últimos Movimientos */}
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-[#1c1b1b]">HISTORIAL DE MOVIMIENTOS</h2>

          <div className="divide-y divide-[#f0eded]">
            {transactions.map(tx => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    tx.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tx.isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <strong className="text-xs font-extrabold text-[#1c1b1b] block">{tx.title}</strong>
                    <span className="text-[10px] font-semibold text-[#737785]">{tx.date}</span>
                  </div>
                </div>

                <span className={`text-xs font-black ${tx.isPositive ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {tx.isPositive ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </CustomerLayout>
  )
}
