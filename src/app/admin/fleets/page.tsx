'use client'

import React, { useState, useEffect } from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { 
  Building2, 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  MapPin, 
  Trash2, 
  Key, 
  ArrowRight,
  Store
} from 'lucide-react'
import Link from 'next/link'

export interface FranchiseEntity {
  id: number
  code?: string
  type: 'FRANCHISE_TERRITORIAL' | 'SAAS_FLEET' | 'SELF_DELIVERY' | 'MASTER_DIRECT'
  name: string
  owner: string
  city: string
  email?: string
  riders: number
  planName: string
  entryFee: number
  monthlySaaS: number
  royaltyPerTrip: number
  billingCycle: 'MENSUAL' | 'SEMANAL'
  totalDue: number
  paymentStatus: 'PAGADO' | 'PENDIENTE'
  status: 'active'
  createdAt?: string
}

export default function AdminFleetsPage() {
  const [fleets, setFleets] = useState<FranchiseEntity[]>([])
  const [isCreatingFranchise, setIsCreatingFranchise] = useState(false)
  const [newCityName, setNewCityName] = useState('')
  const [newFranchiseeName, setNewFranchiseeName] = useState('')
  const [newFranchiseType, setNewFranchiseType] = useState<FranchiseEntity['type']>('FRANCHISE_TERRITORIAL')
  const [newEntryFee, setNewEntryFee] = useState(85000)
  const [newMonthlySaaS, setNewMonthlySaaS] = useState(4000)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_fleets')
      if (stored) {
        setFleets(JSON.parse(stored))
      } else {
        // Inicializar con la Flota Central Directa de Branmix
        const masterDirectFleet: FranchiseEntity = {
          id: 1,
          code: 'VAMO-MASTER-CENTRAL',
          type: 'MASTER_DIRECT',
          name: '👑 Flota Titular Central VAMO (Branmix)',
          owner: 'Branmix (Superadmin Master)',
          city: 'Operación Matriz Central',
          riders: 12,
          planName: 'Operación Directa Matriz (100% Utilidad Central)',
          entryFee: 0,
          monthlySaaS: 0,
          royaltyPerTrip: 0,
          billingCycle: 'MENSUAL',
          totalDue: 0,
          paymentStatus: 'PAGADO',
          status: 'active',
          createdAt: new Date().toISOString()
        }
        setFleets([masterDirectFleet])
        localStorage.setItem('vamo_fleets', JSON.stringify([masterDirectFleet]))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const saveFleets = (updated: FranchiseEntity[]) => {
    setFleets(updated)
    try {
      localStorage.setItem('vamo_fleets', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateFranchise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCityName || !newFranchiseeName) return

    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const fleetCode = `VAMO-${newCityName.substring(0, 3).toUpperCase()}-${randomDigits}`

    const newFranchise: FranchiseEntity = {
      id: Date.now(),
      code: fleetCode,
      type: newFranchiseType,
      name: newFranchiseType === 'FRANCHISE_TERRITORIAL' ? `Plaza VAMO ${newCityName}` : `${newCityName} Logística`,
      owner: newFranchiseeName,
      city: newCityName,
      riders: 0,
      planName: newFranchiseType === 'FRANCHISE_TERRITORIAL' 
        ? 'Modalidad A: Socio Comercial Territorial Exclusivo'
        : newFranchiseType === 'SAAS_FLEET'
        ? 'Modalidad B: Renta SaaS Flota Externa'
        : 'Modalidad C: Módulo Self-Delivery',
      entryFee: newFranchiseType === 'FRANCHISE_TERRITORIAL' ? newEntryFee : 0,
      monthlySaaS: newMonthlySaaS,
      royaltyPerTrip: newFranchiseType === 'FRANCHISE_TERRITORIAL' ? 2.50 : 0,
      billingCycle: 'MENSUAL',
      totalDue: newMonthlySaaS,
      paymentStatus: 'PAGADO',
      status: 'active',
      createdAt: new Date().toISOString()
    }

    saveFleets([newFranchise, ...fleets])
    setIsCreatingFranchise(false)
    setNewCityName('')
    setNewFranchiseeName('')
  }

  const handleMarkAsPaid = (fleetId: number) => {
    saveFleets(fleets.map(f => f.id === fleetId ? { ...f, paymentStatus: 'PAGADO' } : f))
  }

  const handleDeleteFleet = (fleetId: number) => {
    if (confirm('¿Deseas eliminar este registro de prueba de Socio Comercial?')) {
      saveFleets(fleets.filter(f => f.id !== fleetId))
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="fleets" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Gestor de Socios Comerciales & Plazas</h1>
            <p className="text-xs text-[#737785] font-semibold">Expansión territorial: Administra plazas, genera códigos y verifica cobros SaaS</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingFranchise(true)}
              className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-2.5 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ ALTA DE SOCIO COMERCIAL / PLAZA</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Banner de Multiplicador de Escala Financiera */}
          <div className="bg-[#161e00] text-white p-6 sm:p-8 rounded-[32px] border border-[#c3f400]/40 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>EXPANSIÓN TERRITORIAL REAL</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">Red de {fleets.length} Socios Comerciales Registrados</h2>
              <p className="text-xs text-slate-300">
                Cada plaza cuenta con su código de afiliación único para vincular motociclistas y comercios locales.
              </p>
            </div>

            <div className="flex gap-3 text-center">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-300 block">Setup Recaudado</span>
                <strong className="text-lg font-black text-[#c3f400]">
                  ${fleets.reduce((acc, f) => acc + f.entryFee, 0).toLocaleString()} MXN
                </strong>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-300 block">SaaS Recurrente</span>
                <strong className="text-lg font-black text-[#c3f400]">
                  ${fleets.reduce((acc, f) => acc + f.monthlySaaS, 0).toLocaleString()} / mes
                </strong>
              </div>
            </div>
          </div>

          {/* Listado de Socios Comerciales y Plazas */}
          {fleets.length === 0 ? (
            <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-[#e5e2e1] text-center space-y-4 shadow-sm max-w-xl mx-auto my-8">
              <div className="w-16 h-16 bg-blue-50 text-[#0056d2] rounded-3xl flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">No hay Socios Comerciales dados de alta todavía</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Crea tu primera plaza territorial o socio comercial para probar el flujo de vinculación de choferes y locales desde cero.
                </p>
              </div>
              <button
                onClick={() => setIsCreatingFranchise(true)}
                className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-6 py-3.5 rounded-full font-black text-xs shadow-md active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ CREAR PRIMER SOCIO COMERCIAL</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {fleets.map(f => (
                <div key={f.id} className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-5 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        f.type === 'FRANCHISE_TERRITORIAL'
                          ? 'bg-[#161e00] text-[#c3f400] border border-[#c3f400]/40'
                          : f.type === 'SAAS_FLEET'
                          ? 'bg-[#0056d2]/10 text-[#0056d2]'
                          : 'bg-[#726200]/10 text-[#726200]'
                      }`}>
                        {f.type === 'FRANCHISE_TERRITORIAL' ? '👑 SOCIO COMERCIAL' : f.type === 'SAAS_FLEET' ? '🏍️ RENTA FLOTA' : '🏪 SELF-DELIVERY'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          f.paymentStatus === 'PAGADO' ? 'bg-[#c3f400] text-[#161e00]' : 'bg-[#ffdad6] text-[#ba1a1a]'
                        }`}>
                          {f.paymentStatus}
                        </span>
                        <button
                          onClick={() => handleDeleteFleet(f.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <strong className="text-base font-extrabold text-[#1c1b1b] block">{f.name}</strong>

                    <div className="space-y-1.5 text-xs font-semibold text-[#737785]">
                      <p className="text-[#1c1b1b] font-bold">👤 {f.owner}</p>
                      <p className="flex items-center gap-1 font-bold text-[#1c1b1b]">
                        <MapPin className="w-3.5 h-3.5 text-[#0056d2]" /> {f.city}
                      </p>
                      <p className="text-[#0056d2] font-black">Plan: {f.planName}</p>

                      {f.code && (
                        <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl flex items-center justify-between">
                          <span className="text-[10px] font-black text-blue-800 uppercase flex items-center gap-1">
                            <Key className="w-3 h-3" /> CÓDIGO DE ALTA:
                          </span>
                          <strong className="font-mono text-xs font-black text-[#0056d2]">{f.code}</strong>
                        </div>
                      )}
                      
                      {f.entryFee > 0 && (
                        <p className="text-[#161e00] font-black bg-[#c3f400]/20 px-2.5 py-1.5 rounded-xl border border-[#c3f400]">
                          💰 Canon Inicial: ${f.entryFee.toLocaleString()} MXN
                        </p>
                      )}
                    </div>

                    <div className="bg-[#f6f3f2] p-4 rounded-2xl space-y-1 border border-[#e5e2e1]">
                      <span className="text-[10px] font-black text-[#737785] uppercase tracking-wider block">IGUALA SAAS RECURRENTE:</span>
                      <p className="text-2xl font-black text-[#0056d2]">${f.totalDue.toLocaleString()} MXN / {f.billingCycle}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#f0eded]">
                    {f.paymentStatus === 'PENDIENTE' ? (
                      <button 
                        onClick={() => handleMarkAsPaid(f.id)}
                        className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>REGISTRAR IGUALA RECIBIDA</span>
                      </button>
                    ) : (
                      <div className="bg-[#c3f400] text-[#161e00] py-2.5 rounded-full text-center font-black text-xs flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>AL DÍA &bull; PAGO RECIBIDO</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>

        {/* Modal de Alta de Nuevo Socio Comercial / Plaza */}
        {isCreatingFranchise && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in border border-[#e5e2e1]">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-[#1c1b1b]">Dar de Alta Nueva Plaza / Socio Comercial</h3>
                <p className="text-xs font-semibold text-[#737785]">Expansión territorial del ecosistema VAMO</p>
              </div>

              <form onSubmit={handleCreateFranchise} className="space-y-4 text-xs font-bold">
                <div>
                  <label className="text-[#737785] block mb-1">Modalidad de Comercialización</label>
                  <select
                    value={newFranchiseType}
                    onChange={(e) => setNewFranchiseType(e.target.value as any)}
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 outline-none font-bold text-xs cursor-pointer"
                  >
                    <option value="FRANCHISE_TERRITORIAL">Modalidad A: Socio Comercial Territorial Exclusivo ($85,000 setup)</option>
                    <option value="SAAS_FLEET">Modalidad B: Renta SaaS Flota Externa ($200/moto)</option>
                    <option value="SELF_DELIVERY">Modalidad C: Módulo Self-Delivery para Cadenas ($650/mes)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#737785] block mb-1">Ciudad o Plaza</label>
                    <input
                      type="text"
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                      placeholder="Ej. Querétaro"
                      required
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#737785] block mb-1">Nombre del Socio Titular</label>
                    <input
                      type="text"
                      value={newFranchiseeName}
                      onChange={(e) => setNewFranchiseeName(e.target.value)}
                      placeholder="Ej. Roberto Méndez"
                      required
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#737785] block mb-1">Canon Inicial ($)</label>
                    <input
                      type="number"
                      value={newEntryFee}
                      onChange={(e) => setNewEntryFee(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#737785] block mb-1">Iguala SaaS/Mes ($)</label>
                    <input
                      type="number"
                      value={newMonthlySaaS}
                      onChange={(e) => setNewMonthlySaaS(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-[#0056d2] text-white py-3.5 rounded-full font-black text-xs shadow-md active:scale-95 cursor-pointer"
                  >
                    CREAR Y ACTIVAR SOCIO COMERCIAL
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingFranchise(false)}
                    className="px-5 bg-[#f0eded] text-[#1c1b1b] py-3.5 rounded-full font-bold text-xs cursor-pointer"
                  >
                    CANCELAR
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
