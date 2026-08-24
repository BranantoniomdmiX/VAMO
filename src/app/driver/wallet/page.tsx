'use client'

import React, { useState, useEffect } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { Wallet, ArrowDownRight, ArrowUpRight, ShieldCheck, History, PlusCircle, CheckCircle2, AlertTriangle, Lock, Award } from 'lucide-react'
import { WalletService, UserWallet, WalletTransaction, MAX_COD_CASH } from '@/lib/services/walletService'

export default function DriverWalletPage() {
  const [wallet, setWallet] = useState<UserWallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadWalletData()
  }, [])

  const loadWalletData = async () => {
    const data = await WalletService.getDriverWallet('driver-carlos-1')
    const txs = WalletService.getTransactions('driver-carlos-1')
    setWallet(data)
    setTransactions(txs)
  }

  const handleTopup = async (amount: number) => {
    const res = await WalletService.topupBalance(amount, 'driver-carlos-1')
    if (res.success) {
      setWallet({ ...res.wallet })
      setTransactions(WalletService.getTransactions('driver-carlos-1'))
      setTopupSuccess(`+$${amount}.00 MXN ingresados a tu saldo digital`)
      setTimeout(() => setTopupSuccess(null), 3500)
    }
  }

  if (!wallet) return null

  const codPercent = Math.min(100, Math.round((wallet.codBalance / wallet.maxCodLimit) * 100))
  const isNearCodLimit = wallet.codBalance >= 1200 && !wallet.isCodBlocked

  return (
    <MobileDriverLayout>
      <div className="p-5 space-y-5">
        
        {/* Header Billetera */}
        <header className="text-center space-y-1 pt-2">
          <div className="inline-flex items-center gap-1.5 bg-[#0040a1] text-white px-3.5 py-1 rounded-full text-[10px] font-black tracking-wide border border-blue-800 shadow-xs">
            <Award className="w-3.5 h-3.5 text-[#c3f400]" />
            <span>SOCIO VAMO &bull; NIVEL {wallet.tier}</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Billetera & Caja COD</h1>
          <p className="text-xs font-semibold text-slate-500">Control de efectivo en mano y saldo digital</p>
        </header>

        {/* Toast Notificación de Recarga */}
        {topupSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-2xl flex items-center justify-between text-xs font-black shadow-xs animate-bounce">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{topupSuccess}</span>
            </div>
          </div>
        )}

        {/* Alerta de Límite COD Alcanzado ($1,500 MXN) */}
        {wallet.isCodBlocked && (
          <div className="bg-rose-50 border-2 border-rose-500 text-rose-950 p-4 rounded-[24px] shadow-sm space-y-2">
            <div className="flex items-center gap-2 font-black text-xs text-rose-700">
              <Lock className="w-5 h-5" />
              <span className="uppercase tracking-wider">LÍMITE DE EFECTIVO ALCANZADO ($1,500.00 MXN)</span>
            </div>
            <p className="text-xs font-bold leading-relaxed text-rose-900">
              Has acumulado <strong>${wallet.codBalance.toFixed(2)} MXN</strong> en efectivo. El sistema ha restringido nuevos viajes en efectivo. Acude a la <strong>Base de Operaciones</strong> a entregar el corte de caja para desbloquear tu asignación.
            </p>
            <div className="text-[11px] font-bold text-rose-700 bg-white px-3 py-1.5 rounded-xl inline-block border border-rose-200">
              ℹ️ Solo puedes recibir viajes pagados con tarjeta mientras tanto.
            </div>
          </div>
        )}

        {isNearCodLimit && (
          <div className="bg-[#fff9db] border border-[#f59f00] text-[#744210] p-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xs">
            <AlertTriangle className="w-5 h-5 text-[#f59f00] shrink-0" />
            <span>Atención: Te faltan <strong>${(wallet.maxCodLimit - wallet.codBalance).toFixed(2)} MXN</strong> para el límite de efectivo. Realiza tu corte en Base pronto.</span>
          </div>
        )}

        {/* Tarjeta 1: Control de Efectivo en Mano COD */}
        <div className={`p-6 rounded-[28px] text-center space-y-3 shadow-md relative overflow-hidden text-white transition-all ${
          wallet.isCodBlocked ? 'bg-[#ba1a1a]' : 'bg-[#0040a1] border border-blue-800'
        }`}>
          <div className="flex justify-between items-center text-xs font-extrabold text-blue-200">
            <span className="uppercase tracking-wider">EFECTIVO EN MANO (COD)</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] text-white">
              {codPercent}% Límite
            </span>
          </div>

          <p className="text-4xl font-black text-white">
            ${wallet.codBalance.toFixed(2)} <span className="text-xl font-bold text-blue-200">MXN</span>
          </p>

          {/* Barra de progreso de retención COD */}
          <div className="space-y-1">
            <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  wallet.isCodBlocked ? 'bg-white' : codPercent > 80 ? 'bg-[#ff9800]' : 'bg-[#c3f400]'
                }`}
                style={{ width: `${codPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-blue-200">
              <span>$0.00</span>
              <span>Límite Máximo: ${wallet.maxCodLimit.toFixed(2)} MXN</span>
            </div>
          </div>

          {/* Botón Liquidar / Rendir Corte en Base */}
          {wallet.codBalance > 0 && (
            <button
              onClick={() => {
                const amountSettled = wallet.codBalance
                setWallet(prev => prev ? ({ ...prev, codBalance: 0, isCodBlocked: false }) : null)
                setTransactions(prev => [
                  {
                    id: `TX-SETTLE-${Date.now()}`,
                    userId: 'driver-carlos-1',
                    type: 'BASE_SETTLEMENT',
                    title: 'Liquidación de Efectivo COD en Base Operativa',
                    amount: -amountSettled,
                    balanceAfter: wallet.balance,
                    date: 'Hoy, ' + new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                    isPositive: false
                  },

                  ...prev
                ])
                setTopupSuccess(`¡Corte de $${amountSettled.toFixed(2)} MXN entregado en Base! Límite de efectivo desbloqueado.`)
                setTimeout(() => setTopupSuccess(null), 4000)
              }}
              className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3 rounded-2xl font-black text-xs shadow-sm active:scale-95 transition-all cursor-pointer mt-2"
            >
              💵 Rendir Corte de ${wallet.codBalance.toFixed(2)} MXN en Base
            </button>
          )}
        </div>


        {/* Tarjeta 2: Saldo Digital a Favor & Cuota Semanal */}
        <div className="bg-white p-5 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">SALDO DIGITAL A FAVOR</span>
              <p className="text-2xl font-black text-slate-900">${wallet.balance.toFixed(2)} MXN</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 block">Cuota Semanal VAMO:</span>
              <span className="text-xs font-black text-[#0056d2] bg-blue-50 px-2.5 py-1 rounded-full inline-block border border-blue-100">
                ${wallet.weeklyFee.toFixed(2)} MXN / sem
              </span>
            </div>
          </div>

          {/* Recarga Exprés de Saldo 1-Tap */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <PlusCircle className="w-4 h-4 text-[#0056d2]" />
              <span>Recarga Exprés de Saldo (1-Tap)</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[100, 200, 500].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleTopup(amount)}
                  className="bg-slate-100 hover:bg-[#0056d2] hover:text-white text-slate-900 text-xs font-black py-2.5 rounded-xl active:scale-95 transition-all border border-slate-200 cursor-pointer"
                >
                  +${amount} MXN
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Movimientos Recientes */}
        <div className="space-y-3 pt-1">
          <h2 className="text-sm font-extrabold text-[#1c1b1b] flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#0056d2]" />
            <span>Últimos Movimientos de Caja & Billetera</span>
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
                  {t.isPositive ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MobileDriverLayout>
  )
}
