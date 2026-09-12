'use client'

import React, { useState, useEffect } from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { 
  Building2, 
  DollarSign, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  MapPin, 
  Trash2, 
  Key, 
  Search,
  AlertCircle
} from 'lucide-react'
import { 
  VamoPageHeader, 
  VamoDataView, 
  VamoColumn, 
  VamoCard, 
  VamoStatusBadge, 
  VamoButton, 
  VamoInput, 
  VamoEmptyState 
} from '@/components/ui'
import { formatCurrencyMXN, formatNumberMX } from '@/lib/utils/formatters'

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
  const [deleteTarget, setDeleteTarget] = useState<FranchiseEntity | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  // Estado del formulario
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

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    saveFleets(fleets.filter(f => f.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  // Filtrado de flotas
  const filteredFleets = fleets.filter(f => {
    const matchesSearch = 
      f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.owner.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (f.code && f.code.toLowerCase().includes(searchFilter.toLowerCase()))
    
    const matchesType = typeFilter === 'ALL' || f.type === typeFilter
    return matchesSearch && matchesType
  })

  // Definición de columnas para VamoDataView
  const columns: VamoColumn<FranchiseEntity>[] = [
    {
      key: 'name',
      header: 'Plaza / Socio',
      priority: 'high',
      render: (f) => (
        <div className="space-y-0.5">
          <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>{f.name}</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#0056D2]" />
            <span>{f.city}</span>
            <span>&bull;</span>
            <span>{f.owner}</span>
          </div>
          {f.code && (
            <div className="inline-flex items-center gap-1 text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-[#0056D2] dark:text-blue-400 px-2 py-0.5 rounded-sm">
              <Key className="w-3 h-3" />
              <span>{f.code}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'type',
      header: 'Modalidad',
      priority: 'medium',
      render: (f) => (
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
          f.type === 'FRANCHISE_TERRITORIAL'
            ? 'bg-[#161E00] text-[#C3F400] border border-[#C3F400]/40'
            : f.type === 'SAAS_FLEET'
            ? 'bg-blue-50 text-[#0056D2]'
            : f.type === 'MASTER_DIRECT'
            ? 'bg-amber-100 text-amber-900'
            : 'bg-yellow-50 text-[#726200]'
        }`}>
          {f.type === 'FRANCHISE_TERRITORIAL' ? '👑 Socio Comercial' : f.type === 'SAAS_FLEET' ? '🏍️ Renta SaaS' : f.type === 'MASTER_DIRECT' ? '⭐ Matriz Directa' : '🏪 Self-Delivery'}
        </span>
      )
    },
    {
      key: 'financials',
      header: 'Iguala SaaS / Cuota',
      priority: 'medium',
      align: 'right',
      render: (f) => (
        <div className="text-right space-y-0.5">
          <div className="font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrencyMXN(f.totalDue)}
          </div>
          <div className="text-[10px] font-semibold text-slate-400">
            {f.billingCycle} {f.entryFee > 0 ? `| Setup: ${formatCurrencyMXN(f.entryFee)}` : ''}
          </div>
        </div>
      )
    },
    {
      key: 'paymentStatus',
      header: 'Estatus Cobro',
      priority: 'high',
      render: (f) => (
        <div className="flex items-center gap-1.5">
          {f.paymentStatus === 'PAGADO' ? (
            <VamoStatusBadge status="DISPONIBLE" label="Al Día" size="sm" />
          ) : (
            <VamoStatusBadge status="PENDIENTE" label="Cobro Pendiente" size="sm" />
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      priority: 'high',
      align: 'right',
      render: (f) => (
        <div className="flex items-center justify-end gap-1.5">
          {f.paymentStatus === 'PENDIENTE' && (
            <VamoButton
              variant="primary"
              size="sm"
              onClick={() => handleMarkAsPaid(f.id)}
            >
              Registrar Cobro
            </VamoButton>
          )}
          {f.type !== 'MASTER_DIRECT' && (
            <button
              onClick={() => setDeleteTarget(f)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-control transition-colors cursor-pointer"
              title="Eliminar socio comercial"
              aria-label={`Eliminar ${f.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ]

  // Render para vista móvil personalizada
  const renderMobileCard = (f: FranchiseEntity) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-card border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{f.name}</h3>
          <p className="text-xs text-slate-500 font-semibold">{f.city} &bull; {f.owner}</p>
        </div>
        {f.paymentStatus === 'PAGADO' ? (
          <VamoStatusBadge status="DISPONIBLE" label="Al Día" size="sm" />
        ) : (
          <VamoStatusBadge status="PENDIENTE" label="Pendiente" size="sm" />
        )}
      </div>

      {f.code && (
        <div className="text-xs font-mono bg-blue-50 text-[#0056D2] px-2.5 py-1 rounded-control flex items-center justify-between">
          <span className="text-[10px] font-black uppercase">Código:</span>
          <strong>{f.code}</strong>
        </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">Iguala SaaS</span>
          <strong className="text-slate-900 dark:text-slate-100 font-extrabold">{formatCurrencyMXN(f.totalDue)}</strong>
        </div>

        <div className="flex items-center gap-2">
          {f.paymentStatus === 'PENDIENTE' && (
            <VamoButton variant="primary" size="sm" onClick={() => handleMarkAsPaid(f.id)}>
              Registrar Cobro
            </VamoButton>
          )}
          {f.type !== 'MASTER_DIRECT' && (
            <button
              onClick={() => setDeleteTarget(f)}
              className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
              aria-label={`Eliminar ${f.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="fleets" />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <VamoPageHeader
            title="Gestor de Socios Comerciales & Plazas"
            description="Expansión territorial: Administra plazas autorizadas, códigos de vinculación y cobranza SaaS"
            breadcrumbs={[
              { label: 'Superadmin', href: '/admin/dashboard' },
              { label: 'Socios Comerciales' }
            ]}
            primaryAction={
              <VamoButton
                variant="primary"
                size="sm"
                onClick={() => setIsCreatingFranchise(true)}
              >
                + Alta de Socio Comercial
              </VamoButton>
            }
          />

          {/* Banner de Multiplicador de Escala Financiera */}
          <div className="bg-[#161e00] text-white p-6 sm:p-8 rounded-[32px] border border-[#c3f400]/40 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>EXPANSIÓN TERRITORIAL REAL</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">Red de {formatNumberMX(fleets.length)} Plazas Registradas</h2>
              <p className="text-xs text-slate-300">
                Cada plaza cuenta con su código de afiliación único para vincular motociclistas y comercios locales.
              </p>
            </div>

            <div className="flex gap-3 text-center flex-wrap">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-300 block">Setup Recaudado</span>
                <strong className="text-lg font-black text-[#c3f400]">
                  {formatCurrencyMXN(fleets.reduce((acc, f) => acc + f.entryFee, 0))}
                </strong>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-300 block">SaaS Recurrente</span>
                <strong className="text-lg font-black text-[#c3f400]">
                  {formatCurrencyMXN(fleets.reduce((acc, f) => acc + f.monthlySaaS, 0))} / mes
                </strong>
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <VamoInput
                leftIcon={<Search className="w-4 h-4" />}
                placeholder="Buscar por plaza, socio, ciudad o código..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="fleetTypeFilter" className="text-xs font-bold text-slate-500 whitespace-nowrap">Modalidad:</label>
              <select
                id="fleetTypeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-control px-3 py-2 outline-hidden"
              >
                <option value="ALL">Todas las modalidades</option>
                <option value="FRANCHISE_TERRITORIAL">Socio Comercial Territorial</option>
                <option value="SAAS_FLEET">Renta SaaS Flota</option>
                <option value="SELF_DELIVERY">Self-Delivery Cadenas</option>
                <option value="MASTER_DIRECT">Matriz Directa</option>
              </select>
            </div>
          </div>

          {/* Vista de Datos con VamoDataView */}
          <VamoDataView<FranchiseEntity>
            data={filteredFleets}
            columns={columns}
            keyExtractor={(item) => String(item.id)}
            renderMobileCard={renderMobileCard}
            emptyMessage="No se encontraron socios comerciales con los criterios de búsqueda actuales."
          />
        </main>

        {/* Modal Accesible de Alta de Nuevo Socio Comercial */}
        {isCreatingFranchise && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Dar de Alta Nueva Plaza / Socio Comercial
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  Registra los datos territoriales y comerciales para generar el código de afiliación.
                </p>
              </div>

              <form onSubmit={handleCreateFranchise} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="newFranchiseTypeSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Modalidad de Comercialización
                  </label>
                  <select
                    id="newFranchiseTypeSelect"
                    value={newFranchiseType}
                    onChange={(e) => setNewFranchiseType(e.target.value as FranchiseEntity['type'])}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-control px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden"
                  >
                    <option value="FRANCHISE_TERRITORIAL">Modalidad A: Socio Comercial Territorial Exclusivo ($85,000 setup)</option>
                    <option value="SAAS_FLEET">Modalidad B: Renta SaaS Flota Externa ($200/moto)</option>
                    <option value="SELF_DELIVERY">Modalidad C: Módulo Self-Delivery para Cadenas ($650/mes)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <VamoInput
                    label="Ciudad o Plaza"
                    placeholder="Ej. Querétaro"
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    required
                  />
                  <VamoInput
                    label="Nombre del Socio Titular"
                    placeholder="Ej. Roberto Méndez"
                    value={newFranchiseeName}
                    onChange={(e) => setNewFranchiseeName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <VamoInput
                    label="Canon Inicial ($ MXN)"
                    type="number"
                    value={newEntryFee}
                    onChange={(e) => setNewEntryFee(parseFloat(e.target.value) || 0)}
                  />
                  <VamoInput
                    label="Iguala SaaS/Mes ($ MXN)"
                    type="number"
                    value={newMonthlySaaS}
                    onChange={(e) => setNewMonthlySaaS(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <VamoButton
                    type="submit"
                    variant="primary"
                    className="flex-1"
                  >
                    Crear y Activar Socio Comercial
                  </VamoButton>
                  <VamoButton
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreatingFranchise(false)}
                  >
                    Cancelar
                  </VamoButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Diálogo Humano de Confirmación de Acción Destructiva */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200 dark:border-rose-900 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#BA1A1A] flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  ¿Eliminar socio comercial «{deleteTarget.name}»?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Esta acción desvinculará permanentemente el registro local de la plaza en {deleteTarget.city} y su código de acceso {deleteTarget.code}. Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <VamoButton
                  variant="danger"
                  className="flex-1"
                  onClick={handleConfirmDelete}
                >
                  Sí, eliminar plaza
                </VamoButton>
                <VamoButton
                  variant="ghost"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancelar
                </VamoButton>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
