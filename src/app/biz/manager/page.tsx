'use client'

import React, { useState, useEffect, useRef } from 'react'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { VamoPageHeader } from '@/components/ui/VamoPageHeader'
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

  const [orders, setOrders] = useState<ManagerOrder[]>([])
  const [orderToReject, setOrderToReject] = useState<ManagerOrder | null>(null)
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null)
  const cancelDialogButtonRef = useRef<HTMLButtonElement | null>(null)

  const closeRejectDialog = () => {
    setOrderToReject(null)
    // Return focus to the trigger button for full accessibility
    setTimeout(() => {
      triggerButtonRef.current?.focus()
    }, 50)
  }

  const openRejectDialog = (order: ManagerOrder, triggerElement: HTMLButtonElement) => {
    triggerButtonRef.current = triggerElement
    setOrderToReject(order)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && orderToReject) {
        closeRejectDialog()
      }
    }
    if (orderToReject) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the cancel button when dialog opens for safe focus trap entry
      setTimeout(() => {
        cancelDialogButtonRef.current?.focus()
      }, 50)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [orderToReject])

  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem('vamo_manager_orders')
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders))
      } else {
        const defaultOrders: ManagerOrder[] = [
          {
            id: 'ord-vmo-7741',
            orderCode: '#7741',
            customer: 'Valeria Mendoza',
            items: ['1x Torta Especial Ahogada', '1x Refresco 600ml'],
            totalPrice: 165.00,
            status: 'PENDING_APPROVAL',
            paymentMethod: 'CASH',
            time: '12:45 PM'
          },
          {
            id: 'ord-vmo-7742',
            orderCode: '#7742',
            customer: 'Carlos Santillán',
            items: ['2x Tacos de Barbacoa', '1x Consomé Especial'],
            totalPrice: 210.00,
            status: 'APPROVED_KITCHEN',
            paymentMethod: 'CARD',
            time: '12:30 PM'
          }
        ]
        setOrders(defaultOrders)
        localStorage.setItem('vamo_manager_orders', JSON.stringify(defaultOrders))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

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
        <div className="px-4 md:px-8 pt-6 pb-2">
          <VamoPageHeader
            title={`${storeName} • Aprobación de Pedidos`}
            description={`Valida los pagos y envía el ticket a ${isFoodCategory ? 'Cocina' : 'Mostrador'} (KDS).`}
            badge={
              <span className="bg-[#0056d2] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Pantalla 1 • Gerencia & Caja
              </span>
            }
            primaryAction={
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/kds/display"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#c3f400]" />
                  Monitor KDS ↗
                </a>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    soundEnabled ? 'bg-[#c3f400] text-[#161e00]' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {soundEnabled ? 'Sonido 🔊' : 'Silenciado 🔇'}
                </button>
              </div>
            }
          />
        </div>

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
                        type="button"
                        onClick={(e) => openRejectDialog(order, e.currentTarget)}
                        aria-label={`Rechazar pedido ${order.orderCode}`}
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
                <div key={order.id} className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <strong className="text-xs font-black text-[#1c1b1b]">{order.orderCode} &bull; {order.customer}</strong>
                    <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2 py-0.5 rounded-full">
                      ENVIADO A KDS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">{order.items.join(', ')}</p>
                  <span className="text-xs font-black text-[#0056d2] block">${order.totalPrice.toFixed(2)} MXN</span>
                  
                  {/* FOTO DE EMPAQUE SELLADO Y ENTREGA AL CHOFER */}
                  <div className="pt-2 border-t border-[#e5e2e1] flex gap-2">
                    <button
                      onClick={() => alert(`📷 Foto de empaque capturada con folio ${order.orderCode}. Bolsa sellada registrada.`)}
                      className="flex-1 bg-[#161e00] text-[#c3f400] hover:bg-black py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Foto Sello 📸</span>
                    </button>
                    <button
                      onClick={() => alert(`🛵 Pedido ${order.orderCode} entregado formalmente al repartidor.`)}
                      className="flex-1 bg-[#0056d2] text-white hover:bg-[#0040a1] py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Dar Salida</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal VAMO de Confirmación Destructiva: Rechazo de Pedido */}
          {orderToReject && (
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeRejectDialog()
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="reject-dialog-title"
                aria-describedby="reject-dialog-description"
                className="bg-white rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#e5e2e1] text-left animate-fade-in"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ba1a1a] text-white flex items-center justify-center font-black shrink-0">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="reject-dialog-title" className="text-base font-black text-slate-900">
                      ¿Rechazar este pedido?
                    </h3>
                    <span className="text-[10px] font-bold text-[#ba1a1a] uppercase tracking-wider">
                      Acción Destructiva Irreversible
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Folio:</span>
                    <strong className="font-black text-slate-900">{orderToReject.orderCode}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Cliente:</span>
                    <strong className="font-black text-slate-900">{orderToReject.customer}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Total:</span>
                    <strong className="font-black text-[#0056d2]">${orderToReject.totalPrice.toFixed(2)} MXN</strong>
                  </div>
                  <div className="pt-1 border-t border-slate-200 text-xs text-slate-600 font-semibold">
                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-0.5">Artículos:</span>
                    <span>{orderToReject.items.join(', ')}</span>
                  </div>
                </div>

                <p id="reject-dialog-description" className="text-xs text-slate-600 font-medium leading-relaxed">
                  El pedido <strong>{orderToReject.orderCode}</strong> será eliminado de forma definitiva del sistema de gerencia. El cliente no será notificado por esta vía y la orden no se transmitirá a cocina ni a mostrador. <strong>Esta acción no se puede deshacer.</strong>
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    ref={cancelDialogButtonRef}
                    type="button"
                    onClick={closeRejectDialog}
                    className="flex-1 bg-[#f0eded] hover:bg-slate-200 text-slate-700 py-3 rounded-full text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const id = orderToReject.id
                      closeRejectDialog()
                      handleRejectOrder(id)
                    }}
                    className="flex-1 bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar pedido</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

