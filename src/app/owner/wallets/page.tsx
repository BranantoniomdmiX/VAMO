'use client'

import React, { useState, useEffect } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { 
  Wallet, 
  Bike, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Loader2, 
  Search,
  DollarSign,
  SlidersHorizontal
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  VamoPageHeader, 
  VamoCard, 
  VamoStatusBadge, 
  VamoButton, 
  VamoInput, 
  VamoDataView, 
  VamoColumn 
} from '@/components/ui'
import { formatCurrencyMXN, formatNumberMX } from '@/lib/utils/formatters'

interface DriverWalletItem {
  id: string
  driver: string
  balance: number
  limit: number
  tripsToday: number
  status: 'ok' | 'warning' | 'blocked'
}

export default function OwnerWalletsPage() {
  const supabase = createClient()
  const [wallets, setWallets] = useState<DriverWalletItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ok' | 'warning' | 'blocked'>('ALL')

  const [selectedWallet, setSelectedWallet] = useState<DriverWalletItem | null>(null)
  const [newLimitAmount, setNewLimitAmount] = useState<string>('')
  const [topupAmount, setTopupAmount] = useState<string>('')
  const [modalMode, setModalMode] = useState<'limit' | 'topup' | 'settle' | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadDriverWallets() {
      try {
        setIsLoading(true)
        const { data: drivers } = await supabase
          .from('drivers')
          .select('*')

        if (drivers && drivers.length > 0) {
          setWallets(drivers.map(d => ({
            id: d.id,
            driver: d.full_name || 'Conductor VAMO',
            balance: 0.00,
            limit: 1500.00,
            tripsToday: 0,
            status: 'ok'
          })))
        } else {
          setWallets([])
        }
      } catch (err) {
        console.warn('Error al cargar billeteras:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDriverWallets()
  }, [])

  const handleConfirmSettleInBase = () => {
    if (!selectedWallet) return
    const driverId = selectedWallet.id
    setWallets(prev => prev.map(w => {
      if (w.id === driverId) {
        return { ...w, balance: 0, status: 'ok' }
      }
      return w
    }))
    setFeedbackMsg(`¡Efectivo de ${selectedWallet.driver} liquidado en base con éxito! Saldo restablecido a $0.00.`)
    setModalMode(null)
    setSelectedWallet(null)
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWallet || !newLimitAmount) return
    const limitNum = parseFloat(newLimitAmount)
    if (isNaN(limitNum) || limitNum <= 0) return

    setWallets(prev => prev.map(w => {
      if (w.id === selectedWallet.id) {
        const nextStatus = w.balance > limitNum ? 'blocked' : w.balance > limitNum * 0.8 ? 'warning' : 'ok'
        return { ...w, limit: limitNum, status: nextStatus }
      }
      return w
    }))

    setFeedbackMsg(`Límite de caja COD de ${selectedWallet.driver} actualizado a ${formatCurrencyMXN(limitNum)}.`)
    setModalMode(null)
    setSelectedWallet(null)
    setNewLimitAmount('')
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  const handleTopupDriver = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWallet || !topupAmount) return
    const topupNum = parseFloat(topupAmount)
    if (isNaN(topupNum) || topupNum <= 0) return

    setWallets(prev => prev.map(w => {
      if (w.id === selectedWallet.id) {
        return { ...w, balance: Math.max(0, w.balance - topupNum) }
      }
      return w
    }))

    setFeedbackMsg(`Abono de ${formatCurrencyMXN(topupNum)} aplicado a ${selectedWallet.driver}.`)
    setModalMode(null)
    setSelectedWallet(null)
    setTopupAmount('')
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  // Filtrado de billeteras
  const filteredWallets = wallets.filter(w => {
    const matchesSearch = w.driver.toLowerCase().includes(searchFilter.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Definición de columnas para VamoDataView
  const columns: VamoColumn<DriverWalletItem>[] = [
    {
      key: 'driver',
      header: 'Conductor / Motociclista',
      priority: 'high',
      render: (w) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <strong className="font-extrabold text-slate-900 dark:text-slate-100 block">{w.driver}</strong>
            <span className="text-[11px] text-slate-500 font-semibold">{w.tripsToday} viajes hoy</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Estado de Caja',
      priority: 'high',
      render: (w) => (
        w.status === 'blocked' ? (
          <VamoStatusBadge status="CANCELADO" label="Bloqueado COD" size="sm" />
        ) : w.status === 'warning' ? (
          <VamoStatusBadge status="PENDIENTE" label="Cerca del Límite" size="sm" />
        ) : (
          <VamoStatusBadge status="DISPONIBLE" label="Caja Normal" size="sm" />
        )
      )
    },
    {
      key: 'balance',
      header: 'Efectivo en Mano / Límite',
      priority: 'medium',
      render: (w) => {
        const pct = Math.min(100, (w.balance / (w.limit || 1)) * 100)
        return (
          <div className="space-y-1 max-w-[200px]">
            <div className="flex justify-between items-center text-xs">
              <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrencyMXN(w.balance)}</span>
              <span className="text-[10px] text-slate-400 font-semibold">Tope: {formatCurrencyMXN(w.limit)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full ${w.status === 'blocked' ? 'bg-[#BA1A1A]' : w.status === 'warning' ? 'bg-amber-500' : 'bg-[#0056D2]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      }
    },
    {
      key: 'actions',
      header: 'Acciones de Control',
      priority: 'high',
      align: 'right',
      render: (w) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedWallet(w)
              setNewLimitAmount(String(w.limit))
              setModalMode('limit')
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-control text-xs font-bold transition-colors cursor-pointer"
          >
            Límite
          </button>
          <button
            onClick={() => {
              setSelectedWallet(w)
              setTopupAmount('')
              setModalMode('topup')
            }}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0056D2] rounded-control text-xs font-bold transition-colors cursor-pointer"
          >
            Abonar
          </button>
          <VamoButton
            variant="accent"
            size="sm"
            onClick={() => {
              setSelectedWallet(w)
              setModalMode('settle')
            }}
          >
            Liquidar
          </VamoButton>
        </div>
      )
    }
  ]

  // Render para vista móvil de tarjetas
  const renderMobileCard = (w: DriverWalletItem) => {
    const pct = Math.min(100, (w.balance / (w.limit || 1)) * 100)
    return (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-card border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center font-bold">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-sm font-black text-slate-900 dark:text-slate-100 block">{w.driver}</strong>
              <span className="text-xs text-slate-400 font-semibold">{w.tripsToday} viajes hoy</span>
            </div>
          </div>
          {w.status === 'blocked' ? (
            <VamoStatusBadge status="CANCELADO" label="Bloqueado" size="sm" />
          ) : w.status === 'warning' ? (
            <VamoStatusBadge status="PENDIENTE" label="Alerta Límite" size="sm" />
          ) : (
            <VamoStatusBadge status="DISPONIBLE" label="Normal" size="sm" />
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-500">Efectivo en mano</span>
            <strong className="font-black text-slate-900 dark:text-slate-100">{formatCurrencyMXN(w.balance)}</strong>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full ${w.status === 'blocked' ? 'bg-[#BA1A1A]' : w.status === 'warning' ? 'bg-amber-500' : 'bg-[#0056D2]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block text-right">Límite: {formatCurrencyMXN(w.limit)}</span>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              setSelectedWallet(w)
              setNewLimitAmount(String(w.limit))
              setModalMode('limit')
            }}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-control text-xs font-bold"
          >
            Límite
          </button>
          <button
            onClick={() => {
              setSelectedWallet(w)
              setTopupAmount('')
              setModalMode('topup')
            }}
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-[#0056D2] py-2 rounded-control text-xs font-bold"
          >
            Abonar
          </button>
          <VamoButton
            variant="accent"
            size="sm"
            className="flex-1"
            onClick={() => {
              setSelectedWallet(w)
              setModalMode('settle')
            }}
          >
            Liquidar
          </VamoButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="wallets" />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <VamoPageHeader
            title="Billeteras de Motociclistas"
            description="Supervisión de saldos retenidos en efectivo (COD), topes de caja y liquidación en base"
            breadcrumbs={[
              { label: 'Socio Comercial', href: '/owner/dashboard' },
              { label: 'Billeteras' }
            ]}
          />

          {feedbackMsg && (
            <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 p-4 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <VamoInput
                leftIcon={<Search className="w-4 h-4" />}
                placeholder="Buscar por nombre de chofer..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="walletStatusFilter" className="text-xs font-bold text-slate-500 whitespace-nowrap">Estado:</label>
              <select
                id="walletStatusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-control px-3 py-2 outline-hidden"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ok">Caja Normal</option>
                <option value="warning">Cerca del Límite</option>
                <option value="blocked">Bloqueado COD</option>
              </select>
            </div>
          </div>

          {/* Vista de Datos con VamoDataView */}
          <VamoDataView<DriverWalletItem>
            data={filteredWallets}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            renderMobileCard={renderMobileCard}
            emptyMessage="No hay conductores registrados con los filtros seleccionados."
          />
        </main>

        {/* Modal Accesible: Ajustar Límite */}
        {modalMode === 'limit' && selectedWallet && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Ajustar Límite COD
                </h3>
                <p className="text-xs text-slate-500">
                  Establece el tope máximo de efectivo retenido para <strong>{selectedWallet.driver}</strong>.
                </p>
              </div>

              <form onSubmit={handleSaveLimit} className="space-y-4">
                <VamoInput
                  label="Nuevo Límite Máximo ($ MXN)"
                  type="number"
                  placeholder="1500.00"
                  value={newLimitAmount}
                  onChange={(e) => setNewLimitAmount(e.target.value)}
                  required
                />

                <div className="flex gap-2 pt-2">
                  <VamoButton type="submit" variant="primary" className="flex-1">
                    Guardar Límite
                  </VamoButton>
                  <VamoButton type="button" variant="ghost" onClick={() => setModalMode(null)}>
                    Cancelar
                  </VamoButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Accesible: Abonar a Conductor */}
        {modalMode === 'topup' && selectedWallet && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Abonar a Caja
                </h3>
                <p className="text-xs text-slate-500">
                  Registra una entrega parcial de efectivo de <strong>{selectedWallet.driver}</strong>.
                </p>
              </div>

              <form onSubmit={handleTopupDriver} className="space-y-4">
                <VamoInput
                  label="Monto Entregado ($ MXN)"
                  type="number"
                  placeholder="500.00"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  required
                />

                <div className="flex gap-2 pt-2">
                  <VamoButton type="submit" variant="primary" className="flex-1">
                    Aplicar Abono
                  </VamoButton>
                  <VamoButton type="button" variant="ghost" onClick={() => setModalMode(null)}>
                    Cancelar
                  </VamoButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Diálogo Humano de Confirmación de Liquidación Completa en Base */}
        {modalMode === 'settle' && selectedWallet && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-[#C3F400]/20 text-[#161E00] dark:text-[#C3F400] flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  ¿Liquidar caja en base de «{selectedWallet.driver}»?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Se registrará la recepción de <strong>{formatCurrencyMXN(selectedWallet.balance)}</strong> en efectivo en la base operativa. El saldo del chofer se reiniciará a $0.00 MXN y quedará habilitado para recibir nuevos pedidos en efectivo.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <VamoButton
                  variant="accent"
                  className="flex-1"
                  onClick={handleConfirmSettleInBase}
                >
                  Confirmar Liquidación ($0.00)
                </VamoButton>
                <VamoButton
                  variant="ghost"
                  onClick={() => setModalMode(null)}
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
