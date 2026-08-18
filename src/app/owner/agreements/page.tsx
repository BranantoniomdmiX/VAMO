'use client'

import React, { useState } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { Handshake, Store, Plus, PackageCheck, Briefcase, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function OwnerAgreementsPage() {
  const [agreements, setAgreements] = useState([
    { id: 1, name: 'Taquería El Pastor', type: 'Descuento 10% por volumen', volume: '150+ envíos/mes', status: 'Vigente' },
    { id: 2, name: 'Farmacia del Pueblo', type: 'Tarifa plana $25/envío', volume: '80+ envíos/mes', status: 'Vigente' },
    { id: 3, name: 'Refaccionaria Los Arcos', type: 'Prioridad de Entrega Express', volume: '45+ envíos/mes', status: 'Vigente' }
  ])

  const [assets, setAssets] = useState([
    { id: 'M-101', item: 'Mochila Térmica XL Neón', assignedTo: 'Carlos M.', status: 'EN PRÉSTAMO', deposit: '$500 MXN' },
    { id: 'M-102', item: 'Mochila Térmica XL Neón', assignedTo: 'Roberto M.', status: 'EN PRÉSTAMO', deposit: '$500 MXN' },
    { id: 'C-201', item: 'Canastilla Plástica Reforzada', assignedTo: 'Ana P.', status: 'EN PRÉSTAMO', deposit: '$350 MXN' }
  ])

  const [showModal, setShowModal] = useState(false)
  const [newBizName, setNewBizName] = useState('')
  const [newBizType, setNewBizType] = useState('Tarifa Preferencial B2B')

  const handleAddAgreement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBizName) return
    setAgreements(prev => [
      ...prev,
      { id: Date.now(), name: newBizName, type: newBizType, volume: 'Nuevo Registro', status: 'Vigente' }
    ])
    setNewBizName('')
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="agreements" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Convenios B2B & Control de Equipamiento</h1>
            <p className="text-xs text-[#737785] font-semibold">Gestión de contratos con locales comerciales y préstamo de mochilas/canastos</p>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Convenio B2B</span>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* SECCIÓN 1: CONVENIOS COMERCIALES B2B */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-extrabold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-[#0056d2]" />
                Convenios Comerciales Activos
              </h2>
              <span className="text-xs font-bold text-[#737785]">{agreements.length} Locales Afiliados</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {agreements.map((a) => (
                <div key={a.id} className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-3 hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-base font-extrabold text-[#1c1b1b]">{a.name}</strong>
                      <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full">
                        {a.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#737785]">Acuerdo: {a.type}</p>
                  </div>

                  <span className="text-xs font-bold text-[#0056d2] bg-[#0056d2]/10 px-3 py-1 rounded-full inline-block w-fit">
                    Volumen: {a.volume}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: CONTROL DE MOCHILAS & EQUIPAMIENTO DE LA FLOTA */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-[#0056d2]" />
              Control de Mochilas Térmicas & Equipamiento
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {assets.map((ast) => (
                <div key={ast.id} className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-[#0056d2] bg-[#0056d2]/10 px-2.5 py-0.5 rounded-full">{ast.id}</span>
                    <span className="text-[10px] font-black bg-[#161e00] text-[#c3f400] px-2.5 py-0.5 rounded-full">
                      {ast.status}
                    </span>
                  </div>

                  <div>
                    <strong className="text-base font-extrabold text-[#1c1b1b] block">{ast.item}</strong>
                    <p className="text-xs font-semibold text-[#737785]">Asignado a: <span className="font-bold text-[#1c1b1b]">{ast.assignedTo}</span></p>
                  </div>

                  <div className="pt-2 border-t border-[#f0eded] text-xs font-bold text-[#737785] flex justify-between">
                    <span>Depósito Garantía:</span>
                    <span className="text-[#161e00] font-black">{ast.deposit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      {/* MODAL REGISTRAR NUEVO CONVENIO B2B */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddAgreement} className="bg-white p-6 sm:p-8 rounded-[32px] max-w-md w-full space-y-5 border border-[#e5e2e1] shadow-2xl animate-scale-up">
            <h3 className="text-lg font-extrabold text-[#1c1b1b]">Registrar Nuevo Convenio Comercial</h3>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Nombre del Comercio o Franquicia</label>
              <input 
                type="text"
                required
                placeholder="Ej. Tacos El Paisa"
                value={newBizName}
                onChange={e => setNewBizName(e.target.value)}
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-semibold outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Tipo de Acuerdo B2B</label>
              <select
                value={newBizType}
                onChange={e => setNewBizType(e.target.value)}
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-semibold outline-none"
              >
                <option value="Tarifa Preferencial B2B">Tarifa Preferencial B2B ($25/envío)</option>
                <option value="Descuento 15% por Volumen">Descuento 15% por Volumen (+100 envíos)</option>
                <option value="Prioridad de Despacho Express">Prioridad de Despacho Express</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-[#f0eded] text-[#1c1b1b] py-3 rounded-full font-extrabold text-xs"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 bg-[#0056d2] text-white py-3 rounded-full font-black text-xs shadow-md"
              >
                Guardar Convenio
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
