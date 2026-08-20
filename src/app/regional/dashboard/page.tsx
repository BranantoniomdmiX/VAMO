'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Globe, MapPin, Activity, ShieldCheck, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2, Building2, Users, Radio, ChevronRight } from 'lucide-react'

interface FranchiseHealthData {
  id: string
  name: string
  city: string
  state: string
  isfScore: number // 0 - 100 (Índice de Salud de Franquicia)
  icvScore: number // 0 - 100 (Índice de Colaboración Interfranquicias)
  activeDrivers: number
  activeMerchants: number
  ordersToday: number
  slaCompliancePercent: number
  codHeldTotal: number
  status: 'OPTIMAL' | 'MODERATE' | 'WARNING' | 'CRITICAL'
  alertsCount: number
}

const REGIONAL_FRANCHISES: FranchiseHealthData[] = [
  {
    id: 'frq-celaya-1',
    name: 'Franquicia Celaya Centro',
    city: 'Celaya',
    state: 'Guanajuato',
    isfScore: 94,
    icvScore: 91,
    activeDrivers: 24,
    activeMerchants: 48,
    ordersToday: 312,
    slaCompliancePercent: 98.2,
    codHeldTotal: 6240.00,
    status: 'OPTIMAL',
    alertsCount: 0
  },
  {
    id: 'frq-qro-1',
    name: 'Franquicia Querétaro Poniente',
    city: 'Querétaro',
    state: 'Querétaro',
    isfScore: 88,
    icvScore: 85,
    activeDrivers: 38,
    activeMerchants: 72,
    ordersToday: 540,
    slaCompliancePercent: 95.8,
    codHeldTotal: 11450.00,
    status: 'OPTIMAL',
    alertsCount: 1
  },
  {
    id: 'frq-salamanca-1',
    name: 'Franquicia Salamanca Industrial',
    city: 'Salamanca',
    state: 'Guanajuato',
    isfScore: 72,
    icvScore: 78,
    activeDrivers: 14,
    activeMerchants: 22,
    ordersToday: 165,
    slaCompliancePercent: 91.4,
    codHeldTotal: 4180.00,
    status: 'MODERATE',
    alertsCount: 2
  },
  {
    id: 'frq-sma-1',
    name: 'Franquicia San Miguel Colonial',
    city: 'San Miguel de Allende',
    state: 'Guanajuato',
    isfScore: 58,
    icvScore: 64,
    activeDrivers: 8,
    activeMerchants: 15,
    ordersToday: 89,
    slaCompliancePercent: 86.0,
    codHeldTotal: 2900.00,
    status: 'WARNING',
    alertsCount: 4
  }
]

