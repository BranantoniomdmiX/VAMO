'use client'

import React from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { Package, Plus, Edit } from 'lucide-react'

export default function BaseWarehousePage() {
  const items = [
    { id: 1, name: 'Cascos de Seguridad VAMO', stock: '15 unidades', status: 'In Stock' },
    { id: 2, name: 'Mochilas Térmicas Amarillas', stock: '8 unidades', status: 'Low Stock' },
    { id: 3, name: 'Impermeables Reflejantes', stock: '22 unidades', status: 'In Stock' }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="warehouse" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Control de Almacén e Inventario</h1>
            <p className="text-xs text-[#737785] font-semibold">Equipamiento y herramientas físicas de la base</p>
          </div>

          <button className="bg-[#0056d2] text-white px-5 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Artículo</span>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold bg-[#0056d2]/10 text-[#0056d2] px-2.5 py-0.5 rounded-full uppercase">
                    {item.status}
                  </span>
                  <h3 className="text-base font-extrabold text-[#1c1b1b] mt-2">{item.name}</h3>
                  <p className="text-xs font-semibold text-[#737785] mt-1">{item.stock}</p>
                </div>

                <button className="w-full bg-[#f0eded] hover:bg-[#e5e2e1] text-[#1c1b1b] py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1 transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                  <span>Ajustar Stock</span>
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
