'use client'

import React, { useState, useEffect } from 'react'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { VamoPageHeader } from '@/components/ui/VamoPageHeader'
import { Clock, Bike, CheckCircle2, ArrowRight, Volume2, Flame, Maximize2, Minimize2, Sparkles, Play, Bell, Smartphone } from 'lucide-react'

interface Ticket {
  id: string
  orderId?: string
  customer: string
  items: string[]
  status: 'new' | 'preparing' | 'waiting_driver' | 'on_way'
  time: string
}

export default function BizKdsPage() {
  const [isFoodCategory, setIsFoodCategory] = useState(true)
  const [storeName, setStoreName] = useState('Mi Local VAMO')
  const [categoryName, setCategoryName] = useState('Comida')
  const [isSaturated, setIsSaturated] = useState(false)
  const [isTvMode, setIsTvMode] = useState(false)
  const [activeStage, setActiveStage] = useState<'all' | 'new' | 'preparing' | 'waiting_driver' | 'on_way'>('all')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_merchant_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.storeName) setStoreName(parsed.storeName)
        const cat = parsed.category || 'Comida'
        setCategoryName(cat)
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

  const [tickets, setTickets] = useState<Ticket[]>([])

  // Cargar comandas reales de la API
  const fetchRealTickets = async () => {
    try {
      const res = await fetch('/api/biz/kds/list', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.success && Array.isArray(data.tickets) && data.tickets.length > 0) {
        setTickets(data.tickets)
        return
      }
    } catch (e) {
      console.warn('Error consultando /api/biz/kds/list:', e)
    }

    try {
      const stored = localStorage.getItem('vamo_kds_tickets')
      if (stored) {
        setTickets(JSON.parse(stored))
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchRealTickets()
    const interval = setInterval(fetchRealTickets, 10000)
    return () => clearInterval(interval)
  }, [])

  const saveTickets = (updated: Ticket[]) => {
    setTickets(updated)
    try {
      localStorage.setItem('vamo_kds_tickets', JSON.stringify(updated))
    } catch (e) {}
  }

  const moveTicket = async (id: string, newStatus: Ticket['status']) => {
    const targetTicket = tickets.find(t => t.id === id)
    const effectiveOrderId = targetTicket?.orderId || id

    const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t)
    saveTickets(updated)

    const statusMap: Record<Ticket['status'], string> = {
      'new': 'CONFIRMED',
      'preparing': 'PREPARING',
      'waiting_driver': 'READY_BIZ',
      'on_way': 'IN_TRANSIT'
    }

    try {
      await fetch('/api/biz/kds/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: effectiveOrderId,
          status: statusMap[newStatus] || 'PREPARING'
        })
      })
    } catch (e) {
      console.warn('Sincronización Biz KDS:', e)
    }
  }

  const handleSimulateTestTicket = () => {
    const randomCode = `#${Math.floor(1000 + Math.random() * 9000)}`
    const newT: Ticket = {
      id: randomCode,
      customer: 'Cliente Prueba VAMO',
      items: isFoodCategory 
        ? ['1x Torta Especial con Queso', '1x Refresco 500ml'] 
        : ['1x Producto de Mostrador #1', '1x Insumo Listo'],
      status: 'new',
      time: 'Hace 1m'
    }
    const updated = [newT, ...tickets]
    saveTickets(updated)
    speakCommand(`¡Atención! Nueva comanda de prueba: ${randomCode}`)
  }

  // Escuchar órdenes autorizadas por Gerencia en Tiempo Real
  useEffect(() => {
    const checkApprovedOrder = () => {
      try {
        const raw = localStorage.getItem('vamo_last_approved_kds_order')
        if (raw) {
          const approved = JSON.parse(raw)
          setTickets(prev => {
            if (prev.some(t => t.id === approved.orderCode)) return prev
            
            // Cantar comanda por sintetizador de voz (Hands-Free KDS)
            speakCommand(`¡Atención ${isFoodCategory ? 'Cocina' : 'Mostrador'}! Nueva comanda: ${approved.orderCode}, ${approved.items.join(' y ')}`)

            return [
              {
                id: approved.orderCode || `#${Math.floor(1000 + Math.random()*9000)}`,
                customer: approved.customer || 'Cliente VAMO',
                items: approved.items || ['Pedido Autorizado'],
                status: 'new',
                time: 'Ahora'
              },
              ...prev
            ]
          })
        }
      } catch (err) {
        console.error(err)
      }
    }

    const interval = setInterval(checkApprovedOrder, 2000)
    window.addEventListener('storage', checkApprovedOrder)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', checkApprovedOrder)
    }
  }, [isFoodCategory])

  const speakCommand = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const msg = new SpeechSynthesisUtterance(text)
      msg.rate = 0.95
      window.speechSynthesis.speak(msg)
    }
  }

  return (
    <div className="min-h-screen bg-[#11161d] text-white flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      
      {/* Sidebar Responsivo (Se oculta en Modo TV) */}
      {!isTvMode && <SidebarBiz activeTab="kds" />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header KDS Cocina TV — estandarizado */}
        <div className="px-4 md:px-8 pt-5 pb-2 bg-[#11161d]">
          <VamoPageHeader
            title={`${isFoodCategory ? '👨‍🍳 KDS Cocina' : '📦 ODS Mostrador'} • ${storeName}`}
            description={isFoodCategory
              ? 'Lectura de comandas por voz & control de cocción para cocineros.'
              : 'Surtido de mostrador y empaque para repartidor VAMO.'}
            className="border-slate-800 [&_h1]:text-white [&_p]:text-slate-400"
            badge={
              isSaturated
                ? <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">🔥 SATURADA</span>
                : <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full">FLUJO NORMAL</span>
            }
            primaryAction={
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/kds/display"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#c3f400]" />
                  Monitor ↗
                </a>
                <button
                  onClick={() => setIsTvMode(!isTvMode)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                >
                  {isTvMode ? <Minimize2 className="w-3.5 h-3.5 text-[#c3f400]" /> : <Maximize2 className="w-3.5 h-3.5 text-[#c3f400]" />}
                  {isTvMode ? 'Compacto' : 'Modo TV 📺'}
                </button>
                <button
                  onClick={() => {
                    const nextState = !isSaturated
                    setIsSaturated(nextState)
                    speakCommand(nextState
                      ? 'Cocina declarada en saturación.'
                      : 'Cocina en flujo normal.')
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border active:scale-95 ${
                    isSaturated
                      ? 'bg-red-600 text-white border-red-400 animate-pulse'
                      : 'bg-[#fddf33] text-[#726200] border-[#726200]/30 hover:bg-[#e2c60f]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  {isSaturated ? 'SATURADA (+10 min)' : 'Marcar Saturada'}
                </button>
              </div>
            }
          />
        </div>

        {/* SELECTOR DE ETAPAS PARA CELULARES, TABLETAS Y SMALL LAPTOPS (< 1280px CSS) */}
        <div className="xl:hidden bg-[#161d27] border-b border-slate-800 p-2 sm:p-3 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <button
            onClick={() => setActiveStage('all')}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer ${
              activeStage === 'all' 
                ? 'bg-[#c3f400] text-[#161e00] shadow-xs' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todas ({tickets.length})
          </button>
          <button
            onClick={() => setActiveStage('new')}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer ${
              activeStage === 'new' 
                ? 'bg-[#c3f400] text-[#161e00] shadow-xs' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1. Nuevas ({tickets.filter(t => t.status === 'new').length})
          </button>
          <button
            onClick={() => setActiveStage('preparing')}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer ${
              activeStage === 'preparing' 
                ? 'bg-[#fddf33] text-[#726200] shadow-xs' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2. En Cocina ({tickets.filter(t => t.status === 'preparing').length})
          </button>
          <button
            onClick={() => setActiveStage('waiting_driver')}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer ${
              activeStage === 'waiting_driver' 
                ? 'bg-emerald-500 text-slate-950 shadow-xs' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3. Listas ({tickets.filter(t => t.status === 'waiting_driver').length})
          </button>
          <button
            onClick={() => setActiveStage('on_way')}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer ${
              activeStage === 'on_way' 
                ? 'bg-blue-500 text-white shadow-xs' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            4. En Ruta ({tickets.filter(t => t.status === 'on_way').length})
          </button>
        </div>

        {/* Kanban Board Grid (Adaptable: 1 col en móvil según tab, 2 cols en tablet/small laptop, 4 cols en Desktop/TV >=1280px) */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 max-w-[1920px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Columna 1: NUEVO EN COCINA (YA APROBADO POR CAJA/DUEÑO) */}
          <div className={`${activeStage === 'all' || activeStage === 'new' ? 'flex' : 'hidden xl:flex'} bg-[#1a222d] p-4 rounded-[28px] space-y-4 border border-slate-800 flex-col`}>
            <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-sm md:text-base text-[#c3f400] uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#c3f400]" />
                {isFoodCategory ? '1. NUEVO EN COCINA' : '1. NUEVO EN MOSTRADOR'}
              </h3>
              <span className="bg-[#c3f400] text-[#161e00] text-sm px-3 py-0.5 rounded-full font-black">
                {tickets.filter(t => t.status === 'new').length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {tickets.filter(t => t.status === 'new').length === 0 ? (
                <div role="status" className="flex flex-col items-center justify-center py-10 gap-2 text-slate-600">
                  <CheckCircle2 className="w-10 h-10 text-slate-600 opacity-40" />
                  <p className="text-xs font-bold text-slate-500 text-center">
                    {isFoodCategory ? 'Sin comandas nuevas' : 'Sin pedidos nuevos'}
                  </p>
                  <p className="text-[10px] text-slate-600 text-center opacity-60">
                    Los pedidos aparecerán aquí en tiempo real
                  </p>
                </div>
              ) : (
                tickets.filter(t => t.status === 'new').map(t => (
                <div key={t.id} className="bg-[#232d3b] p-6 rounded-[24px] border-2 border-[#c3f400] space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-white block">{t.id}</span>
                      <span className="text-xs font-bold text-slate-400">{t.customer} &bull; {t.time}</span>
                    </div>
                    
                    <button
                      onClick={() => speakCommand(`Ticket ${t.id}: ${t.items.join(' y ')}`)}
                      className="bg-slate-800 hover:bg-slate-700 text-[#c3f400] p-2.5 rounded-2xl border border-slate-700 transition-all cursor-pointer"
                      title="Cantar Comanda por Audio"
                      aria-label={`Cantar comanda ${t.id} por audio`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-[#1a222d] p-4 rounded-2xl border border-slate-700/60">
                    <ul className="text-base sm:text-lg font-black text-white space-y-1">
                      {t.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-[#c3f400]">&bull;</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => moveTicket(t.id, 'preparing')}
                    className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-4 rounded-full font-black text-sm md:text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>{isFoodCategory ? '👨‍🍳 COMENCAR COCCIÓN' : '📦 INICIAR SURTIDO'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                ))
              )}
            </div>
          </div>

          {/* Columna 2: EN PREPARACIÓN / COCCIÓN */}
          <div className={`${activeStage === 'all' || activeStage === 'preparing' ? 'flex' : 'hidden xl:flex'} bg-[#1a222d] p-4 rounded-[28px] space-y-4 border border-slate-800 flex-col`}>
            <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-sm md:text-base text-[#fddf33] uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#fddf33]" />
                {isFoodCategory ? '2. EN PREPARACIÓN' : '2. EN SURTIDO'}
              </h3>
              <span className="bg-[#fddf33] text-[#726200] text-sm px-3 py-0.5 rounded-full font-black">
                {tickets.filter(t => t.status === 'preparing').length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {tickets.filter(t => t.status === 'preparing').map(t => (
                <div key={t.id} className="bg-[#232d3b] p-6 rounded-[24px] border-2 border-[#fddf33] space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-white block">{t.id}</span>
                      <span className="text-xs font-bold text-[#fddf33] bg-[#fddf33]/20 px-2.5 py-0.5 rounded-full inline-block mt-1">
                        ⏱️ Cocinando &bull; {t.time}
                      </span>
                    </div>

                    <button
                      onClick={() => speakCommand(`Recordatorio Ticket ${t.id}: ${t.items.join(' y ')}`)}
                      className="bg-slate-800 hover:bg-slate-700 text-[#fddf33] p-2.5 rounded-2xl border border-slate-700 transition-all cursor-pointer"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-[#1a222d] p-4 rounded-2xl border border-slate-700/60">
                    <ul className="text-base sm:text-lg font-black text-white space-y-1">
                      {t.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-[#fddf33]">&bull;</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Botón Gigante de Listo */}
                  <button 
                    onClick={() => moveTicket(t.id, 'waiting_driver')}
                    className="w-full bg-[#fddf33] hover:bg-[#e2c60f] text-[#726200] py-4 rounded-full font-black text-sm md:text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isFoodCategory ? '🍜 PLATILLO LISTO EN BARRA' : '📦 PAQUETE LISTO EN MOSTRADOR'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 3: LISTO EN ESPERA DE REPARTIDOR */}
          <div className={`${activeStage === 'all' || activeStage === 'waiting_driver' ? 'flex' : 'hidden xl:flex'} bg-[#1a222d] p-4 rounded-[28px] space-y-4 border border-slate-800 flex-col`}>
            <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-sm md:text-base text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-400" />
                3. LISTO EN ESPERA DE MOTO
              </h3>
              <span className="bg-emerald-500 text-slate-950 text-sm px-3 py-0.5 rounded-full font-black">
                {tickets.filter(t => t.status === 'waiting_driver').length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {tickets.filter(t => t.status === 'waiting_driver').map(t => (
                <div key={t.id} className="bg-[#232d3b] p-6 rounded-[24px] border border-emerald-500/50 space-y-4 shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-black text-white">{t.id}</span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
                      🛵 Repartidor en camino
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-300">{t.items.join(', ')}</p>

                  <button 
                    onClick={() => moveTicket(t.id, 'on_way')}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 rounded-full font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <Bike className="w-5 h-5" />
                    <span>ENTREGAR A REPARTIDOR VAMO</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 4: EN ROUTE AL CLIENTE */}
          <div className={`${activeStage === 'all' || activeStage === 'on_way' ? 'flex' : 'hidden xl:flex'} bg-[#1a222d] p-4 rounded-[28px] space-y-4 border border-slate-800 flex-col`}>
            <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-sm md:text-base text-slate-400 uppercase tracking-wider">
                4. EN RUTA AL CLIENTE
              </h3>
              <span className="bg-slate-800 text-slate-400 text-sm px-3 py-0.5 rounded-full font-black">
                {tickets.filter(t => t.status === 'on_way').length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {tickets.filter(t => t.status === 'on_way').map(t => (
                <div key={t.id} className="bg-[#161d27] p-5 rounded-[24px] border border-slate-800 opacity-60 space-y-2">
                  <span className="text-xl font-black text-white block">{t.id} &bull; {t.customer}</span>
                  <p className="text-xs text-slate-400 font-semibold">Entregado a repartidor. En camino al domicilio.</p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