export default function RegionalSupervisorPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('BAJIO')
  const [franchises, setFranchises] = useState<FranchiseHealthData[]>(REGIONAL_FRANCHISES)

  const avgIsf = Math.round(franchises.reduce((acc, f) => acc + f.isfScore, 0) / franchises.length)
  const avgIcv = Math.round(franchises.reduce((acc, f) => acc + f.icvScore, 0) / franchises.length)
  const totalOrders = franchises.reduce((acc, f) => acc + f.ordersToday, 0)
  const totalDrivers = franchises.reduce((acc, f) => acc + f.activeDrivers, 0)

  const getIsfBadge = (score: number) => {
    if (score >= 85) return <span className="bg-[#34a853] text-white text-xs font-black px-2.5 py-1 rounded-full">{score} 🟢 ÓPTIMA</span>
    if (score >= 70) return <span className="bg-[#fddf33] text-[#726200] text-xs font-black px-2.5 py-1 rounded-full">{score} 🟡 MODERADA</span>
    if (score >= 50) return <span className="bg-[#ff9800] text-white text-xs font-black px-2.5 py-1 rounded-full">{score} 🟠 EN RIESGO</span>
    return <span className="bg-[#ba1a1a] text-white text-xs font-black px-2.5 py-1 rounded-full">{score} 🔴 CRÍTICA</span>
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] font-sans selection:bg-[#0056d2] selection:text-white">
      
      {/* Header Superior Regional */}
      <header className="bg-[#1c1b1b] text-white border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black shadow-xs">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white leading-tight">VAMO Supervisión Regional</h1>
              <span className="bg-[#0056d2] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">PORTAL 6 OFICIAL</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold">Región Bajío (Guanajuato & Querétaro) &bull; Monitoreo ISF & ICV</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="text-xs font-bold text-slate-300 hover:text-white bg-white/10 px-3.5 py-2 rounded-full transition-colors"
          >
            ← Volver a Superadmin
          </Link>
          <Link
            href="/"
            className="text-xs font-black text-[#161e00] bg-[#c3f400] hover:bg-[#abd600] px-4 py-2 rounded-full transition-colors shadow-xs"
          >
            Salir
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Banner de Resumen Ejecutivo Regional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: ISF Regional */}
          <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Índice Salud Franquicias (ISF)</span>
              <Activity className="w-4 h-4 text-[#0056d2]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{avgIsf}</span>
              <span className="text-xs font-black text-[#34a853]">/ 100 PTS 🟢</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">Promedio de salud operativa regional</p>
          </div>

          {/* Card 2: ICV Colaboración */}
          <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Índice Colaboración (ICV)</span>
              <TrendingUp className="w-4 h-4 text-[#c3f400]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{avgIcv}</span>
              <span className="text-xs font-black text-[#0056d2]">/ 100 PTS 🤝</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">Desborde y apoyo mutuo entre flotas</p>
          </div>

          {/* Card 3: Flota Total Activa */}
          <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Flota Total Conectada</span>
              <Users className="w-4 h-4 text-[#0056d2]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#0056d2]">{totalDrivers}</span>
              <span className="text-xs font-bold text-slate-500">Motos activas</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">En 4 franquicias supervisadas</p>
          </div>

          {/* Card 4: Pedidos en Tiempo Real */}
          <div className="bg-[#0040a1] text-white p-6 rounded-[28px] border border-blue-800 shadow-md space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-blue-200">
              <span>Volumen de Pedidos Hoy</span>
              <Radio className="w-4 h-4 text-[#c3f400] animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#c3f400]">{totalOrders}</span>
              <span className="text-xs font-bold text-blue-200">Servicios</span>
            </div>
            <p className="text-[11px] font-semibold text-blue-200">96.8% Cumplimiento de SLA</p>
          </div>

        </div>

        {/* Tabla Detallada de Franquicias Territoriales */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Estado de Franquicias de la Región (Doc 19 §83-84)</h2>
              <p className="text-xs text-slate-500 font-semibold">Semáforo de salud operativa, riesgo y desborde territorial</p>
            </div>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-black border border-slate-200">
              {franchises.length} Ciudades Conectadas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {franchises.map(f => (
              <div 
                key={f.id}
                className="bg-[#fcf9f8] p-5 rounded-2xl border border-[#e5e2e1] hover:border-[#0056d2] transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-base font-black text-slate-900">{f.name}</strong>
                    <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      📍 {f.city}, {f.state}
                    </span>
                    {f.alertsCount > 0 && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> {f.alertsCount} Alertas
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600 pt-1">
                    <span>🛵 <strong>{f.activeDrivers}</strong> Motos</span>
                    <span>🏬 <strong>{f.activeMerchants}</strong> Comercios</span>
                    <span>📦 <strong>{f.ordersToday}</strong> Pedidos</span>
                    <span>⏱️ SLA: <strong className="text-[#0056d2]">{f.slaCompliancePercent}%</strong></span>
                    <span>💵 COD Retenido: <strong>${f.codHeldTotal.toFixed(2)} MXN</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">ÍNDICE DE SALUD (ISF)</span>
                    {getIsfBadge(f.isfScore)}
                  </div>

                  <div className="text-left lg:text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">COLABORACIÓN (ICV)</span>
                    <span className="text-xs font-black text-[#0056d2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {f.icvScore} PTS 🤝
                    </span>
                  </div>

                  <Link
                    href={`/admin/control-tower?franchise=${f.id}`}
                    className="bg-[#0056d2] hover:bg-[#0040a1] text-white p-2.5 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                    title="Supervisar en Torre de Control"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
