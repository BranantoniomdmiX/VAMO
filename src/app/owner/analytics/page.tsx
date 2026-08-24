'use client'

import React, { useState } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { 
  TrendingUp, Clock, Bike, Store, DollarSign, 
  ArrowUpRight, Download, Calendar, Filter, Star, 
  CheckCircle2, AlertTriangle, ShieldCheck, Flame, Zap
} from 'lucide-react'

type TimeRange = 'today' | 'week' | 'month' | 'year'

interface DriverPerformance {
  id: string
  name: string
  vehicle: string
  trips: number
  avgDeliveryMin: number
  rating: number
  totalRevenue: number
  tier: 'DIAMANTE' | 'PLATINO' | 'ORO' | 'PLATA'
  status: 'ACTIVO' | 'EN_RUTA' | 'PAUSA'
}

export default function OwnerAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [isExporting, setIsExporting] = useState(false)

  // Datos reactivos según el rango temporal
  const statsByRange = {
    today: {
      totalTrips: 184,
      avgDeliveryMin: 13.8,
      slaCompliance: 98.9,
      grossRevenue: 13620.00,
      netFleetEarnings: 3260.00,
      activeDriversCount: 22,
      activeMerchantsCount: 46
    },
    week: {
      totalTrips: 1240,
      avgDeliveryMin: 14.5,
      slaCompliance: 98.2,
      grossRevenue: 92450.00,
      netFleetEarnings: 21800.00,
      activeDriversCount: 24,
      activeMerchantsCount: 52
    },
    month: {
      totalTrips: 5420,
      avgDeliveryMin: 14.8,
      slaCompliance: 98.4,
      grossRevenue: 398600.00,
      netFleetEarnings: 84250.00,
      activeDriversCount: 24,
      activeMerchantsCount: 58
    },
    year: {
      totalTrips: 42800,
      avgDeliveryMin: 15.2,
      slaCompliance: 97.9,
      grossRevenue: 3120000.00,
      netFleetEarnings: 680000.00,
      activeDriversCount: 28,
      activeMerchantsCount: 64
    }
  }

  const currentStats = statsByRange[timeRange]

  const hourlyDemand = [
    { hour: '08:00', orders: 18, isPeak: false },
    { hour: '09:00', orders: 24, isPeak: false },
    { hour: '10:00', orders: 35, isPeak: false },
    { hour: '11:00', orders: 48, isPeak: false },
    { hour: '12:00', orders: 72, isPeak: false },
    { hour: '13:00', orders: 120, isPeak: true },
    { hour: '14:00', orders: 145, isPeak: true },
    { hour: '15:00', orders: 110, isPeak: true },
    { hour: '16:00', orders: 55, isPeak: false },
    { hour: '17:00', orders: 40, isPeak: false },
    { hour: '18:00', orders: 65, isPeak: false },
    { hour: '19:00', orders: 115, isPeak: true },
    { hour: '20:00', orders: 138, isPeak: true },
    { hour: '21:00', orders: 95, isPeak: true },
    { hour: '22:00', orders: 42, isPeak: false }
  ]

  const categoryBreakdown = [
    { name: 'Restaurantes & Alimentos', percent: 62, orders: Math.round(currentStats.totalTrips * 0.62), color: 'bg-[#0056d2]' },
    { name: 'Farmacias & Salud', percent: 16, orders: Math.round(currentStats.totalTrips * 0.16), color: 'bg-emerald-500' },
    { name: 'Diligencias & Paquetería', percent: 14, orders: Math.round(currentStats.totalTrips * 0.14), color: 'bg-[#ff5722]' },
    { name: 'Ferreterías & Mostrador', percent: 8, orders: Math.round(currentStats.totalTrips * 0.08), color: 'bg-slate-700' }
  ]

  const topDrivers: DriverPerformance[] = [
    {
      id: 'd-1',
      name: 'Carlos Mendoza',
      vehicle: 'Italika FT150 (GTO-842-X)',
      trips: 342,
      avgDeliveryMin: 12.4,
      rating: 4.9,
      totalRevenue: 24800.00,
      tier: 'DIAMANTE',
      status: 'EN_RUTA'
    },
    {
      id: 'd-2',
      name: 'Jorge Antonio Alva',
      vehicle: 'Honda Cargo 150 (GTO-192-A)',
      trips: 310,
      avgDeliveryMin: 13.1,
      rating: 4.9,
      totalRevenue: 22400.00,
      tier: 'PLATINO',
      status: 'ACTIVO'
    },
    {
      id: 'd-3',
      name: 'Miguel Ángel R.',
      vehicle: 'Yamaha YBR 125 (GTO-551-M)',
      trips: 285,
      avgDeliveryMin: 14.0,
      rating: 4.8,
      totalRevenue: 20100.00,
      tier: 'PLATINO',
      status: 'ACTIVO'
    },
    {
      id: 'd-4',
      name: 'Roberto Gómez H.',
      vehicle: 'Vento Ryder 150 (GTO-332-P)',
      trips: 240,
      avgDeliveryMin: 15.2,
      rating: 4.7,
      totalRevenue: 17800.00,
      tier: 'ORO',
      status: 'PAUSA'
    },
    {
      id: 'd-5',
      name: 'Daniela Morales',
      vehicle: 'Italika DT150 (GTO-774-K)',
      trips: 215,
      avgDeliveryMin: 14.8,
      rating: 4.8,
      totalRevenue: 15900.00,
      tier: 'ORO',
      status: 'ACTIVO'
    }
  ]

  const handleExportCSV = () => {
    setIsExporting(true)

    const csvContent = [
      ['Reporte de Rendimiento de Flota - VAMO Socio Operador'],
      [`Periodo: ${timeRange.toUpperCase()}`, `Fecha de emision: ${new Date().toLocaleDateString('es-MX')}`],
      [''],
      ['ID', 'Nombre Conductor', 'Vehiculo', 'Viajes', 'Tiempo Promedio (Min)', 'Rating', 'Ingresos Generados (MXN)', 'Nivel Tier', 'Estatus'],
      ...topDrivers.map(d => [
        d.id,
        d.name,
        d.vehicle,
        d.trips.toString(),
        d.avgDeliveryMin.toString(),
        d.rating.toString(),
        d.totalRevenue.toFixed(2),
        d.tier,
        d.status
      ])
    ].map(e => e.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `vamo_analytics_${timeRange}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => setIsExporting(false), 800)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="analytics" />

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Superior */}
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs sticky top-0 z-30">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
              Analytics & Rendimiento de Flota
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Métricas de velocidad, SLA, horarios pico y rentabilidad por motociclista
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtros Temporales */}
            <div className="flex bg-[#f6f3f2] p-1 rounded-2xl border border-[#e5e2e1] text-xs font-black">
              {(['today', 'week', 'month', 'year'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    timeRange === range
                      ? 'bg-[#0056d2] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {range === 'today' && 'Hoy'}
                  {range === 'week' && 'Esta Semana'}
                  {range === 'month' && 'Este Mes'}
                  {range === 'year' && '2026'}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-4 py-2 rounded-full text-xs font-black shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exportando...' : 'Exportar CSV'}</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Bento Grid: 4 KPIs Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Tiempo Promedio de Entrega */}
            <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Tiempo Promedio Entrega</span>
                <Clock className="w-4 h-4 text-[#0056d2]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{currentStats.avgDeliveryMin}</span>
                <span className="text-xs font-black text-emerald-700">Minutos ⚡</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">SLA objetivo: &lt; 20 min en ciudad</p>
            </div>

            {/* Card 2: Tasa de Cumplimiento */}
            <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Cumplimiento de SLA</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{currentStats.slaCompliance}%</span>
                <span className="text-xs font-black text-emerald-700">Entregados OK</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">0.4% Cancelaciones / Incidencias</p>
            </div>

            {/* Card 3: Viajes Totales */}
            <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Volumen de Viajes</span>
                <Bike className="w-4 h-4 text-[#0056d2]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#0056d2]">{currentStats.totalTrips.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-500">Servicios</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">{currentStats.activeDriversCount} Motos &bull; {currentStats.activeMerchantsCount} Locales</p>
            </div>

            {/* Card 4: Utilidad Neta Flota */}
            <div className="bg-[#0040a1] text-white p-6 rounded-[28px] border border-blue-800 shadow-md space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-blue-200">
                <span>Ganancia Neta Socio Operador</span>
                <DollarSign className="w-4 h-4 text-[#c3f400]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#c3f400]">
                  ${currentStats.netFleetEarnings.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-blue-200">Facturación Bruta: ${currentStats.grossRevenue.toLocaleString('es-MX')}</p>
            </div>

          </div>

          {/* Gráfico de Distribución Horaria & Desglose por Categoría */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Curva de Demanda Horaria (2 columnas) */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">Curva de Demanda por Franja Horaria</h2>
                  <p className="text-xs text-slate-500 font-semibold">Identifica las horas pico para activar bonos y tarifas dinámicas</p>
                </div>
                <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" /> Picos: 13:00 - 15:00 & 19:00 - 21:00
                </span>
              </div>

              {/* Visualizador de Barras de Demanda */}
              <div className="pt-6 pb-2">
                <div className="grid grid-cols-15 gap-1.5 sm:gap-2 h-44 items-end">
                  {hourlyDemand.map((item) => {
                    const heightPercent = Math.round((item.orders / 145) * 100)
                    return (
                      <div key={item.hour} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                        <div className="text-[9px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.orders}
                        </div>
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xl transition-all duration-300 ${
                            item.isPeak 
                              ? 'bg-[#ff5722] group-hover:bg-[#e64a19]' 
                              : 'bg-blue-100 group-hover:bg-[#0056d2]'
                          }`}
                        />
                        <span className="text-[9px] font-bold text-slate-400 truncate rotate-45 sm:rotate-0 mt-1">
                          {item.hour.split(':')[0]}h
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Desglose por Giro / Vertical (1 columna) */}
            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900">Mix por Giro Comercial</h2>
                <p className="text-xs text-slate-500 font-semibold">Distribución de servicios entregados</p>
              </div>

              <div className="space-y-3.5">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-800">{cat.name}</span>
                      <span className="text-[#0056d2]">{cat.percent}% ({cat.orders} viajes)</span>
                    </div>
                    <div className="w-full bg-[#f0eded] h-2.5 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${cat.percent}%` }}
                        className={`h-full rounded-full ${cat.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#f6f3f2] p-3.5 rounded-2xl text-[11px] font-bold text-slate-600 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0056d2] shrink-0" />
                <span>Los restaurantes generan el mayor volumen diario, y las farmacias el ticket más rápido (&lt;11 min).</span>
              </div>
            </div>

          </div>

          {/* Tabla de Rendimiento por Motociclista */}
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Leaderboard de Motociclistas</h2>
                <p className="text-xs text-slate-500 font-semibold">Rendimiento, velocidad promedio y calificación de los conductores de la flota</p>
              </div>
              <span className="text-xs font-black text-[#0056d2] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Top 5 Socios VAMO
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#f0eded] text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Conductor & Vehículo</th>
                    <th className="pb-3 text-center">Viajes Completados</th>
                    <th className="pb-3 text-center">Velocidad Promedio</th>
                    <th className="pb-3 text-center">Calificación</th>
                    <th className="pb-3 text-right">Facturación Generada</th>
                    <th className="pb-3 text-center">Nivel Tier</th>
                    <th className="pb-3 text-right">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0eded] font-bold">
                  {topDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-[#fcf9f8] transition-colors">
                      <td className="py-3.5">
                        <strong className="text-sm font-black text-slate-900 block">{driver.name}</strong>
                        <span className="text-[11px] text-slate-400 font-semibold">{driver.vehicle}</span>
                      </td>
                      <td className="py-3.5 text-center text-slate-900 font-black">
                        {driver.trips} viajes
                      </td>
                      <td className="py-3.5 text-center text-[#0056d2] font-black">
                        ⚡ {driver.avgDeliveryMin} min
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-black text-[11px] inline-flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {driver.rating}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-black text-slate-900">
                        ${driver.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          driver.tier === 'DIAMANTE' ? 'bg-[#161e00] text-[#c3f400]' :
                          driver.tier === 'PLATINO' ? 'bg-blue-100 text-[#0056d2]' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {driver.tier}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          driver.status === 'EN_RUTA' ? 'bg-emerald-100 text-emerald-800' :
                          driver.status === 'ACTIVO' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {driver.status === 'EN_RUTA' ? '🛵 En Ruta' : driver.status === 'ACTIVO' ? '🟢 Conectado' : '⏸️ En Pausa'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
