'use client'

import React, { useState, useEffect } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { Handshake, Store, Plus, PackageCheck, Briefcase, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AgreementItem {
  id: string
  name: string
  type: string
  volume: string
  status: string
}

interface AssetItem {
  id: string
  item: string
  assignedTo: string
  status: string
  deposit: string
}

export default function OwnerAgreementsPage() {
  const supabase = createClient()
  const [agreements, setAgreements] = useState<AgreementItem[]>([])
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [newBizName, setNewBizName] = useState('')
  const [newBizType, setNewBizType] = useState('Tarifa Preferencial B2B')

  useEffect(() => {
    async function loadAgreementsAndAssets() {
      try {
        setIsLoading(true)
        // Consultar comercios registrados
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id, name, address')

        if (businesses && businesses.length > 0) {
          setAgreements(businesses.map(b => ({
            id: b.id,
            name: b.name,
            type: 'Tarifa Estándar B2B (0% Comisión)',
            volume: 'Activo en Radar',
            status: 'Vigente'
          })))
        } else {
          setAgreements([])
        }

        // Consultar choferes para equipamiento
        const { data: drivers } = await supabase
          .from('drivers')
          .select('id, full_name')

        if (drivers && drivers.length > 0) {
          setAssets(drivers.map((d, i) => ({
            id: `M-${101 + i}`,
            item: 'Mochila Térmica XL Neón',
            assignedTo: d.full_name || 'Conductor',
            status: 'EN PRÉSTAMO',
            deposit: '$500 MXN'
          })))
        } else {
          setAssets([])
        }
      } catch (err) {
        console.warn('Error al cargar convenios:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAgreementsAndAssets()
  }, [])

  const handleAddAgreement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBizName) return
    setAgreements(prev => [
      ...prev,
      { id: String(Date.now()), name: newBizName, type: newBizType, volume: 'Nuevo Registro', status: 'Vigente' }
    ])
    setNewBizName('')
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="agreements" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-xs">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Convenios B2B & Control de Equipamiento</h1>
            <p className="text-xs text-[#737785] font-semibold">Gestión de contratos con locales comerciales y préstamo de mochilas/canastos</p>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
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

            {isLoading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0056d2] mb-2" />
                <span className="text-xs font-bold">Cargando convenios B2B...</span>
              </div>
            ) : agreements.length === 0 ? (
              <div className="bg-white p-8 rounded-[28px] border border-[#e5e2e1] text-center space-y-2">
                <Store className="w-8 h-8 text-slate-300 mx-auto" />
                <strong className="text-sm font-black text-slate-900 block">Sin convenios B2B registrados</strong>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Registra convenios especiales de tarifa plana o prioridad de entrega para comercios de tu plaza.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {agreements.map((a) => (
                  <div key={a.id} className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-3 hover:shadow-md transition-all flex flex-col justify-between">
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
            )}
          </div>

          {/* SECCIÓN 2: CONTROL DE MOCHILAS & EQUIPAMIENTO DE LA FLOTA */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-[#0056d2]" />
              Control de Mochilas Térmicas & Equipamiento
            </h2>

            {assets.length === 0 ? (
              <div className="bg-white p-8 rounded-[28px] border border-[#e5e2e1] text-center space-y-2">
                <PackageCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <strong className="text-sm font-black text-slate-900 block">Sin equipamiento asignado</strong>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Aquí podrás llevar el inventario de mochilas térmicas y canastillas entregadas en comodato a los conductores.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {assets.map((ast) => (
                  <div key={ast.id} className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-3 hover:shadow-md transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-[#0056d2] bg-[#0056d2]/10 px-2.5 py-0.5 rounded-full">{ast.id}</span>
                      <span className="text-[10px] font-black bg-[#161e00] text-[#c3f400] px-2.5 py-0.5 rounded-full">
                        {ast.status}
                      </span>
                    </div>
                    <div>
                      <strong className="text-sm font-extrabold text-[#1c1b1b] block">{ast.item}</strong>
                      <p className="text-xs text-[#737785]">Asignado a: <strong className="text-[#1c1b1b]">{ast.assignedTo}</strong></p>
                    </div>
                    <div className="pt-2 border-t border-[#e5e2e1] flex justify-between items-center text-xs font-bold">
                      <span className="text-[#737785]">Depósito en Garantía:</span>
                      <span className="text-[#161e00] font-black">{ast.deposit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Modal Nuevo Convenio */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-lg font-black text-slate-900">Registrar Convenio B2B</h3>
            
            <form onSubmit={handleAddAgreement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">Nombre del Comercio</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Taquería La Esquina"
                  value={newBizName}
                  onChange={e => setNewBizName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-[#0056d2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">Tipo de Convenio</label>
                <select 
                  value={newBizType}
                  onChange={e => setNewBizType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-[#0056d2]"
                >
                  <option value="Tarifa Preferencial B2B">Tarifa Preferencial B2B ($25/envío)</option>
                  <option value="Descuento 10% por Volumen">Descuento 10% por Volumen</option>
                  <option value="Prioridad Express">Prioridad Express</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-full text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0056d2] text-white py-3 rounded-full text-xs font-black shadow-md cursor-pointer"
                >
                  Guardar Convenio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
