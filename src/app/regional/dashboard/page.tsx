'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Globe, MapPin, Activity, ShieldCheck, TrendingUp, AlertTriangle, 
  ArrowRight, CheckCircle2, Building2, Users, Radio, ChevronRight,
  RefreshCw, Scale, Send, Check, X, Layers, Briefcase
} from 'lucide-react'

interface PartnerFleetData {
  id: string
  name: string
  operatorName: string
  city: string
  state: string
  isoScore: number // 0 - 100 (Índice de Salud Operativa)
  icfScore: number // 0 - 100 (Índice de Colaboración de Flotas)
  activeDrivers: number
  activeMerchants: number
  ordersToday: number
  slaCompliancePercent: number
  codHeldTotal: number
  clearingBalance: number // Balance en cámara de compensación
  status: 'OPTIMAL' | 'MODERATE' | 'WARNING' | 'CRITICAL'
  alertsCount: number
}

const REGIONAL_PARTNERS: Record<string, PartnerFleetData[]> = {
  BAJIO: [
    {
      id: 'fleet-celaya-1',
      name: 'Flota Celaya Centro',
      operatorName: 'Lic. Fernando Morales',
      city: 'Celaya',
      state: 'Guanajuato',
      isoScore: 94,
      icfScore: 91,
      activeDrivers: 24,
      activeMerchants: 48,
      ordersToday: 312,
      slaCompliancePercent: 98.2,
      codHeldTotal: 6240.00,
      clearingBalance: +1420.00,
      status: 'OPTIMAL',
      alertsCount: 0
    },
    {
      id: 'fleet-qro-1',
      name: 'Flota Querétaro Poniente',
      operatorName: 'Ing. Mariana Soto',
      city: 'Querétaro',
      state: 'Querétaro',
      isoScore: 88,
      icfScore: 85,
      activeDrivers: 38,
      activeMerchants: 72,
      ordersToday: 540,
      slaCompliancePercent: 95.8,
      codHeldTotal: 11450.00,
      clearingBalance: -850.00,
      status: 'OPTIMAL',
      alertsCount: 1
    },
    {
      id: 'fleet-salamanca-1',
      name: 'Flota Salamanca Industrial',
      operatorName: 'Carlos Ruiz V.',
      city: 'Salamanca',
      state: 'Guanajuato',
      isoScore: 72,
      icfScore: 78,
      activeDrivers: 14,
      activeMerchants: 22,
      ordersToday: 165,
      slaCompliancePercent: 91.4,
      codHeldTotal: 4180.00,
      clearingBalance: +310.00,
      status: 'MODERATE',
      alertsCount: 2
    },
    {
      id: 'fleet-sma-1',
      name: 'Flota San Miguel Colonial',
      operatorName: 'Héctor Balderas',
      city: 'San Miguel de Allende',
      state: 'Guanajuato',
      isoScore: 62,
      icfScore: 68,
      activeDrivers: 10,
      activeMerchants: 18,
      ordersToday: 95,
      slaCompliancePercent: 88.0,
      codHeldTotal: 3100.00,
      clearingBalance: -880.00,
      status: 'WARNING',
      alertsCount: 3
    }
  ],
  CENTRO: [
    {
      id: 'fleet-cdmx-sur',
      name: 'Flota CDMX Sur (Coyoacán & Narvarte)',
      operatorName: 'Rodrigo Albarrán',
      city: 'Ciudad de México',
      state: 'CDMX',
      isoScore: 96,
      icfScore: 94,
      activeDrivers: 65,
      activeMerchants: 140,
      ordersToday: 920,
      slaCompliancePercent: 97.5,
      codHeldTotal: 22400.00,
      clearingBalance: +3450.00,
      status: 'OPTIMAL',
      alertsCount: 0
    },
    {
      id: 'fleet-toluca-1',
      name: 'Flota Toluca Metepec',
      operatorName: 'Elena Mondragón',
      city: 'Toluca',
      state: 'Estado de México',
      isoScore: 82,
      icfScore: 80,
      activeDrivers: 26,
      activeMerchants: 45,
      ordersToday: 310,
      slaCompliancePercent: 92.0,
      codHeldTotal: 5800.00,
      clearingBalance: -450.00,
      status: 'MODERATE',
      alertsCount: 1
    }
  ],
  NORTE: [
    {
      id: 'fleet-mty-sanpedro',
      name: 'Flota Monterrey Valle',
      operatorName: 'Guillermo Garza T.',
      city: 'San Pedro Garza García',
      state: 'Nuevo León',
      isoScore: 95,
      icfScore: 90,
      activeDrivers: 52,
      activeMerchants: 110,
      ordersToday: 780,
      slaCompliancePercent: 98.0,
      codHeldTotal: 18900.00,
      clearingBalance: +2100.00,
      status: 'OPTIMAL',
      alertsCount: 0
    },
    {
      id: 'fleet-saltillo-1',
      name: 'Flota Saltillo Ramos Arizpe',
      operatorName: 'Valeria Cárdenas',
      city: 'Saltillo',
      state: 'Coahuila',
      isoScore: 78,
      icfScore: 82,
      activeDrivers: 20,
      activeMerchants: 38,
      ordersToday: 240,
      slaCompliancePercent: 93.5,
      codHeldTotal: 4900.00,
      clearingBalance: -620.00,
      status: 'MODERATE',
      alertsCount: 2
    }
  ],
  OCCIDENTE: [
    {
      id: 'fleet-gdl-providencia',
      name: 'Flota Guadalajara Chapultepec',
      operatorName: 'Alejandro Orozco',
      city: 'Guadalajara',
      state: 'Jalisco',
      isoScore: 92,
      icfScore: 89,
      activeDrivers: 44,
      activeMerchants: 95,
      ordersToday: 670,
      slaCompliancePercent: 96.2,
      codHeldTotal: 14200.00,
      clearingBalance: +1800.00,
      status: 'OPTIMAL',
      alertsCount: 1
    },
    {
      id: 'fleet-leon-centro',
      name: 'Flota León Campestre',
      operatorName: 'Mauricio Sheffield',
      city: 'León',
      state: 'Guanajuato',
      isoScore: 84,
      icfScore: 86,
      activeDrivers: 28,
      activeMerchants: 52,
      ordersToday: 380,
      slaCompliancePercent: 94.0,
      codHeldTotal: 7300.00,
      clearingBalance: -700.00,
      status: 'MODERATE',
      alertsCount: 1
    }
  ]
}

