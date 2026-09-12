'use client'

import React, { useState, useEffect } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { Wallet, ArrowDownRight, ArrowUpRight, History, PlusCircle, CheckCircle2, AlertTriangle, Lock, Award, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrencyMXN } from '@/lib/utils/formatters'

export interface DriverWalletState {
  balance: number // Saldo digital a favor
  codBalance: number // Efectivo físico en mano
  maxCodLimit: number // Límite de $1,500 MXN
  weeklyFee: number // $50 o $100 semanal pactado
  tier: string
  isCodBlocked: boolean
}

export interface DriverTransaction {
  id: string
  title: string
  date: string
  amount: number
  isPositive: boolean
}

export default function DriverWalletPage() {
  const supabase = createClient()
  const [wallet, setWallet] = useState<DriverWalletState>({
    balance: 0,
    codBalance: 0,
    maxCodLimit: 1500,
    weeklyFee: 100,
    tier: 'PLATA',
    isCodBlocked: false
  })
  const [transactions, setTransactions] = useState<DriverTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('driver')

  useEffect(() => {
    async function loadRealWallet() {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        const currentUserId = user?.id || 'guest-driver'
        setUserId(currentUserId)

        // 1. Consultar balance real desde API / Supabase
        const res = await fetch(`/api/wallet/balance?profileId=${currentUserId}`, { cache: 'no-store' })
        const data = await res.json()

        if (res.ok && data.success && data.wallet) {
          const bal = parseFloat(data.wallet.balance) || 0
          const cod = 0 // Inicialmente $0 en efectivo acumulado para bases limpias

          // Conteo de viajes para gamificación real
          const { count: completedCount } = await supabase
            .from('service_orders')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', currentUserId)
            .eq('status', 'DELIVERED')

          const realTier = (completedCount || 0) >= 30 ? 'NIVEL ORO' : (completedCount || 0) > 0 ? 'NIVEL ACTIVO' : 'NIVEL INICIAL'

          setWallet({
            balance: bal,
            codBalance: cod,
            maxCodLimit: 1500,
            weeklyFee: 100,
            tier: realTier,
            isCodBlocked: cod >= 1500
          })

          if (data.transactions && data.transactions.length > 0) {
            setTransactions(data.transactions.map((tx: any) => ({
              id: tx.id,
              title: tx.description || 'Movimiento de Billetera',
              date: new Date(tx.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
              amount: Math.abs(parseFloat(tx.amount)),
              isPositive: parseFloat(tx.amount) >= 0
            })))
          } else {
            setTransactions([])
          }
        } else {
          // Si no hay datos, inicializar en $0.00 limpio
          setWallet({
            balance: 0,
            codBalance: 0,
            maxCodLimit: 1500,
            weeklyFee: 100,
            tier: 'NIVEL INICIAL',
            isCodBlocked: false
          })
          setTransactions([])
        }
      } catch (err) {
        console.warn('Error cargando billetera real:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadRealWallet()
  }, [])

  const handleTopup = (amount: number) => {
    setWallet(prev => ({ ...prev, balance: prev.balance + amount }))
    setTransactions(prev => [
      {
        id: `TX-TOPUP-${Date.now()}`,
        title: 'Recarga Exprés de Saldo Digital',
        date: 'Hace un momento',
        amount: amount,
        isPositive: true
      },
      ...prev
    ])
    setTopupSuccess(`+$${amount}.00 MXN ingresados a tu saldo digital`)
    setTimeout(() => setTopupSuccess(null), 3500)
  }

  const codPercent = Math.min(100, Math.round((wallet.codBalance / wallet.maxCodLimit) * 100))
  const isNearCodLimit = wallet.codBalance >= 1200 && !wallet.isCodBlocked

  if (isLoading) {
    return (
      <MobileDriverLayout>
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#0056d2]" />
          <span className="text-xs font-black uppercase tracking-wider">Cargando Billetera del Conductor...</span>
        </div>
      </MobileDriverLayout>
    )
  }

  return (
    <MobileDriverLayout>
      <div className="p-5 space-y-5">
        
        {/* Header Billetera */}
        <header className="flex items-center justify-between pt-2">
          <Link href="/driver/home" className="p-2 rounded-full bg-[#f0eded] text-[#1c1b1b]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 bg-[#0040a1] text-white px-3 py-0.5 rounded-full text-[10px] font-black tracking-wide border border-blue-800 shadow-xs">
              <Award className="w-3.5 h-3.5 text-[#c3f400]" />
              <span>SOCIO VAMO &bull; {wallet.tier}</span>
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Billetera & Caja COD</h1>
          </div>
          <div className="w-8" />
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

          <p className="text-3xl sm:text-4xl font-black text-white">
            {formatCurrencyMXN(wallet.codBalance)}
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
              <span>Límite Máximo: {formatCurrencyMXN(wallet.maxCodLimit)}</span>
            </div>
          </div>

          {/* Botón Rendir Corte en Base */}
          {wallet.codBalance > 0 && (
            <button
              onClick={() => {
                const amountSettled = wallet.codBalance
                setWallet(prev => ({ ...prev, codBalance: 0, isCodBlocked: false }))
                setTransactions(prev => [
                  {
                    id: `TX-SETTLE-${Date.now()}`,
                    title: 'Liquidación de Efectivo COD en Base Operativa',
                    amount: amountSettled,
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
        <div className="bg-white p-5 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-3.5">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">SALDO DIGITAL A FAVOR</span>
              <p className="text-2xl font-black text-slate-900">${wallet.balance.toFixed(2)} MXN</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 block">Membresía Semanal:</span>
              <span className="text-xs font-black text-[#0056d2] bg-blue-50 px-2.5 py-1 rounded-full inline-block border border-blue-100">
                ${wallet.weeklyFee.toFixed(2)} MXN / sem
              </span>
            </div>
          </div>

          {/* Opciones de Pago de Membresía */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-900">Estado de Membresía Semanal:</span>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                ✓ Al Día
              </span>
            </div>

            <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
              Tu aportación de conectividad (<span className="text-emerald-700 font-bold">$14 MXN/día</span>) sostiene el GPS satelital y el soporte de tu base local. <strong>¡Tú conservas el 100% de tus tarifas de entrega y propinas con 0% de comisión por viaje!</strong>
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  if (wallet.balance >= wallet.weeklyFee) {
                    setWallet(prev => ({ ...prev, balance: prev.balance - prev.weeklyFee }))
                    setTransactions(prev => [
                      {
                        id: `TX-FEE-${Date.now()}`,
                        title: 'Pago de Membresía Semanal VAMO (Digital)',
                        amount: wallet.weeklyFee,
                        date: 'Hoy, ' + new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                        isPositive: false
                      },
                      ...prev
                    ])
                    setTopupSuccess(`¡Membresía semanal de $${wallet.weeklyFee.toFixed(2)} MXN pagada con saldo digital!`)
                    setTimeout(() => setTopupSuccess(null), 4000)
                  } else {
                    alert(`Saldo digital insuficiente. Recarga saldo o paga tus $${wallet.weeklyFee.toFixed(2)} en efectivo en Base Operativa.`)
                  }
                }}
                className="bg-[#0056d2] hover:bg-[#0040a1] text-white py-2.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                💳 Pagar con Saldo (${wallet.weeklyFee.toFixed(0)})
              </button>

              <button
                onClick={() => {
                  alert(`Acude con el cajero de la Base Operativa y entrega tus $${wallet.weeklyFee.toFixed(2)} MXN en efectivo. Te entregarán tu comprobante foliado al instante.`)
                }}
                className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-2.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                💵 Pagar Efectivo en Base
              </button>
            </div>
          </div>

          {/* Recarga Exprés de Saldo 1-Tap */}
          <div className="pt-1 border-t border-slate-100 space-y-2">
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
            {transactions.length === 0 ? (
              <div className="bg-white p-6 rounded-[20px] border border-[#e5e2e1] text-center space-y-1">
                <span className="text-xs font-black text-slate-800 block">Sin Movimientos Registrados</span>
                <p className="text-[11px] text-slate-500 font-semibold">Tus cobros en efectivo y pagos de membresía aparecerán aquí en tiempo real.</p>
              </div>
            ) : (
              transactions.map(t => (
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
                    {t.isPositive ? '+' : '-'}{formatCurrencyMXN(Math.abs(t.amount))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </MobileDriverLayout>
  )
}
