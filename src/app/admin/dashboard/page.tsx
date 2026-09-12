'use client'

import React, { useState, useEffect } from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VamoCard, VamoStatusBadge, VamoButton, VamoPageHeader } from '@/components/ui'
import { formatCurrencyMXN, formatNumberMX } from '@/lib/utils/formatters'

export default function AdminDashboardPage() {
  const [fleetsCount, setFleetsCount] = useState(0)
  const [gmvTotal, setGmvTotal] = useState(0.00)
  const [platformFees, setPlatformFees] = useState(0.00)
  const supabase = createClient()

  useEffect(() => {
    async function loadStats() {
      let count = 0
      try {
        const { data: dbFleets } = await supabase.from('franchises').select('id')
        if (dbFleets) count += dbFleets.length
      } catch (e) {}

      try {
        const localFleets = localStorage.getItem('vamo_fleets')
        if (localFleets) {
          const parsed = JSON.parse(localFleets)
          count = Math.max(count, parsed.length)
        }
      } catch (e) {}

      setFleetsCount(count)
    }

    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="dashboard" />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <VamoPageHeader
            title="Dashboard Maestro Global VAMO"
            description="Monitor en tiempo real de infraestructura, plazas operativas y transacciones SaaS"
            badge={<VamoStatusBadge status="DISPONIBLE" label="Sistemas Operativos 100%" size="sm" />}
            primaryAction={
              <VamoButton 
                variant="accent" 
                size="sm"
                onClick={() => window.location.href = '/admin/new-fleet'}
              >
                + Nueva Plaza
              </VamoButton>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI Card usando VamoCard variant="kpi" */}
            <VamoCard variant="kpi" padding="lg" className="md:col-span-2 space-y-4">
              <span className="text-xs font-extrabold text-[#c3f400] uppercase tracking-wider">VOLUMEN BRUTO PROCESADO (GMV)</span>
              <p className="text-4xl sm:text-6xl font-black text-white">{formatCurrencyMXN(gmvTotal)}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-[#e5e2e1]">
                <ArrowUpRight className="w-4 h-4 text-[#c3f400]" />
                <span>{formatNumberMX(fleetsCount)} {fleetsCount === 1 ? 'plaza activa' : 'plazas activas'} en tiempo real</span>
              </div>
            </VamoCard>

            {/* Tarjeta lateral usando VamoCard standard */}
            <VamoCard variant="standard" padding="md" className="space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#737785] block">Plazas / Socios Comerciales Activos</span>
                <p className="text-3xl font-extrabold text-[#0056d2] mt-1">{formatNumberMX(fleetsCount)} Plazas</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <VamoStatusBadge status="EN_SERVICIO" label="Alta y Control" size="sm" />
                <VamoButton variant="accent" size="sm" onClick={() => window.location.href = '/admin/new-fleet'}>
                  Nueva Plaza
                </VamoButton>
              </div>
            </VamoCard>
          </div>

          {/* Recaudación Global de Comisiones de Plataforma */}
          <VamoCard variant="elevated" padding="lg" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black bg-[#0056d2]/10 text-[#0056d2] px-3 py-1 rounded-pill uppercase">
                  AUDITORÍA RECAUDACIÓN GLOBAL
                </span>
                <h3 className="text-xl font-extrabold text-[#1c1b1b] dark:text-white mt-1">Recaudación de Cuotas de Servidor & Licencias</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-[#0056d2]">{formatCurrencyMXN(platformFees)}</span>
                <div className="mt-0.5">
                  <VamoStatusBadge status="DISPONIBLE" label="Plataforma Master" size="sm" showDot={false} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#fcf9f8] dark:bg-slate-800/60 rounded-card border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-blue-50 text-[#0056d2] flex items-center justify-center font-black">
                  🌐
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 dark:text-slate-100 block">Sincronización Supabase Realtime & Socket VPS</strong>
                  <span className="text-[10px] font-bold text-slate-500">Oracle Cloud Infrastructure (OCI) &bull; Dokploy 163.192.147.231</span>
                </div>
              </div>
              <VamoStatusBadge status="DISPONIBLE" label="ONLINE" size="sm" />
            </div>
          </VamoCard>
        </main>
      </div>
    </div>
  )
}