export default function RegionalSupervisorPage() {
  const [selectedRegion, setSelectedRegion] = useState<'BAJIO' | 'CENTRO' | 'NORTE' | 'OCCIDENTE'>('BAJIO')
  const [showRebalanceModal, setShowRebalanceModal] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertSent, setAlertSent] = useState(false)
  const [rebalanceSuccess, setRebalanceSuccess] = useState(false)

  const currentPartners = REGIONAL_PARTNERS[selectedRegion] || []

  const avgIso = Math.round(currentPartners.reduce((acc, f) => acc + f.isoScore, 0) / (currentPartners.length || 1))
  const avgIcf = Math.round(currentPartners.reduce((acc, f) => acc + f.icfScore, 0) / (currentPartners.length || 1))
  const totalOrders = currentPartners.reduce((acc, f) => acc + f.ordersToday, 0)
  const totalDrivers = currentPartners.reduce((acc, f) => acc + f.activeDrivers, 0)
  const totalMerchants = currentPartners.reduce((acc, f) => acc + f.activeMerchants, 0)

  const getIsoBadge = (score: number) => {
    if (score >= 85) return <span className="bg-[#34a853] text-white text-xs font-black px-2.5 py-1 rounded-full">{score} 🟢 ÓPTIMO</span>
    if (score >= 70) return <span className="bg-[#fddf33] text-[#726200] text-xs font-black px-2.5 py-1 rounded-full">{score} 🟡 MODERADO</span>
    if (score >= 50) return <span className="bg-[#ff9800] text-white text-xs font-black px-2.5 py-1 rounded-full">{score} 🟠 EN RIESGO</span>
    return <span className="bg-[#ba1a1a] text-white text-xs font-black px-2.5 py-1 rounded-full">{score} 🔴 CRÍTICO</span>
  }

  const handleSendAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alertMessage.trim()) return
    setAlertSent(true)
    setTimeout(() => {
      setAlertSent(false)
      setShowAlertModal(false)
      setAlertMessage('')
    }, 2000)
  }

  const handleExecuteRebalance = () => {
    setRebalanceSuccess(true)
    setTimeout(() => {
      setRebalanceSuccess(false)
      setShowRebalanceModal(false)
    }, 2000)
  }

  const regions = [
    { id: 'BAJIO', label: '🌄 Región Bajío', desc: 'Gto & Qro' },
    { id: 'CENTRO', label: '🏙️ Región Centro', desc: 'CDMX & Edomex' },
    { id: 'NORTE', label: '🌵 Región Norte', desc: 'NL & Coahuila' },
    { id: 'OCCIDENTE', label: '🌊 Región Occidente', desc: 'Jalisco & Bajío W' }
  ]

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] font-sans selection:bg-[#0056d2] selection:text-white">
      
      {/* Header Superior Regional */}
      <header className="bg-[#1c1b1b] text-white border-b border-slate-800 px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black shadow-xs">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white leading-tight">Supervisión Regional VAMO</h1>
              <span className="bg-[#0056d2] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">SOCIOS OPERADORES</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold">Consola de Dirección Multi-Plaza &bull; ISO & ICF</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setShowRebalanceModal(true)}
            className="text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Scale className="w-4 h-4 text-[#c3f400]" />
            <span>Balancear Flotas</span>
          </button>

          <button
            onClick={() => setShowAlertModal(true)}
            className="text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4 text-amber-400" />
            <span>Alerta Regional</span>
          </button>

          <Link
            href="/admin/dashboard"
            className="text-xs font-bold text-slate-300 hover:text-white bg-white/5 border border-white/10 px-3 py-2 rounded-full transition-colors"
          >
            ← Superadmin
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Selector de Regiones */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {regions.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id as any)}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedRegion === r.id
                  ? 'bg-white border-[#0056d2] shadow-md ring-2 ring-[#0056d2]/20'
                  : 'bg-white/60 border-[#e5e2e1] hover:bg-white text-slate-600'
              }`}
            >
              <strong className={`text-xs sm:text-sm font-black block ${selectedRegion === r.id ? 'text-[#0056d2]' : 'text-slate-800'}`}>
                {r.label}
              </strong>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">{r.desc}</span>
            </button>
          ))}
        </div>

        {/* Métricas Ejecutivas de la Región Seleccionada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: ISO Regional */}
          <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Salud Operativa (ISO)</span>
              <Activity className="w-4 h-4 text-[#0056d2]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{avgIso}</span>
              <span className="text-xs font-black text-[#34a853]">/ 100 PTS 🟢</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">Salud promedio de las flotas de la zona</p>
          </div>

          {/* Card 2: ICF Colaboración */}
          <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Colaboración Flotas (ICF)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{avgIcf}</span>
              <span className="text-xs font-black text-[#0056d2]">/ 100 PTS 🤝</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">Apoyo mutuo en desbordes y horarios pico</p>
          </div>

          {/* Card 3: Flota Total */}
          <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Motos y Comercios Activos</span>
              <Users className="w-4 h-4 text-[#0056d2]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#0056d2]">{totalDrivers}</span>
              <span className="text-xs font-bold text-slate-500">Motos • {totalMerchants} Locales</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">En {currentPartners.length} flotas territoriales</p>
          </div>

          {/* Card 4: Volumen Diario */}
          <div className="bg-[#0040a1] text-white p-6 rounded-[28px] border border-blue-800 shadow-md space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-blue-200">
              <span>Volumen de Pedidos Hoy</span>
              <Radio className="w-4 h-4 text-[#c3f400] animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#c3f400]">{totalOrders}</span>
              <span className="text-xs font-bold text-blue-200">Servicios</span>
            </div>
            <p className="text-[11px] font-semibold text-blue-200">96.5% Cumplimiento de SLA Regional</p>
          </div>

        </div>

        {/* Tabla de Socios Operadores y Flotas de la Región */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Socios Operadores & Flotas Territoriales
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Supervisión en vivo de rendimiento, cobranza COD y compensaciones cruzadas
              </p>
            </div>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-black border border-slate-200">
              {currentPartners.length} Plazas Conectadas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {currentPartners.map(p => (
              <div 
                key={p.id}
                className="bg-[#fcf9f8] p-5 rounded-2xl border border-[#e5e2e1] hover:border-[#0056d2] transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-base font-black text-slate-900">{p.name}</strong>
                    <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      📍 {p.city}, {p.state}
                    </span>
                    <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      💼 {p.operatorName}
                    </span>
                    {p.alertsCount > 0 && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> {p.alertsCount} Alertas
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-600 pt-0.5">
                    <span>🛵 <strong>{p.activeDrivers}</strong> Motos</span>
                    <span>🏬 <strong>{p.activeMerchants}</strong> Socios Comerciales</span>
                    <span>📦 <strong>{p.ordersToday}</strong> Pedidos Hoy</span>
                    <span>⏱️ SLA: <strong className="text-[#0056d2]">{p.slaCompliancePercent}%</strong></span>
                    <span>💵 COD en Mano: <strong>${p.codHeldTotal.toFixed(2)} MXN</strong></span>
                    <span className={p.clearingBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      ⚖️ Clearing: <strong>{p.clearingBalance >= 0 ? `+$${p.clearingBalance.toFixed(2)}` : `-$${Math.abs(p.clearingBalance).toFixed(2)}`} MXN</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 shrink-0">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">SALUD (ISO)</span>
                    {getIsoBadge(p.isoScore)}
                  </div>

                  <div className="text-left lg:text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">COLABORACIÓN (ICF)</span>
                    <span className="text-xs font-black text-[#0056d2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {p.icfScore} PTS 🤝
                    </span>
                  </div>

                  <Link
                    href={`/admin/control-tower?fleet=${p.id}`}
                    className="bg-[#0056d2] hover:bg-[#0040a1] text-white p-2.5 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                    title="Ver en Torre de Control"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Modal: Balanceo de Flotas y Desborde */}
      {showRebalanceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-[#e5e2e1] animate-fade-in">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#0056d2]" />
                <h3 className="text-base font-black text-slate-900">Balanceo de Desborde Logístico</h3>
              </div>
              <button onClick={() => setShowRebalanceModal(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Activa la asignación cruzada inteligente para permitir que los motociclistas de plazas con baja demanda auxilien temporalmente pedidos limítrofes.
            </p>

            <div className="bg-[#f6f3f2] p-4 rounded-2xl space-y-2 text-xs font-bold text-slate-700">
              <div className="flex justify-between">
                <span>Región activa:</span>
                <strong className="text-[#0056d2]">{selectedRegion}</strong>
              </div>
              <div className="flex justify-between">
                <span>Plazas coordinadas:</span>
                <span>{currentPartners.length} Socios Operadores</span>
              </div>
              <div className="flex justify-between">
                <span>Tarifa de compensación interflota:</span>
                <span className="text-emerald-700">$15.00 MXN / servicio cruzado</span>
              </div>
            </div>

            {rebalanceSuccess ? (
              <div className="bg-emerald-100 text-emerald-800 p-3.5 rounded-2xl text-xs font-black text-center flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>¡Desborde sincronizado en las flotas de la región!</span>
              </div>
            ) : (
              <button
                onClick={handleExecuteRebalance}
                className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-full font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                EJECUTAR REBALANCEO REGIONAL
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal: Alerta Operativa Regional */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-[#e5e2e1] animate-fade-in">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Emitir Alerta Operativa Regional</h3>
              </div>
              <button onClick={() => setShowAlertModal(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Este mensaje llegará de forma instantánea a las consolas de despacho y bases operativas de la <strong>Región {selectedRegion}</strong>.
            </p>

            <form onSubmit={handleSendAlert} className="space-y-3">
              <textarea
                value={alertMessage}
                onChange={e => setAlertMessage(e.target.value)}
                placeholder="Ej. Lluvia fuerte en Zona Poniente. Activar tarifa dinámica de clima y extremar precauciones..."
                rows={3}
                required
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl p-3.5 text-xs font-bold outline-none resize-none"
              />

              {alertSent ? (
                <div className="bg-amber-100 text-amber-900 p-3 rounded-2xl text-xs font-black text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>¡Alerta emitida a todas las bases operativas!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-[#ff5722] hover:bg-[#e64a19] text-white py-3.5 rounded-full font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  ENVIAR ALERTA A BASES DE LA REGIÓN
                </button>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
