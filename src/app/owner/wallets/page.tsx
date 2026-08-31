'use client'

import React, { useState, useEffect } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { Wallet, Bike, ShieldCheck, Edit, PlusCircle, CheckCircle2, X, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DriverWalletItem {
  id: string
  driver: string
  balance: number
  limit: number
  tripsToday: number
  status: 'ok' | 'warning' | 'blocked'
}

export default function OwnerWalletsPage() {
  const supabase = createClient()
  const [wallets, setWallets] = useState<DriverWalletItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedWallet, setSelectedWallet] = useState<DriverWalletItem | null>(null)
  const [newLimitAmount, setNewLimitAmount] = useState<string>('')
  const [topupAmount, setTopupAmount] = useState<string>('')
  const [modalMode, setModalMode] = useState<'limit' | 'topup' | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadDriverWallets() {
      try {
        setIsLoading(true)
        // Consultar conductores reales
        const { data: drivers } = await supabase
          .from('drivers')
          .select('*')

        if (drivers && drivers.length > 0) {
          setWallets(drivers.map(d => ({
            id: d.id,
            driver: d.full_name || 'Conductor VAMO',
            balance: 0.00,
            limit: 1500.00,
            tripsToday: 0,
            status: 'ok'
          })))
        } else {
          setWallets([])
        }
      } catch (err) {
        console.warn('Error al cargar billeteras:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDriverWallets()
  }, [])

  const handleSettleInBase = (driverId: string) => {
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

          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#0056d2]" />
              <span className="text-xs font-bold">Cargando billeteras de la flotilla...</span>
            </div>
          ) : wallets.length === 0 ? (
            <div className="bg-white p-12 rounded-[32px] border border-[#e5e2e1] text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056d2] flex items-center justify-center mx-auto text-xl">
                🛵
              </div>
              <h3 className="text-base font-black text-slate-900">Sin motociclistas registrados</h3>
              <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto">
                Cuando afilies conductores a tu base con tus códigos de invitación, sus balances de efectivo en mano y límites COD aparecerán aquí en tiempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wallets.map(w => (
                <div key={w.id} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0056d2] flex items-center justify-center font-bold">
                          <Bike className="w-4 h-4" />
                        </div>
                        <strong className="text-sm font-black text-slate-900">{w.driver}</strong>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        w.status === 'blocked' ? 'bg-rose-100 text-rose-800' : w.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {w.status === 'blocked' ? 'Bloqueado COD' : w.status === 'warning' ? 'Cerca Límite' : 'Caja Normal'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Efectivo Retenido</span>
                      <p className="text-2xl font-black text-slate-900">${w.balance.toFixed(2)} MXN</p>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${w.status === 'blocked' ? 'bg-rose-600' : w.status === 'warning' ? 'bg-amber-500' : 'bg-[#0056d2]'}`}
                          style={{ width: `${Math.min(100, (w.balance / w.limit) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block text-right">Tope: ${w.limit.toFixed(2)} MXN</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedWallet(w)
                          setModalMode('limit')
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-xl text-xs font-bold"
                      >
                        Ajustar Límite
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWallet(w)
                          setModalMode('topup')
                        }}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-[#0056d2] py-2 rounded-xl text-xs font-bold"
                      >
                        Abonar
                      </button>
                    </div>

                    <button
                      onClick={() => handleSettleInBase(w.id)}
                      className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      Liquidar Caja en Base ($0.00)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
