'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Bike, CheckCircle2, ArrowRight, Volume2, Flame, Maximize2, Minimize2, Bell, Sparkles, RefreshCw, Smartphone, LogOut, Lock } from 'lucide-react'

interface Ticket {
  id: string
  customer: string
  items: string[]
  status: 'new' | 'preparing' | 'waiting_driver' | 'on_way'
  time: string
}

export default function StandaloneKdsDisplayPage() {
  const router = useRouter()
  const [isFoodCategory, setIsFoodCategory] = useState(true)
  const [storeName, setStoreName] = useState('Mi Local VAMO')
  const [categoryName, setCategoryName] = useState('Comida')
  const [isSaturated, setIsSaturated] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mobileTab, setMobileTab] = useState<'new' | 'preparing' | 'waiting_driver'>('new')

  useEffect(() => {
    try {
      // Protección de Autorización por PIN
      const isAuth = localStorage.getItem('vamo_kds_station_authorized')
      if (isAuth !== 'true') {
        router.push('/kds/auth')
        return
      }

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
  }, [router])

  const handleLogoutStation = () => {
    try {
      localStorage.removeItem('vamo_kds_station_authorized')
    } catch (e) {
      console.error(e)
    }
    router.push('/kds/auth')
  }

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '#4835',
      customer: 'Sra. Sofía M.',
      items: isFoodCategory 
        ? ['2x Taco Gobernador', '1x Agua de Horchata Literaria']
        : ['1x Paracetamol 500mg (Caja 20 Tab)', '1x Alcohol 70% 500ml'],
      status: 'new',
      time: 'Hace 1m'
    },
    {
      id: '#4829',
      customer: 'Juan P.',
      items: isFoodCategory
        ? ['2x Empanada de Carne', '1x Coca Cola 1.5L']
        : ['1x Taladro Percutor 1/2 Dual', '1x Juego de Brocas 13 Pzs'],
      status: 'new',
      time: 'Hace 2m'
    },
    {
      id: '#4825',
      customer: 'Carlos R.',
      items: isFoodCategory
        ? ['3x Pizza Muzzarella', '2x Cerveza Artesanal']
        : ['2x Bolsa Detergente 1kg', '1x Aceite Cocina 1L'],
      status: 'preparing',
      time: 'Hace 12m'
    },
    {
      id: '#4820',
      customer: 'Ana L.',
      items: ['1x Paquete Surtido Listo'],
      status: 'waiting_driver',
      time: 'Llega en 3m'
    }
  ])

  // Escuchar órdenes autorizadas por Gerencia en Tiempo Real
  useEffect(() => {
    const checkApprovedOrder = () => {
      try {
        const raw = localStorage.getItem('vamo_last_approved_kds_order')
        if (raw) {
          const approved = JSON.parse(raw)
          setTickets(prev => {
            if (prev.some(t => t.id === approved.orderCode)) return prev
            
            speakCommand(`¡Atención ${isFoodCategory ? 'Cocina' : 'Mostrador'}! Nueva orden recibida: ${approved.orderCode}, ${approved.items.join(' y ')}`)

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

  const toggleFullscreen = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
        }
      }
    }
  }

  const moveTicket = (id: string, nextStatus: Ticket['status']) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t))
  }

  const newTickets = tickets.filter(t => t.status === 'new')
  const preparingTickets = tickets.filter(t => t.status === 'preparing')
  const waitingTickets = tickets.filter(t => t.status === 'waiting_driver')
  const onWayTickets = tickets.filter(t => t.status === 'on_way')

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans selection:bg-[#0056d2] selection:text-white">
      
      {/* Header Standalone Monitor KDS (Libre de Sidebars) */}
      <header className="bg-[#161b22] border-b border-slate-800 px-4 md:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0056d2] text-[#c3f400] flex items-center justify-center font-black text-xl shadow-md">
            {isFoodCategory ? '👨‍🍳' : '📦'}
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
              {storeName} &bull; {isFoodCategory ? 'Monitor KDS Cocina' : 'Monitor ODS Mostrador'}
            </h1>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <span className="bg-[#c3f400] text-[#161e00] px-2 py-0.5 rounded-full font-black font-mono">PARIENTE-88</span>
              <span>Sincronizado en Tiempo Real (VAMO Multi-Tenant)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Botón Salir / Bloquear Estación */}
          <button
            onClick={handleLogoutStation}
            className="bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            title="Bloquear Estación y Solicitar PIN"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear</span>
          </button>

          {/* Botón Fullscreen API del Navegador */}
          <button
            onClick={toggleFullscreen}
            className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#c3f400]" />
            <span>{isFullscreen ? 'Salir Fullscreen' : '📱 Pantalla Completa'}</span>
          </button>

          {/* Botón Saturación */}
          <button
            onClick={() => {
              const nextState = !isSaturated
              setIsSaturated(nextState)
              speakCommand(nextState 
                ? 'Atención cocina declarada en saturación. Mas 10 minutos añadidos al tiempo estimado.'
                : 'Cocina en ritmo normal.')
            }}
            className={`px-4 py-2 rounded-full text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer border active:scale-95 ${
              isSaturated 
                ? 'bg-red-600 text-white border-red-400 animate-pulse' 
                : 'bg-[#fddf33] text-[#726200] border-[#726200]/30 hover:bg-[#e2c60f]'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{isSaturated ? '🔥 SATURADO (+10M)' : '🔥 SATURADO (+10M)'}</span>
          </button>
        </div>
      </header>

      {/* NAVEGACIÓN MÓVIL POR TABS (PENSADO PARA CELULARES Y TABLETS EN VERTICAL - SLIDING TABS) */}
      <div className="md:hidden bg-[#161b22] px-3 py-2 border-b border-slate-800 flex justify-between items-center gap-1 sticky top-[69px] z-40">
        <button
          onClick={() => setMobileTab('new')}
          className={`flex-1 py-2.5 px-2 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'new' 
              ? 'bg-[#c3f400] text-[#161e00] shadow-md' 
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Nuevos ({newTickets.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('preparing')}
          className={`flex-1 py-2.5 px-2 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'preparing' 
              ? 'bg-[#fddf33] text-[#726200] shadow-md' 
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Cocción ({preparingTickets.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('waiting_driver')}
          className={`flex-1 py-2.5 px-2 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'waiting_driver' 
              ? 'bg-emerald-500 text-slate-950 shadow-md' 
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Listos ({waitingTickets.length})</span>
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL: KANBAN MULTICOLUMNA EN TABLET/TV & TABS GIGANTES EN CELULAR */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
        
        {/* VISTA MÓVIL (SOLO 1 TAB ACTIVO A LA VEZ CON BOTONES EXTRA GIGANTES PARA CELULAR) */}
        <div className="md:hidden space-y-4">
          {mobileTab === 'new' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-[#c3f400] uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4" /> 1. NUEVOS EN COCINA ({newTickets.length})
              </h2>
              {newTickets.length === 0 ? (
                <div className="bg-[#161b22] p-8 rounded-3xl text-center text-slate-400 font-bold border border-slate-800">
                  No hay pedidos pendientes en lista.
                </div>
              ) : (
                newTickets.map(t => (
                  <div key={t.id} className="bg-[#161b22] p-6 rounded-[28px] border-2 border-[#c3f400] space-y-4 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-3xl font-black text-white block">{t.id}</span>
                        <span className="text-xs font-bold text-slate-400">{t.customer} &bull; {t.time}</span>
                      </div>
                      <button
                        onClick={() => speakCommand(`Ticket ${t.id}: ${t.items.join(' y ')}`)}
                        className="bg-slate-800 text-[#c3f400] p-3 rounded-2xl border border-slate-700 active:scale-95"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800">
                      <ul className="text-lg font-black text-white space-y-2">
                        {t.items.map((it, idx) => <li key={idx}>&bull; {it}</li>)}
                      </ul>
                    </div>

                    <button 
                      onClick={() => moveTicket(t.id, 'preparing')}
                      className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-4 rounded-full font-black text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <span>{isFoodCategory ? '👨‍🍳 COMENCAR COCCIÓN' : '📦 INICIAR SURTIDO'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {mobileTab === 'preparing' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-[#fddf33] uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" /> 2. EN PREPARACIÓN / COCCIÓN ({preparingTickets.length})
              </h2>
              {preparingTickets.length === 0 ? (
                <div className="bg-[#161b22] p-8 rounded-3xl text-center text-slate-400 font-bold border border-slate-800">
                  No hay platillos en cocción actualmente.
                </div>
              ) : (
                preparingTickets.map(t => (
                  <div key={t.id} className="bg-[#161b22] p-6 rounded-[28px] border-2 border-[#fddf33] space-y-4 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-3xl font-black text-white block">{t.id}</span>
                        <span className="text-xs font-bold text-[#fddf33] bg-[#fddf33]/20 px-2.5 py-0.5 rounded-full inline-block mt-1">
                          ⏱️ Cocinando &bull; {t.time}
                        </span>
                      </div>
                      <button
                        onClick={() => speakCommand(`Recordatorio Ticket ${t.id}: ${t.items.join(' y ')}`)}
                        className="bg-slate-800 text-[#fddf33] p-3 rounded-2xl border border-slate-700 active:scale-95"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800">
                      <ul className="text-lg font-black text-white space-y-2">
                        {t.items.map((it, idx) => <li key={idx}>&bull; {it}</li>)}
                      </ul>
                    </div>

                    <button 
                      onClick={() => moveTicket(t.id, 'waiting_driver')}
                      className="w-full bg-[#fddf33] hover:bg-[#e2c60f] text-[#726200] py-4 rounded-full font-black text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isFoodCategory ? '🍜 LISTO EN BARRA' : '📦 LISTO EN MOSTRADOR'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {mobileTab === 'waiting_driver' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Bike className="w-4 h-4" /> 3. LISTO EN ESPERA DE MOTO ({waitingTickets.length})
              </h2>
              {waitingTickets.length === 0 ? (
                <div className="bg-[#161b22] p-8 rounded-3xl text-center text-slate-400 font-bold border border-slate-800">
                  No hay pedidos esperando repartidor.
                </div>
              ) : (
                waitingTickets.map(t => (
                  <div key={t.id} className="bg-[#161b22] p-6 rounded-[28px] border border-emerald-500/50 space-y-4 shadow-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-3xl font-black text-white">{t.id}</span>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/40">
                        🛵 Repartidor en camino
                      </span>
                    </div>

                    <p className="text-base font-bold text-slate-300">{t.items.join(', ')}</p>

                    <button 
                      onClick={() => moveTicket(t.id, 'on_way')}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-full font-black text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <Bike className="w-5 h-5" />
                      <span>ENTREGAR A REPARTIDOR VAMO</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* VISTA DESKOP / TABLET LANDSCAPE / TV (KANBAN MULTICOLUMNA) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Col 1 */}
          <div className="bg-[#161b22] p-4 rounded-[28px] space-y-4 border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-sm md:text-base text-[#c3f400] uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#c3f400]" />
                1. NUEVO EN COCINA
              </h3>
              <span className="bg-[#c3f400] text-[#161e00] text-sm px-3 py-0.5 rounded-full font-black">
                {newTickets.length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {newTickets.map(t => (
                <div key={t.id} className="bg-[#1c212b] p-6 rounded-[24px] border-2 border-[#c3f400] space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-3xl font-black text-white block">{t.id}</span>
                      <span className="text-xs font-bold text-slate-400">{t.customer} &bull; {t.time}</span>
                    </div>
                    <button
                      onClick={() => speakCommand(`Ticket ${t.id}: ${t.items.join(' y ')}`)}
                      className="bg-slate-800 text-[#c3f400] p-2.5 rounded-2xl border border-slate-700 active:scale-95"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800">
                    <ul className="text-lg font-black text-white space-y-1">
                      {t.items.map((it, idx) => <li key={idx}>&bull; {it}</li>)}
                    </ul>
                  </div>

                  <button 
                    onClick={() => moveTicket(t.id, 'preparing')}
                    className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-4 rounded-full font-black text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>{isFoodCategory ? '👨‍🍳 COMENCAR COCCIÓN' : '📦 INICIAR SURTIDO'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Col 2 */}
          <div className="bg-[#161b22] p-4 rounded-[28px] space-y-4 border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-sm md:text-base text-[#fddf33] uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#fddf33]" />
                2. EN PREPARACIÓN
              </h3>
              <span className="bg-[#fddf33] text-[#726200] text-sm px-3 py-0.5 rounded-full font-black">
                {preparingTickets.length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {preparingTickets.map(t => (
                <div key={t.id} className="bg-[#1c212b] p-6 rounded-[24px] border-2 border-[#fddf33] space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-3xl font-black text-white block">{t.id}</span>
                      <span className="text-xs font-bold text-[#fddf33] bg-[#fddf33]/20 px-2.5 py-0.5 rounded-full inline-block mt-1">
                        ⏱️ Cocinando &bull; {t.time}
                      </span>
                    </div>
                    <button
                      onClick={() => speakCommand(`Recordatorio Ticket ${t.id}: ${t.items.join(' y ')}`)}
                      className="bg-slate-800 text-[#fddf33] p-2.5 rounded-2xl border border-slate-700 active:scale-95"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800">
                    <ul className="text-lg font-black text-white space-y-1">
                      {t.items.map((it, idx) => <li key={idx}>&bull; {it}</li>)}
                    </ul>
                  </div>

                  <button 
                    onClick={() => moveTicket(t.id, 'waiting_driver')}
                    className="w-full bg-[#fddf33] hover:bg-[#e2c60f] text-[#726200] py-4 rounded-full font-black text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isFoodCategory ? '🍜 LISTO EN BARRA' : '📦 LISTO EN MOSTRADOR'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Col 3 */}
          <div className="bg-[#161b22] p-4 rounded-[28px] space-y-4 border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-sm md:text-base text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-400" />
                3. LISTO EN ESPERA DE MOTO
              </h3>
              <span className="bg-emerald-500 text-slate-950 text-sm px-3 py-0.5 rounded-full font-black">
                {waitingTickets.length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {waitingTickets.map(t => (
                <div key={t.id} className="bg-[#1c212b] p-6 rounded-[24px] border border-emerald-500/50 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-black text-white">{t.id}</span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/40">
                      🛵 Repartidor en camino
                    </span>
                  </div>

                  <p className="text-base font-bold text-slate-300">{t.items.join(', ')}</p>

                  <button 
                    onClick={() => moveTicket(t.id, 'on_way')}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-full font-black text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Bike className="w-5 h-5" />
                    <span>ENTREGAR A REPARTIDOR VAMO</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Col 4 */}
          <div className="bg-[#161b22] p-4 rounded-[28px] space-y-4 border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-sm md:text-base text-slate-400 uppercase tracking-wider">
                4. EN RUTA AL CLIENTE
              </h3>
              <span className="bg-slate-800 text-slate-400 text-sm px-3 py-0.5 rounded-full font-black">
                {onWayTickets.length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {onWayTickets.map(t => (
                <div key={t.id} className="bg-[#11161d] p-5 rounded-[24px] border border-slate-800 opacity-60 space-y-2">
                  <span className="text-xl font-black text-white block">{t.id} &bull; {t.customer}</span>
                  <p className="text-xs text-slate-400 font-semibold">Entregado a repartidor. En camino al domicilio.</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
