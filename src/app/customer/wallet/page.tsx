'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { 
  Wallet, CreditCard, PlusCircle, ArrowUpRight, ArrowDownLeft, 
  Gift, ShieldCheck, Zap, Trash2, CheckCircle2, X, Plus, AlertCircle
} from 'lucide-react'

interface SavedCard {
  id: string
  brand: 'VISA' | 'MASTERCARD' | 'AMEX'
  last4: string
  holder: string
  expiry: string
  isDefault: boolean
}

export default function CustomerWalletPage() {
  const [balance, setBalance] = useState(0.00)
  const [points, setPoints] = useState(0)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [isManagingCards, setIsManagingCards] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState(200)
  const [rechargeSuccess, setRechargeSuccess] = useState(false)

  // Formulario Nueva Tarjeta
  const [newCardNumber, setNewCardNumber] = useState('')
  const [newCardHolder, setNewCardHolder] = useState('')
  const [newCardExpiry, setNewCardExpiry] = useState('')
  const [newCardCvc, setNewCardCvc] = useState('')
  const [cardError, setCardError] = useState<string | null>(null)
  const [cardAddedSuccess, setCardAddedSuccess] = useState(false)

  // Métodos de Pago Guardados Reales
  const [cards, setCards] = useState<SavedCard[]>([])

  const [transactions, setTransactions] = useState<{
    id: string
    type: string
    title: string
    date: string
    amount: number
    isPositive: boolean
  }[]>([])

  // Cargar de LocalStorage
  useEffect(() => {
    try {
      const storedCards = localStorage.getItem('vamo_saved_cards')
      if (storedCards) setCards(JSON.parse(storedCards))
      const storedBal = localStorage.getItem('vamo_customer_balance')
      if (storedBal) setBalance(Number(storedBal))
      const storedPts = localStorage.getItem('vamo_user_points')
      if (storedPts) setPoints(Number(storedPts))
      const storedTx = localStorage.getItem('vamo_wallet_transactions')
      if (storedTx) setTransactions(JSON.parse(storedTx))
    } catch (e) {}
  }, [])

  const saveCardsToStorage = (updatedCards: SavedCard[]) => {
    setCards(updatedCards)
    try {
      localStorage.setItem('vamo_saved_cards', JSON.stringify(updatedCards))
    } catch {}
  }

  const handleConfirmRecharge = () => {
    const newBal = balance + rechargeAmount
    setBalance(newBal)
    setPoints(prev => prev + Math.floor(rechargeAmount * 0.10))
    try {
      localStorage.setItem('vamo_customer_balance', newBal.toString())
    } catch {}

    setTransactions(prev => [
      {
        id: `TX-${Date.now()}`,
        type: 'RECHARGE',
        title: 'Recarga Express VAMO Pay',
        date: 'Hoy, ' + new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        amount: rechargeAmount,
        isPositive: true
      },
      ...prev
    ])
    setRechargeSuccess(true)
    setTimeout(() => {
      setRechargeSuccess(false)
      setShowRechargeModal(false)
    }, 1200)
  }

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanNum = newCardNumber.replace(/\s+/g, '')
    if (cleanNum.length < 15) {
      setCardError('Ingresa los 16 dígitos de tu tarjeta')
      return
    }
    if (!newCardHolder.trim()) {
      setCardError('Ingresa el nombre del titular')
      return
    }
    if (!newCardExpiry.includes('/')) {
      setCardError('Ingresa la fecha de vencimiento MM/AA')
      return
    }

    const brand = cleanNum.startsWith('4') ? 'VISA' : cleanNum.startsWith('3') ? 'AMEX' : 'MASTERCARD'
    const newCardObj: SavedCard = {
      id: `card-${Date.now()}`,
      brand,
      last4: cleanNum.slice(-4),
      holder: newCardHolder.toUpperCase(),
      expiry: newCardExpiry,
      isDefault: cards.length === 0
    }

    const updated = [...cards, newCardObj]
    saveCardsToStorage(updated)

    setCardAddedSuccess(true)
    setTimeout(() => {
      setCardAddedSuccess(false)
      setShowAddCardModal(false)
      setNewCardNumber('')
      setNewCardHolder('')
      setNewCardExpiry('')
      setNewCardCvc('')
      setCardError(null)
    }, 1200)
  }

  const handleSetDefault = (cardId: string) => {
    const updated = cards.map(c => ({
      ...c,
      isDefault: c.id === cardId
    }))
    saveCardsToStorage(updated)
  }

  const handleDeleteCard = (cardId: string) => {
    const updated = cards.filter(c => c.id !== cardId)
    saveCardsToStorage(updated)
  }

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <span className="bg-[#0056d2]/10 text-[#0056d2] text-xs font-black px-3 py-1 rounded-full uppercase">
              BILLETERA DIGITAL VAMO
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Mi Saldo & Métodos de Pago</h1>
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
            <Link 
              href="/customer/rewards"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border border-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <Gift className="w-4 h-4 text-[#c3f400]" />
              <span>{points} Puntos &bull; Canjear 🎁</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 pt-2 relative z-10">
            <button 
              onClick={() => setShowRechargeModal(true)}
              className="flex-1 bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Recargar Saldo
            </button>
            <button 
              onClick={() => setShowAddCardModal(true)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Nueva Tarjeta
            </button>
          </div>

          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#c3f400]/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Métodos de Pago Guardados */}
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-900 uppercase">MÉTODOS DE PAGO ACTIVOS</h2>
            <button
              onClick={() => setIsManagingCards(!isManagingCards)}
              className="text-xs font-black text-[#0056d2] hover:underline cursor-pointer"
            >
              {isManagingCards ? 'Listo' : 'Administrar'}
            </button>
          </div>

          <div className="space-y-2.5">
            {cards.map(card => (
              <div 
                key={card.id} 
                className="p-4 rounded-2xl bg-[#fcf9f8] border border-[#e5e2e1] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    {card.brand}
                  </div>
                  <div>
                    <strong className="text-xs font-black text-slate-900 block">
                      Tarjeta {card.brand} &bull;&bull;&bull;&bull; {card.last4}
                    </strong>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {card.holder} &bull; Expira {card.expiry}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {card.isDefault ? (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                      Predeterminada
                    </span>
                  ) : isManagingCards ? (
                    <button
                      onClick={() => handleSetDefault(card.id)}
                      className="text-[11px] font-bold text-[#0056d2] hover:underline"
                    >
                      Hacer Predeterminada
                    </button>
                  ) : null}

                  {isManagingCards && (
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Efectivo al Recibir COD */}
            <div className="p-4 rounded-2xl bg-[#fcf9f8] border border-[#e5e2e1] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#161e00] text-[#c3f400] flex items-center justify-center font-black text-base shadow-xs">
                  💵
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block">Efectivo al Recibir (COD)</strong>
                  <span className="text-[11px] font-semibold text-slate-500">Pagas en efectivo al motociclista con PIN</span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">Activo</span>
            </div>
          </div>
        </div>

        {/* Historial de Movimientos */}
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase">HISTORIAL DE MOVIMIENTOS</h2>

          <div className="divide-y divide-[#f0eded]">
            {transactions.map(tx => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    tx.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tx.isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5 text-rose-600" />}
                  </div>
                  <div>
                    <strong className="text-xs font-black text-slate-900 block">{tx.title}</strong>
                    <span className="text-[10px] font-semibold text-slate-400">{tx.date}</span>
                  </div>
                </div>

                <span className={`text-xs font-black ${tx.isPositive ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {tx.isPositive ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Recarga de Saldo */}
        {showRechargeModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-[#e5e2e1] animate-fade-in">
              <div className="w-14 h-14 bg-[#0056d2] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <PlusCircle className="w-8 h-8 text-[#c3f400]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Recargar VAMO Pay</h3>
                <p className="text-xs font-semibold text-slate-500">Paga pedidos y servicios con 1 solo toque y gana 10% en puntos</p>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2">
                {[100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(amt)}
                    className={`py-3 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                      rechargeAmount === amt
                        ? 'bg-[#c3f400] text-[#161e00] border-[#161e00] scale-105 shadow-xs'
                        : 'bg-[#f6f3f2] text-slate-700 border-[#e5e2e1]'
                    }`}
                  >
                    ${amt} MXN
                  </button>
                ))}
              </div>

              {rechargeSuccess ? (
                <div className="bg-emerald-100 text-emerald-800 p-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>¡Recarga de ${rechargeAmount}.00 MXN Exitosa!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleConfirmRecharge}
                    className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-full text-xs font-black shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    CONFIRMAR RECARGA CON TARJETA
                  </button>
                  <button
                    onClick={() => setShowRechargeModal(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-full text-xs font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Nueva Tarjeta */}
        {showAddCardModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#e5e2e1] animate-fade-in">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0056d2] text-white flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Agregar Nueva Tarjeta</h3>
                </div>
                <button 
                  onClick={() => setShowAddCardModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cardAddedSuccess ? (
                <div className="bg-emerald-100 text-emerald-800 p-4 rounded-2xl text-center font-black text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>¡Tarjeta agregada con éxito!</span>
                </div>
              ) : (
                <form onSubmit={handleAddCard} className="space-y-3">
                  {cardError && (
                    <div className="bg-rose-50 text-rose-800 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cardError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Nombre en la Tarjeta</label>
                    <input
                      type="text"
                      placeholder="Ej. CARLOS MENDOZA"
                      value={newCardHolder}
                      onChange={e => setNewCardHolder(e.target.value)}
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-xl p-3 text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Número de Tarjeta</label>
                    <input
                      type="text"
                      placeholder="•••• •••• •••• ••••"
                      maxLength={19}
                      value={newCardNumber}
                      onChange={e => setNewCardNumber(e.target.value)}
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-xl p-3 text-xs font-mono font-bold outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Vencimiento</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={newCardExpiry}
                        onChange={e => setNewCardExpiry(e.target.value)}
                        className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-xl p-3 text-xs font-mono font-bold outline-none text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">CVC / CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={newCardCvc}
                        onChange={e => setNewCardCvc(e.target.value)}
                        className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-xl p-3 text-xs font-mono font-bold outline-none text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-full text-xs font-black shadow-md cursor-pointer active:scale-95 transition-all mt-2"
                  >
                    GUARDAR MÉTODO DE PAGO
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  )
}
