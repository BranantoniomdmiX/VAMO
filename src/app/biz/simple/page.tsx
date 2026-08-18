'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  XCircle, 
  Bike, 
  Clock, 
  ArrowLeft, 
  Sparkles, 
  DollarSign, 
  Share2,
  RefreshCw,
  PhoneCall
} from 'lucide-react'

interface StreetOrder {
  id: string
  folio: string
  clientName: string
  items: string[]
  totalCash: number
  driverName: string
  driverPhone: string
  status: 'NUEVO' | 'PREPARANDO' | 'LISTO' | 'ENTREGADO'
  createdAt: string
}

export default function BizSimpleStreetModePage() {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [storeName, setStoreName] = useState('Puesto de Tacos & Gorditas')
  const [orders, setOrders] = useState<StreetOrder[]>([
    {
      id: '1',
      folio: '#4835',
      clientName: 'Don Ricardo G.',
      items: ['3x Gordita de Chicharrón Prensado', '2x Taco de Suadero', '1x Boing de Mango 500ml'],
      totalCash: 165.00,
      driverName: 'Carlos M. (Moto #12)',
      driverPhone: '4611234567',
      status: 'NUEVO',
      createdAt: 'Hace 1 min'
    },
    {
      id: '2',
      folio: '#4839',
      clientName: 'Sra. Patricia L.',
      items: ['5x Tacos al Pastor con Piña', '1x Refresco Coca-Cola Vidrio'],
      totalCash: 120.00,
      driverName: 'Pedro V. (Moto #08)',
      driverPhone: '4619876543',
      status: 'PREPARANDO',
      createdAt: 'Hace 4 min'
    }
  ])

  const [activeOrderIndex, setActiveOrderIndex] = useState(0)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_merchant_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.storeName) setStoreName(parsed.storeName)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const currentOrder = orders[activeOrderIndex] || null

  const speakOrder = (order: StreetOrder) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && soundEnabled) {
      window.speechSynthesis.cancel()
      const text = `Atención. Pedido ${order.folio} para ${order.clientName}. ${order.items.join(', ')}. Cobrar en efectivo ${order.totalCash} pesos. Repartidor asignado: ${order.driverName}.`
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-MX'
      utterance.rate = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleStartPreparing = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'PREPARANDO' } : o))
    if (soundEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('¡Orden en preparación! El repartidor ya va en camino.')
      u.lang = 'es-MX'
      window.speechSynthesis.speak(u)
    }
  }

  const handleMarkReady = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'LISTO' } : o))
    if (soundEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('¡Pedido terminado! Entrega la bolsa al chofer.')
      u.lang = 'es-MX'
      window.speechSynthesis.speak(u)
    }
  }

  const handleHandoverComplete = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id))
    if (soundEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('¡Excelente venta! Cobro registrado con cero comisiones.')
      u.lang = 'es-MX'
      window.speechSynthesis.speak(u)
    }
  }

  const handleCancelOrder = (id: string) => {
    const reason = prompt('¿Por qué se cancela la orden? (Ej. Se agotó el guisado)', 'Se agotó el ingrediente')
    if (reason) {
      setOrders(prev => prev.filter(o => o.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] p-4 sm:p-6 flex flex-col justify-between font-sans selection:bg-[#c3f400] selection:text-[#161e00]">
      
      {/* Barra Superior Simplificada */}
      <header className="flex items-center justify-between border-b border-[#e5e2e1] pb-4">
        <Link 
          href="/biz"
          className="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 border border-[#e5e2e1] active:scale-95 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Salir al Menú</span>
        </Link>

        <div className="text-center">
          <span className="bg-[#0040a1] text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
            MODO CALLEJERO / TAQUERO
          </span>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">{storeName}</h1>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-3 rounded-2xl border text-xs font-black flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-xs ${
            soundEnabled 
              ? 'bg-[#c3f400] text-[#161e00] border-[#abd600]' 
              : 'bg-white text-slate-400 border-slate-200'
          }`}
          title="Activar / Desactivar Voz en Altavoz"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </header>

      {/* Cuerpo Principal del Pedido Activo */}
      <main className="my-auto py-4 max-w-2xl mx-auto w-full space-y-5">
        
        {currentOrder ? (
          <div className="bg-white border-2 border-[#e5e2e1] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-md">
            
            {/* Cabecera del Pedido con Folio y Botón de Escuchar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black text-[#0056d2] uppercase tracking-wider block">
                  PEDIDO EN COLA ({activeOrderIndex + 1} de {orders.length})
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-0.5">
                  {currentOrder.folio} • {currentOrder.clientName}
                </h2>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  ⏱️ {currentOrder.createdAt} &bull; Repartidor: <span className="text-slate-900 font-black">{currentOrder.driverName}</span>
                </p>
              </div>

              <button
                onClick={() => speakOrder(currentOrder)}
                className="bg-[#0040a1] hover:bg-[#0056d2] text-white p-4 rounded-2xl shadow-md flex flex-col items-center justify-center gap-1 active:scale-90 transition-all cursor-pointer shrink-0"
                title="Repetir pedido por voz"
              >
                <Volume2 className="w-7 h-7 text-[#c3f400] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#c3f400]">Escuchar</span>
              </button>
            </div>

            {/* Lista Gigante de Platillos / Ingredientes */}
            <div className="bg-[#f8fafc] p-5 sm:p-6 rounded-[24px] border border-slate-200 space-y-3">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                🍽️ PLATILLOS A PREPARAR:
              </span>
              <ul className="space-y-3">
                {currentOrder.items.map((item, idx) => (
                  <li key={idx} className="text-xl sm:text-2xl font-black text-slate-900 flex items-start gap-3">
                    <span className="text-[#0056d2] text-2xl">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Monto en Efectivo a Cobrar */}
            <div className="bg-[#0040a1] text-white border border-blue-900 p-5 rounded-[24px] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-black text-blue-200 uppercase block">
                  💵 COBRO EN EFECTIVO AL REPARTIDOR:
                </span>
                <span className="text-3xl sm:text-4xl font-black text-[#c3f400]">
                  ${currentOrder.totalCash.toFixed(2)} MXN
                </span>
              </div>
              <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-3.5 py-1.5 rounded-full uppercase shadow-xs">
                0% COMISIÓN
              </span>
            </div>

            {/* BOTONES GIGANTES DE ACCIÓN TÁCTIL */}
            <div className="space-y-3 pt-2">
              {currentOrder.status === 'NUEVO' && (
                <button
                  onClick={() => handleStartPreparing(currentOrder.id)}
                  className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-5 sm:py-6 rounded-[28px] text-xl sm:text-2xl font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <CheckCircle2 className="w-8 h-8" />
                  <span>¡PREPARANDO PEDIDO! 👍</span>
                </button>
              )}

              {currentOrder.status === 'PREPARANDO' && (
                <button
                  onClick={() => handleMarkReady(currentOrder.id)}
                  className="w-full bg-[#0040a1] hover:bg-[#0056d2] text-white py-5 sm:py-6 rounded-[28px] text-xl sm:text-2xl font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Bike className="w-8 h-8 text-[#c3f400]" />
                  <span>¡LISTO PARA EL CHOFER! 🛵</span>
                </button>
              )}

              {currentOrder.status === 'LISTO' && (
                <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-900 py-4 rounded-[28px] text-center font-black text-lg flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span>PEDIDO LISTO — ENTREGAR AL CHOFER</span>
                </div>
              )}

              <button
                onClick={() => handleCancelOrder(currentOrder.id)}
                className="w-full bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 py-3 rounded-2xl text-xs font-black active:scale-95 transition-all cursor-pointer"
              >
                🚫 Se agotó el guisado / No puedo prepararlo
              </button>
            </div>

          </div>
        ) : (
          <div className="text-center py-16 space-y-4 bg-white border border-[#e5e2e1] rounded-[32px] p-8 shadow-xs">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-4xl">
              🌮
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">¡No hay pedidos pendientes!</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">
              Mantén esta pantalla abierta. En cuanto un cliente te pida por VAMO, el celular anunciará la comanda con voz a todo volumen.
            </p>
          </div>
        )}

      </main>

      {/* Footer con Paginador entre Órdenes */}
      {orders.length > 1 && (
        <footer className="flex justify-center gap-2 pt-2">
          {orders.map((ord, i) => (
            <button
              key={ord.id}
              onClick={() => setActiveOrderIndex(i)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeOrderIndex === i
                  ? 'bg-[#c3f400] text-[#161e00] shadow-xs scale-105'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Orden {ord.folio}
            </button>
          ))}
        </footer>
      )}

    </div>
  )
}
