'use client'

import React, { useState } from 'react'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { Clock, Bike, CheckCircle2, ArrowRight, Store } from 'lucide-react'

interface Ticket {
  id: string
  customer: string
  items: string[]
  status: 'new' | 'preparing' | 'waiting_driver' | 'on_way'
  time: string
}

export default function BizKdsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '#4829',
      customer: 'Juan P.',
      items: ['2x Empanada de Carne', '1x Coca Cola 1.5L'],
      status: 'new',
      time: 'Hace 2m'
    },
    {
      id: '#4830',
      customer: 'María G.',
      items: ['1x Combo Familiar VAMO'],
      status: 'new',
      time: 'Hace 0m'
    },
    {
      id: '#4825',
      customer: 'Carlos R.',
      items: ['3x Pizza Muzzarella', '2x Cerveza Artesanal'],
      status: 'preparing',
      time: 'Hace 12m'
    },
    {
      id: '#4820',
      customer: 'Ana L.',
      items: ['1x Promo Hamburguesa x2'],
      status: 'waiting_driver',
      time: 'Llega en 3m'
    },
    {
      id: '#4815',
      customer: 'Roberto M.',
      items: ['2x Tacos al Pastor'],
      status: 'on_way',
      time: 'En ruta'
    }
  ])

  const moveTicket = (id: string, nextStatus: Ticket['status']) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t))
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      {/* Sidebar Responsivo */}
      <SidebarBiz activeTab="kds" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header KDS Omnicanal */}
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2] tracking-tight">
              Tablero KDS &bull; Cocina & Despacho
            </h1>
            <p className="text-xs md:text-sm text-[#737785] font-semibold mt-0.5">
              Gestión de pedidos en tiempo real para tu negocio
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-[#c3f400] text-[#161e00] px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#161e00] animate-pulse" />
              Local Abierto
            </span>
          </div>
        </header>

        {/* Kanban Board Grid (1 col Celular, 2 cols Tablet, 4 cols PC) */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* Columna 1: NUEVO */}
          <div className="bg-[#f0eded] p-4 rounded-[28px] space-y-4 border border-[#e5e2e1]/60 flex flex-col">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-[#0056d2] uppercase tracking-wider">
                NUEVO
              </h3>
              <span className="bg-[#0056d2] text-white text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                {tickets.filter(t => t.status === 'new').length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {tickets.filter(t => t.status === 'new').map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-[#e5e2e1] space-y-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-center">
                    <strong className="text-sm sm:text-base text-[#1c1b1b] font-extrabold">{t.id} &bull; {t.customer}</strong>
                    <span className="text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t.time}
                    </span>
                  </div>
                  <ul className="text-xs text-[#424654] font-semibold space-y-1">
                    {t.items.map((item, idx) => <li key={idx}>&bull; {item}</li>)}
                  </ul>
                  <button 
                    onClick={() => moveTicket(t.id, 'preparing')}
                    className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-2.5 rounded-full font-extrabold text-xs shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <span>Comenzar Preparación</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 2: PREPARANDO */}
          <div className="bg-[#f0eded] p-4 rounded-[28px] space-y-4 border border-[#e5e2e1]/60 flex flex-col">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-[#726200] uppercase tracking-wider">
                PREPARANDO
              </h3>
              <span className="bg-[#fddf33] text-[#726200] text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                {tickets.filter(t => t.status === 'preparing').length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {tickets.filter(t => t.status === 'preparing').map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border-2 border-[#fddf33] space-y-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-center">
                    <strong className="text-sm sm:text-base text-[#1c1b1b] font-extrabold">{t.id} &bull; {t.customer}</strong>
                    <span className="text-xs font-bold text-[#726200] bg-[#fddf33]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t.time}
                    </span>
                  </div>
                  <ul className="text-xs text-[#424654] font-semibold space-y-1">
                    {t.items.map((item, idx) => <li key={idx}>&bull; {item}</li>)}
                  </ul>
                  <button 
                    onClick={() => moveTicket(t.id, 'waiting_driver')}
                    className="w-full bg-[#fddf33] hover:bg-[#e2c60f] text-[#726200] py-2.5 rounded-full font-extrabold text-xs shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <span>Listo para Despacho</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 3: ESPERANDO MOTO */}
          <div className="bg-[#f0eded] p-4 rounded-[28px] space-y-4 border border-[#e5e2e1]/60 flex flex-col">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-[#161e00] uppercase tracking-wider">
                ESPERANDO MOTO
              </h3>
              <span className="bg-[#c3f400] text-[#161e00] text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                {tickets.filter(t => t.status === 'waiting_driver').length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {tickets.filter(t => t.status === 'waiting_driver').map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-[#e5e2e1] space-y-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-center">
                    <strong className="text-sm sm:text-base text-[#1c1b1b] font-extrabold">{t.id} &bull; {t.customer}</strong>
                    <span className="text-xs font-bold text-[#161e00] bg-[#c3f400]/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Bike className="w-3 h-3" /> {t.time}
                    </span>
                  </div>
                  <ul className="text-xs text-[#424654] font-semibold space-y-1">
                    {t.items.map((item, idx) => <li key={idx}>&bull; {item}</li>)}
                  </ul>
                  <button 
                    onClick={() => moveTicket(t.id, 'on_way')}
                    className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-2.5 rounded-full font-extrabold text-xs shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <span>Entregar a Moto</span>
                    <Bike className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 4: EN CAMINO */}
          <div className="bg-[#f0eded] p-4 rounded-[28px] space-y-4 border border-[#e5e2e1]/60 flex flex-col">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-[#737785] uppercase tracking-wider">
                EN CAMINO
              </h3>
              <span className="bg-white text-[#737785] text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                {tickets.filter(t => t.status === 'on_way').length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {tickets.filter(t => t.status === 'on_way').map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-[#e5e2e1] space-y-2 opacity-85">
                  <div className="flex justify-between items-center">
                    <strong className="text-sm sm:text-base text-[#1c1b1b] font-extrabold">{t.id} &bull; {t.customer}</strong>
                    <span className="text-xs font-bold text-[#0056d2]">En Ruta</span>
                  </div>
                  <p className="text-xs text-[#737785] font-semibold">Repartidor en camino al domicilio del cliente.</p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
