'use client'

import React, { useState, useEffect } from 'react'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { Store, CheckCircle2, XCircle, Clock, Send, DollarSign, ShoppingBag, Bike, Bell, Volume2, ShieldCheck, AlertCircle, Smartphone } from 'lucide-react'

interface ManagerOrder {
  id: string
  orderCode: string
  customer: string
  items: string[]
  totalPrice: number
  status: 'PENDING_APPROVAL' | 'APPROVED_KITCHEN' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DISPATCHED'
  paymentMethod: 'CASH' | 'CARD'
  time: string
}

export default function BizManagerPage() {
  const [isFoodCategory, setIsFoodCategory] = useState(true)
  const [storeName, setStoreName] = useState('Mi Negocio VAMO')
  const [soundEnabled, setSoundEnabled] = useState(true)

  const [orders, setOrders] = useState<ManagerOrder[]>([
    {
      id: '1',
      orderCode: '#4835',
      customer: 'Sra. Sofía M.',
      items: ['2x Taco Gobernador', '1x Agua de Horchata Literaria'],
      totalPrice: 185.00,
      status: 'PENDING_APPROVAL',
      paymentMethod: 'CASH',
      time: 'Hace 1 min'
    },
    {
      id: '2',
      orderCode: '#4829',
      customer: 'Juan P.',
      items: ['2x Empanada de Carne', '1x Coca Cola 1.5L'],
      totalPrice: 140.00,
      status: 'PENDING_APPROVAL',
      paymentMethod: 'CARD',
      time: 'Hace 3 min'
    },
    {
      id: '3',
      orderCode: '#4825',
      customer: 'Carlos R.',
      items: ['3x Pizza Muzzarella', '2x Cerveza Artesanal'],
      totalPrice: 350.00,
      status: 'APPROVED_KITCHEN',
      paymentMethod: 'CARD',
      time: 'Hace 10 min'
    }
  ])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_merchant_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.storeName) setStoreName(parsed.storeName)
        const cat = parsed.category || 'Comida'
        if (cat.includes('Farmacia') || cat.includes('Ferretería') || cat.includes('Abarrotes') || cat.includes('Ropa') || cat.includes('Servicios')) {
          setIsFoodCategory(false)
        } else {
          setIsFoodCategory(true)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleApproveOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'APPROVED_KITCHEN' } : o))
    
    // Broadcast para sincronizar con Pantalla 2 (KDS Cocina)
    try {
      const approvedOrder = orders.find(o => o.id === id)
      if (approvedOrder) {
        const eventData = { ...approvedOrder, status: 'APPROVED_KITCHEN', timestamp: Date.now() }
        localStorage.setItem('vamo_last_approved_kds_order', JSON.stringify(eventData))
      }
    } catch (err) {
      console.error(err)
    }

    if (soundEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(`Orden enviada a ${isFoodCategory ? 'cocina' : 'mostrador'}`)
      window.speechSynthesis.speak(msg)
    }
  }

  const handleRejectOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const pendingOrders = orders.filter(o => o.status === 'PENDING_APPROVAL')
  const activeOrders = orders.filter(o => o.status !== 'PENDING_APPROVAL')

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      {/* Sidebar Responsivo */}
      <SidebarBiz activeTab="settings" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Pantalla 1: Gerencia & Caja */}
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#0056d2] text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider mb-1">
              <span>PANTALLA 1 &bull; GERENCIA & CAJA</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#1c1b1b] tracking-tight flex items-center gap-2">
              <Store className="w-6 h-6 text-[#0056d2]" />
              {storeName} &bull; Aprobación de Pedidos Entrantes
            </h1>
            <p className="text-xs md:text-sm text-[#737785] font-semibold mt-0.5">
              Valida los pagos y presiona "Enviar a {isFoodCategory ? 'Cocina' : 'Mostrador'}" para transmitir el ticket en vivo a los cocineros.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/kds/display"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-[#c3f400]" />
              <span>📱 Abrir Monitor KDS en Celular / Tablet ↗</span>
            </a>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                soundEnabled ? 'bg-[#c3f400] text-[#161e00]' : 'bg-slate-200 text-slate-700'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{soundEnabled ? 'Sonido Activo 🔊' : 'Silenciado 🔇'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          
          {/* Métricas Rápidas de Caja */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-xs space-y-1">
              <span className="text-[10px] font-black text-[#737785] uppercase block">SOLICITUDES POR APROBAR</span>
              <p className="text-3xl font-black text-[#ba1a1a]">{pendingOrders.length} Pedidos</p>
              <p className="text-[11px] font-semibold text-slate-500">Requieren autorización de caja</p>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-xs space-y-1">
              <span className="text-[10px] font-black text-[#737785] uppercase block">EN {isFoodCategory ? 'COCINA' : 'MOSTRADOR'} (KDS)</span>
              <p className="text-3xl font-black text-[#0056d2]">{activeOrders.length} Pedidos</p>
              <p className="text-[11px] font-semibold text-slate-500">En proceso de preparación / surtido</p>
            </div>

            <div className="bg-[#161e00] text-[#c3f400] p-5 rounded-[24px] border border-[#c3f400]/40 shadow-xs space-y-1">
              <span className="text-[10px] font-black text-[#c3f400] uppercase block">VENTAS TOTALES DEL TURNO</span>
              <p className="text-3xl font-black text-white">$675.00 MXN</p>
              <p className="text-[11px] font-semibold text-slate-300">Cobrado y enviado a preparación</p>
            </div>
          </div>

          {/* SECCIÓN PEDIDOS PENDIENTES DE APROBACIÓN */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#e5e2e1]">
              <h2 className="text-base font-black text-[#ba1a1a] uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#ba1a1a]" />
                Pedidos Entrantes Esperando Aprobación de Gerencia ({pendingOrders.length})
              </h2>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="bg-white p-8 rounded-[32px] border border-[#e5e2e1] text-center space-y-2 text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-[#c3f400] mx-auto" />
                <h3 className="text-base font-black text-[#1c1b1b]">¡Al día! No hay pedidos pendientes de aprobación</h3>
                <p className="text-xs font-semibold">Todas las órdenes recibidas han sido enviadas a la pantalla de {isFoodCategory ? 'cocina' : 'mostrador'}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pendingOrders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-[32px] border-2 border-[#ba1a1a] shadow-lg space-y-4 relative animate-fade-in">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                          PEDIDO ENTRANTE &bull; {order.paymentMethod === 'CASH' ? 'EFECTIVO' : 'TARJETA'}
                        </span>
                        <h3 className="text-lg font-extrabold text-[#1c1b1b] mt-1">{order.orderCode} &bull; {order.customer}</h3>
                      </div>
                      <span className="text-2xl font-black text-[#0056d2]">${order.totalPrice.toFixed(2)}</span>
                    </div>

                    <div className="bg-[#fcf9f8] p-4 rounded-2xl border border-[#e5e2e1]">
                      <span className="text-[10px] font-black text-[#737785] uppercase block mb-1">ARTÍCULOS SOLICITADOS POR EL CLIENTE:</span>
                      <ul className="text-xs font-bold text-[#1c1b1b] space-y-1">
                        {order.items.map((it, idx) => <li key={idx}>&bull; {it}</li>)}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleRejectOrder(order.id)}
                        className="w-1/3 bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#ba1a1a] py-3 rounded-full font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> RECHAZAR
                      </button>

                      <button
                        onClick={() => handleApproveOrder(order.id)}
                        className="w-2/3 bg-[#0056d2] hover:bg-[#0040a1] text-white py-3 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-[#c3f400]" />
                        <span>ACEPTAR & ENVIAR A {isFoodCategory ? 'COCINA 👨‍🍳' : 'MOSTRADOR 📦'}</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN PEDIDOS YA ENVIADOS A COCINA / MOSTRADOR */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#e5e2e1]">
              <h2 className="text-base font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-2">
                <Send className="w-5 h-5 text-[#0056d2]" />
                Pedidos Autorizados y Transmitidos a {isFoodCategory ? 'Cocina KDS' : 'Mostrador ODS'} ({activeOrders.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <strong className="text-xs font-black text-[#1c1b1b]">{order.orderCode} &bull; {order.customer}</strong>
                    <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2 py-0.5 rounded-full">
                      ENVIADO A KDS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">{order.items.join(', ')}</p>
                  <span className="text-xs font-black text-[#0056d2] block">${order.totalPrice.toFixed(2)} MXN</span>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
