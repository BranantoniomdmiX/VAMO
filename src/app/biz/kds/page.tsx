'use client'

import React, { useState, useEffect } from 'react'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { Clock, Bike, CheckCircle2, ArrowRight, Volume2, Flame, Maximize2, Minimize2, Sparkles, Play, Bell, Smartphone } from 'lucide-react'

interface Ticket {
  id: string
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_kds_tickets')
      if (stored) {
        setTickets(JSON.parse(stored))
      }
    } catch (e) {}
  }, [])

  const saveTickets = (updated: Ticket[]) => {
    setTickets(updated)
    try {
      localStorage.setItem('vamo_kds_tickets', JSON.stringify(updated))
    } catch (e) {}
  }

  const moveTicket = (id: string, newStatus: Ticket['status']) => {
    const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t)
    saveTickets(updated)
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
        
        {/* Header KDS Cocina TV */}
        <header className="bg-[#1a222d] border-b border-slate-800 px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                {isFoodCategory ? '👨‍🍳 PANTALLA KDS COCINA' : '📦 TABLERO ODS MOSTRADOR'} &bull; {storeName}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-0.5">
              {isFoodCategory 
                ? 'Lectura de comandas por voz & control de cocción para cocineros.'
                : 'Surtido de mostrador y empaque para repartidor VAMO.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Abrir en Ventana Independiente / Celular */}
            <a
              href="/kds/display"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-4 py-2.5 rounded-full text-xs font-black flex items-center gap-2 border border-[#0056d2] transition-all cursor-pointer shadow-md"
            >
              <Smartphone className="w-4 h-4 text-[#c3f400]" />
              <span>📱 Abrir Monitor Independiente Celular/TV ↗</span>
            </a>

            {/* Botón de Pantalla Completa TV */}
            <button
              onClick={() => setIsTvMode(!isTvMode)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-full text-xs font-black flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              {isTvMode ? <Minimize2 className="w-4 h-4 text-[#c3f400]" /> : <Maximize2 className="w-4 h-4 text-[#c3f400]" />}
              <span>{isTvMode ? 'Ocultar Sidebar 📺' : 'Modo TV Completo 📺'}</span>
            </button>

            {/* Botón Gigante de Saturación */}
            <button
              onClick={() => {
                const nextState = !isSaturated
                setIsSaturated(nextState)
                speakCommand(nextState 
                  ? 'Cocina declarada en saturación. Se aumentan 10 minutos al tiempo estimado.'
                  : 'Cocina en flujo normal.')
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer border active:scale-95 ${
                isSaturated 
                  ? 'bg-red-600 text-white border-red-400 animate-pulse' 
                  : 'bg-[#fddf33] text-[#726200] border-[#726200]/30 hover:bg-[#e2c60f]'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>{isSaturated ? '🔥 COCINA SATURADA (+10 MIN ACTIVO)' : '🔥 MARCAR COCINA SATURADA (+10 MIN)'}</span>
            </button>
          </div>
        </header>

        {/* Kanban Board Grid (4 Columnas Gigantes para Televisor de Cocina) */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Columna 1: NUEVO EN COCINA (YA APROBADO POR CAJA/DUEÑO) */}
          <div className="bg-[#1a222d] p-4 rounded-[28px] space-y-4 border border-slate-800 flex flex-col">
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
              {tickets.filter(t => t.status === 'new').map(t => (
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
              ))}
            </div>
          </div>

          {/* Columna 2: EN PREPARACIÓN / COCCIÓN */}
          <div className="bg-[#1a222d] p-4 rounded-[28px] space-y-4 border border-slate-800 flex flex-col">
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
          <div className="bg-[#1a222d] p-4 rounded-[28px] space-y-4 border border-slate-800 flex flex-col">
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
          <div className="bg-[#1a222d] p-4 rounded-[28px] space-y-4 border border-slate-800 flex flex-col">
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
