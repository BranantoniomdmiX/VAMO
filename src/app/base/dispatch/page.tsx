'use client'

import React, { useState } from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { Radio, Bike, Check, ArrowRight, UserCheck } from 'lucide-react'

export default function BaseDispatchPage() {
  const [orders, setOrders] = useState([
    { id: '#V-9045', origin: 'Av. Revolución #89', destination: 'Calle 5 de Mayo #12', customer: 'Pedro L.', status: 'unassigned' },
    { id: '#V-9044', origin: 'Taquería El Pastor', destination: 'Calle Juárez #452', customer: 'María G.', status: 'assigned', driver: 'Carlos M.' }
  ])

  const assignDriver = (id: string, driverName: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'assigned', driver: driverName } : o))
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="dispatch" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Consola de Despacho en Vivo</h1>
            <p className="text-xs text-[#737785] font-semibold">Asignación manual y automática de viajes a repartidores</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-[#1c1b1b]">Pedidos por Asignar / En Ruta</h2>

            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-base font-extrabold text-[#1c1b1b]">{o.id} &bull; {o.customer}</strong>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        o.status === 'unassigned' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#c3f400] text-[#161e00]'
                      }`}>
                        {o.status === 'unassigned' ? 'SIN REPARTIDOR' : `ASIGNADO A ${o.driver}`}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#737785]">Origen: {o.origin} &bull; Destino: {o.destination}</p>
                  </div>

                  {o.status === 'unassigned' && (
                    <button 
                      onClick={() => assignDriver(o.id, 'Roberto M.')}
                      className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-2.5 rounded-full text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Asignar a Roberto M.</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
