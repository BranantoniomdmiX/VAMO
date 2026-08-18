'use client'

import React, { useState } from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { Package, Plus, Edit, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function BaseWarehousePage() {
  const [items, setItems] = useState([
    { id: 1, serial: 'MOCH-NEON-001', name: 'Mochila Térmica Neón VAMO', stock: '8 disponibles', assignedTo: 'Carlos M. (MOTO-01)', deposit: '$500.00 MXN', status: 'En Préstamo' },
    { id: 2, serial: 'CASC-PRO-204', name: 'Casco Certificado DOT VAMO', stock: '15 disponibles', assignedTo: 'Sin asignar (En Base)', deposit: '$350.00 MXN', status: 'En Base' },
    { id: 3, serial: 'CAN-ALUM-882', name: 'Canastilla Trasera Reforzada', stock: '5 disponibles', assignedTo: 'Ana P. (MOTO-04)', deposit: '$400.00 MXN', status: 'En Préstamo' }
  ])

  const [message, setMessage] = useState<string | null>(null)

  const toggleAssignment = (id: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const isAssigned = item.status === 'En Préstamo'
        setMessage(isAssigned ? `Equipo ${item.serial} devuelto a almacén base` : `Equipo ${item.serial} asignado a repartidor`)
        setTimeout(() => setMessage(null), 3000)
        return {
          ...item,
          status: isAssigned ? 'En Base' : 'En Préstamo',
          assignedTo: isAssigned ? 'Sin asignar (En Base)' : 'Asignado en Turno'
        }
      }
      return item
    }))
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="warehouse" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0040a1]">Control de Almacén e Inventario</h1>
            <p className="text-xs text-slate-500 font-semibold">Equipamiento, mochilas térmicas y canastillas con número de serie</p>
          </div>

          <button 
            onClick={() => alert('Abriendo formulario de registro de nuevo número de serie de equipo...')}
            className="bg-[#0040a1] hover:bg-[#0056d2] text-white px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#c3f400]" />
            <span>+ Registrar Equipo Serializado</span>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {message && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-black shadow-xs animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black bg-[#0056d2]/10 text-[#0056d2] px-2.5 py-0.5 rounded-full uppercase">
                      {item.serial}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      item.status === 'En Préstamo' ? 'bg-[#fddf33] text-[#726200]' : 'bg-[#c3f400] text-[#161e00]'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#1c1b1b] mt-3">{item.name}</h3>
                  <p className="text-xs font-semibold text-[#737785] mt-0.5">Asignado a: {item.assignedTo}</p>
                  <p className="text-xs font-bold text-[#0056d2] mt-1">Garantía: {item.deposit}</p>
                </div>

                <button 
                  onClick={() => toggleAssignment(item.id)}
                  className={`w-full py-3 rounded-full font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                    item.status === 'En Préstamo'
                      ? 'bg-[#f0eded] text-[#1c1b1b] hover:bg-[#e5e2e1]'
                      : 'bg-[#0056d2] text-white hover:bg-[#0040a1]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{item.status === 'En Préstamo' ? 'REGISTRAR DEVOLUCIÓN' : 'ASIGNAR A CHOFER 🎒'}</span>
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
