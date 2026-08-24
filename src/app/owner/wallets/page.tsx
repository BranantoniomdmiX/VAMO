'use client'

import React, { useState } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { Wallet, Bike, ShieldCheck, Edit, PlusCircle, CheckCircle2, X, AlertTriangle, RefreshCw } from 'lucide-react'

interface DriverWalletItem {
  id: number
  driver: string
  balance: number
  limit: number
  tripsToday: number
  status: 'ok' | 'warning' | 'blocked'
}

export default function OwnerWalletsPage() {
  const [wallets, setWallets] = useState<DriverWalletItem[]>([
    { id: 1, driver: 'Carlos Mendoza', balance: 480.00, limit: 1500.00, tripsToday: 6, status: 'ok' },
    { id: 2, driver: 'Ana Paula Gómez', balance: 1320.00, limit: 1500.00, tripsToday: 11, status: 'warning' },
    { id: 3, driver: 'Roberto Morales', balance: 1650.00, limit: 1500.00, tripsToday: 14, status: 'blocked' }
  ])

  const [selectedWallet, setSelectedWallet] = useState<DriverWalletItem | null>(null)
  const [newLimitAmount, setNewLimitAmount] = useState<string>('')
  const [topupAmount, setTopupAmount] = useState<string>('')
  const [modalMode, setModalMode] = useState<'limit' | 'topup' | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  const handleSettleInBase = (driverId: number) => {
    setWallets(prev => prev.map(w => {
      if (w.id === driverId) {
        return { ...w, balance: 0, status: 'ok' }
      }
      return w
    }))
    setFeedbackMsg('¡Efectivo liquidado en base exitosamente! Caja reseteada a $0.00.')
    setTimeout(() => setFeedbackMsg(null), 3500)
  }

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWallet || !newLimitAmount) return
    const limitNum = parseFloat(newLimitAmount)
    if (isNaN(limitNum) || limitNum <= 0) return

    setWallets(prev => prev.map(w => {
      if (w.id === selectedWallet.id) {
        const nextStatus = w.balance > limitNum ? 'blocked' : w.balance > limitNum * 0.8 ? 'warning' : 'ok'
        return { ...w, limit: limitNum, status: nextStatus }
      }
      return w
    }))

    setFeedbackMsg(`Límite de caja de ${selectedWallet.driver} actualizado a $${limitNum.toFixed(2)} MXN.`)
    setModalMode(null)
    setSelectedWallet(null)
    setNewLimitAmount('')
    setTimeout(() => setFeedbackMsg(null), 3500)
  }

  const handleTopupDriver = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWallet || !topupAmount) return
    const topupNum = parseFloat(topupAmount)
    if (isNaN(topupNum) || topupNum <= 0) return

    setWallets(prev => prev.map(w => {
      if (w.id === selectedWallet.id) {
        return { ...w, balance: Math.max(0, w.balance - topupNum) }
      }
      return w
    }))

    setFeedbackMsg(`Abono de $${topupNum.toFixed(2)} MXN aplicado a ${selectedWallet.driver}.`)
    setModalMode(null)
    setSelectedWallet(null)
    setTopupAmount('')
    setTimeout(() => setFeedbackMsg(null), 3500)
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="wallets" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-xs">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#0056d2]">Billeteras de Motociclistas</h1>
            <p className="text-xs text-slate-500 font-semibold">Supervisión de caja en efectivo individual y límites COD</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {feedbackMsg && (
            <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 p-4 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wallets.map(w => {
              const percent = Math.min(100, Math.round((w.balance / w.limit) * 100))
              return (
                <div key={w.id} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#0056d2]/10 text-[#0056d2] flex items-center justify-center font-black text-xs">
                          <Bike className="w-4 h-4" />
                        </div>
                        <strong className="text-sm font-black text-slate-900">{w.driver}</strong>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        w.status === 'blocked' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        w.status === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {w.status === 'blocked' ? 'Bloqueado COD' : w.status === 'warning' ? 'Cerca del Límite' : 'Caja Normal'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#fcf9f8] border border-[#e5e2e1] space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[11px] font-bold text-slate-500">Efectivo Retenido</span>
                        <p className="text-2xl font-black text-[#0056d2]">${w.balance.toFixed(2)}</p>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            w.status === 'blocked' ? 'bg-rose-600' : percent > 80 ? 'bg-amber-500' : 'bg-[#0056d2]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>{percent}% utilizado</span>
                        <span>Tope: ${w.limit.toFixed(2)} MXN</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs font-semibold text-slate-500 px-1">
                      <span>Viajes completados hoy:</span>
                      <strong className="text-slate-900 font-black">{w.tripsToday} pedidos</strong>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedWallet(w)
                          setNewLimitAmount(w.limit.toString())
                          setModalMode('limit')
                        }}
                        className="flex-1 bg-[#f0eded] hover:bg-[#e5e2e1] text-slate-900 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Límite</span>
                      </button>

                      <button 
                        onClick={() => {
                          setSelectedWallet(w)
                          setTopupAmount('200')
                          setModalMode('topup')
                        }}
                        className="flex-1 bg-[#0056d2]/10 hover:bg-[#0056d2]/20 text-[#0056d2] py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Abonar</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => handleSettleInBase(w.id)}
                      className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Liquidar Caja en Base ($0.00)</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </main>

        {/* Modal Modificar Límite */}
        {modalMode === 'limit' && selectedWallet && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#e5e2e1]">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-slate-900">Ajustar Límite de Caja COD</h3>
                <button onClick={() => setModalMode(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs font-semibold text-slate-500">
                Modifica el tope máximo de efectivo que <strong>{selectedWallet.driver}</strong> puede acumular antes de bloquearse para viajes en efectivo.
              </p>

              <form onSubmit={handleSaveLimit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Nuevo Límite (MXN)</label>
                  <input
                    type="number"
                    value={newLimitAmount}
                    onChange={e => setNewLimitAmount(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-xl p-3 text-sm font-black outline-none"
                    placeholder="1500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-full text-xs font-black"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#0056d2] hover:bg-[#0040a1] text-white py-3 rounded-full text-xs font-black shadow-md cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Abonar Saldo */}
        {modalMode === 'topup' && selectedWallet && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#e5e2e1]">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-slate-900">Abonar Saldo a Conductor</h3>
                <button onClick={() => setModalMode(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs font-semibold text-slate-500">
                Registra un abono directo o saldo a favor a la billetera de <strong>{selectedWallet.driver}</strong>.
              </p>

              <form onSubmit={handleTopupDriver} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Monto a Abonar (MXN)</label>
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={e => setTopupAmount(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-xl p-3 text-sm font-black outline-none"
                    placeholder="200"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-full text-xs font-black"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3 rounded-full text-xs font-black shadow-md cursor-pointer"
                  >
                    Abonar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
