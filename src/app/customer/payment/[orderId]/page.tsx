'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { PaymentService, PaymentResult, PaymentMethod } from '@/lib/services/paymentService'
import {
  CreditCard, Building2, Store, Banknote,
  CheckCircle2, XCircle, Loader2, Copy, ExternalLink,
  AlertTriangle, Clock, ShieldCheck, Bike
} from 'lucide-react'

interface PaymentPageProps {
  params: Promise<{ orderId: string }>
}

export default function CustomerPaymentPage({ params }: PaymentPageProps) {
  const router = useRouter()
  const [orderId, setOrderId] = useState<string>('')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash')
  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState<string>('')

  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [step, setStep] = useState<'select' | 'processing' | 'result'>('select')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setOrderId(p.orderId)
      // 1. Cargar datos autoritativos de la orden desde el servidor (F5 Safe)
      fetch(`/api/orders/${p.orderId}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.order) {
            setAmount(data.order.total)
            setDescription(`Envío VAMO ${data.order.code} — ${data.order.originAddress} ➔ ${data.order.destinationAddress}`)
          }
        })
        .catch(() => {
          // Fallback a localStorage sólo como caché secundario si la red parpadea
          try {
            const pendingPayment = localStorage.getItem('vamo_pending_payment')
            if (pendingPayment) {
              const data = JSON.parse(pendingPayment)
              setAmount(data.amount || 85)
              setDescription(data.description || 'Envío VAMO')
            }
          } catch {}
        })
    })
  }, [params])

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handlePay = async () => {
    setIsProcessing(true)
    setStep('processing')

    const result = await PaymentService.createPayment({
      orderId,
      amount,
      paymentMethod: selectedMethod,
      customerName: 'Cliente VAMO',
      customerEmail: 'cliente@vamo.app',
      customerPhone: '5551234567',
      description
    })

    setPaymentResult(result)
    setIsProcessing(false)

    if (selectedMethod === 'card' && result.checkoutUrl) {
      // Redirigir al checkout hosted de Conekta
      window.location.href = result.checkoutUrl
      return
    }

    setStep('result')

    // Si fue efectivo, ir directo al tracking
    if (selectedMethod === 'cash' && result.success) {
      setTimeout(() => router.push(`/customer/tracking/${orderId}`), 1500)
    }
  }

  const paymentMethods = [
    {
      id: 'card' as PaymentMethod,
      icon: CreditCard,
      title: 'Tarjeta de Crédito / Débito',
      subtitle: 'Visa, Mastercard, American Express — Pago directo y seguro',
      badge: 'Inmediato',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      color: 'border-blue-200 hover:border-[#0040A1]'
    },
    {
      id: 'oxxo_cash' as PaymentMethod,
      icon: Store,
      title: 'Pago en OXXO',
      subtitle: 'Genera tu referencia y paga en cualquier OXXO',
      badge: 'Hasta 72 hrs',
      badgeColor: 'bg-amber-100 text-amber-800',
      color: 'border-amber-200 hover:border-amber-500'
    },
    {
      id: 'spei' as PaymentMethod,
      icon: Building2,
      title: 'Transferencia SPEI',
      subtitle: 'Transfiere desde tu banca en línea con la CLABE',
      badge: 'Hasta 24 hrs',
      badgeColor: 'bg-purple-100 text-purple-800',
      color: 'border-purple-200 hover:border-purple-500'
    },
    {
      id: 'cash' as PaymentMethod,
      icon: Banknote,
      title: 'Efectivo al Repartidor',
      subtitle: 'Paga en efectivo cuando llegue tu moto VAMO',
      badge: 'Al recibir',
      badgeColor: 'bg-slate-100 text-slate-700',
      color: 'border-slate-200 hover:border-slate-400'
    }
  ]

  return (
    <CustomerLayout>
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* Header */}
        <header className="text-center space-y-1">
          <span className="bg-[#0040A1] text-white text-xs font-black px-3.5 py-1 rounded-full uppercase">
            PAGO SEGURO
          </span>
          <h1 className="text-2xl font-extrabold text-[#1c1b1b]">¿Cómo quieres pagar?</h1>
          {amount > 0 && (
            <p className="text-4xl font-black text-[#C3F400] bg-[#161e00] inline-block px-4 py-1 rounded-2xl">
              ${amount.toFixed(2)} MXN
            </p>
          )}
        </header>

        {/* ── PASO: SELECCIÓN DE MÉTODO ── */}
        {step === 'select' && (
          <>
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const isSelected = selectedMethod === method.id
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full text-left bg-white p-4 rounded-[24px] border-2 transition-all flex items-center gap-4 ${
                      isSelected
                        ? 'border-[#0040A1] shadow-md bg-blue-50/30'
                        : `border-[#e5e2e1] ${method.color}`
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#0040A1] text-white' : 'bg-[#f6f3f2] text-slate-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-[#1c1b1b]">{method.title}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${method.badgeColor}`}>
                          {method.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                        {method.subtitle}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      isSelected ? 'border-[#0040A1] bg-[#0040A1]' : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Sello de Seguridad Humano */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tus pagos y tarjetas están 100% protegidos</span>
            </div>

            <button
              onClick={handlePay}
              disabled={!selectedMethod}
              className="w-full bg-[#0040A1] hover:bg-[#002d72] text-white py-4 rounded-full font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <Bike className="w-5 h-5" />
              <span>CONFIRMAR PEDIDO Y PAGAR</span>
            </button>
          </>
        )}

        {/* ── PASO: PROCESANDO ── */}
        {step === 'processing' && (
          <div className="bg-white rounded-[32px] border border-[#e5e2e1] p-10 text-center space-y-4 shadow-sm">
            <Loader2 className="w-14 h-14 text-[#0040A1] animate-spin mx-auto" />
            <h2 className="text-lg font-black text-[#1c1b1b]">Procesando tu pago…</h2>
            <p className="text-sm text-slate-500">Conectando de forma segura con la pasarela</p>
          </div>
        )}

        {/* ── PASO: RESULTADO ── */}
        {step === 'result' && paymentResult && (
          <div className="space-y-4">

            {/* ÉXITO — Efectivo */}
            {selectedMethod === 'cash' && paymentResult.success && (
              <div className="bg-[#161e00] text-white p-8 rounded-[32px] text-center space-y-3">
                <CheckCircle2 className="w-14 h-14 text-[#C3F400] mx-auto" />
                <h2 className="text-xl font-black text-[#C3F400]">¡Pedido Confirmado!</h2>
                <p className="text-sm text-slate-300">Tu moto VAMO está en camino. Paga en efectivo al recibirlo.</p>
                <div className="text-3xl font-black text-white">${amount.toFixed(2)} MXN</div>
                <p className="text-xs text-slate-400">Redirigiendo al tracking…</p>
              </div>
            )}

            {/* ÉXITO — OXXO */}
            {selectedMethod === 'oxxo_cash' && paymentResult.success && paymentResult.reference && (
              <div className="bg-white rounded-[32px] border border-[#e5e2e1] p-6 space-y-4 shadow-sm">
                <div className="text-center space-y-1">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <Store className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-xl font-black text-[#1c1b1b]">Paga en OXXO</h2>
                  <p className="text-xs text-slate-500">Presenta esta referencia en cualquier tienda OXXO</p>
                </div>

                <div className="bg-[#f6f3f2] rounded-2xl p-4 text-center space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Referencia de pago</span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black text-[#1c1b1b] tracking-widest">
                      {paymentResult.reference}
                    </span>
                    <button
                      onClick={() => handleCopy(paymentResult.reference!, 'reference')}
                      className="p-2 bg-white rounded-xl border border-[#e5e2e1] hover:bg-[#e5e2e1] transition-all"
                    >
                      {copiedField === 'reference'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        : <Copy className="w-4 h-4 text-slate-500" />
                      }
                    </button>
                  </div>
                  <div className="text-3xl font-black text-[#0040A1]">${amount.toFixed(2)} MXN</div>
                </div>

                {paymentResult.expiresAt && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-2xl p-3">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      Vence el: <strong>{PaymentService.formatExpiry(paymentResult.expiresAt)}</strong>
                    </span>
                  </div>
                )}

                <button
                  onClick={() => router.push(`/customer/tracking/${orderId}`)}
                  className="w-full bg-[#0040A1] text-white py-3 rounded-full font-black text-sm"
                >
                  Ver Estado de mi Pedido →
                </button>
              </div>
            )}

            {/* ÉXITO — SPEI */}
            {selectedMethod === 'spei' && paymentResult.success && paymentResult.clabe && (
              <div className="bg-white rounded-[32px] border border-[#e5e2e1] p-6 space-y-4 shadow-sm">
                <div className="text-center space-y-1">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Building2 className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-black text-[#1c1b1b]">Transferencia SPEI</h2>
                  <p className="text-xs text-slate-500">Realiza la transferencia desde tu banca en línea</p>
                </div>

                <div className="bg-[#f6f3f2] rounded-2xl p-4 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">CLABE Interbancaria</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#1c1b1b] tracking-widest font-mono">
                        {paymentResult.clabe}
                      </span>
                      <button
                        onClick={() => handleCopy(paymentResult.clabe!, 'clabe')}
                        className="p-1.5 bg-white rounded-xl border border-[#e5e2e1] hover:bg-[#e5e2e1]"
                      >
                        {copiedField === 'clabe'
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          : <Copy className="w-4 h-4 text-slate-500" />
                        }
                      </button>
                    </div>
                  </div>
                  {paymentResult.bank && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Banco destino</span>
                      <p className="font-black text-[#1c1b1b]">{paymentResult.bank}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Monto exacto</span>
                    <p className="text-2xl font-black text-[#0040A1]">${amount.toFixed(2)} MXN</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-2xl p-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Tu pedido se confirma automáticamente cuando recibamos la transferencia.</span>
                </div>

                <button
                  onClick={() => router.push(`/customer/tracking/${orderId}`)}
                  className="w-full bg-[#0040A1] text-white py-3 rounded-full font-black text-sm"
                >
                  Ver Estado de mi Pedido →
                </button>
              </div>
            )}

            {/* ERROR / FONDOS INSUFICIENTES */}
            {!paymentResult.success && (
              <div className="bg-white border-2 border-rose-200 rounded-[32px] p-6 text-center space-y-4 shadow-md">
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-[#1c1b1b]">Tu banco no pudo autorizar el cargo</h2>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Es posible que tu tarjeta no cuente con fondos suficientes o requiera autorización en tu app bancaria.
                  </p>
                </div>

                <div className="bg-[#fcf9f8] p-4 rounded-2xl border border-[#e5e2e1] space-y-2">
                  <span className="text-[10px] font-black text-[#737785] uppercase block">OPCIONES RÁPIDAS (1 TOQUE):</span>
                  <button
                    onClick={() => {
                      setSelectedMethod('cash')
                      handlePay()
                    }}
                    className="w-full bg-[#161e00] text-[#c3f400] hover:bg-black py-3 rounded-full font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>PAGAR EN EFECTIVO AL RECIBIR ($ {amount.toFixed(2)} MXN)</span>
                  </button>
                  <button
                    onClick={() => setStep('select')}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-full font-bold text-xs transition-all"
                  >
                    Intentar con otra Tarjeta o SPEI
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </CustomerLayout>
  )
}
