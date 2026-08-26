'use client'

import React, { useState } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { 
  DollarSign, Sliders, Store, Bike, Building2, 
  ArrowUpRight, ShieldCheck, CheckCircle2, Download, 
  Sparkles, Layers, RefreshCw, Scale, Utensils, Pill, ShoppingBag
} from 'lucide-react'

export default function OwnerBillingAndPricingPage() {
  // Configuración de Cuotas por Zona (Configurable por el Socio Comercial)
  const [driverWeeklyTotal, setDriverWeeklyTotal] = useState<number>(100) // $50 Socio Comercial + $50 VAMO
  const [microMonthlyTotal, setMicroMonthlyTotal] = useState<number>(100)  // $50 Socio Comercial + $50 VAMO
  const [standardMonthlyTotal, setStandardMonthlyTotal] = useState<number>(300) // $150 Socio Comercial + $150 VAMO
  const [restaurantMonthlyTotal, setRestaurantMonthlyTotal] = useState<number>(600) // $300 Socio Comercial + $300 VAMO

  // Simulador de volumen de la flotilla en la plaza
  const [driverCount, setDriverCount] = useState<number>(24)
  const [microCount, setMicroCount] = useState<number>(32)
  const [standardCount, setStandardCount] = useState<number>(18)
  const [restaurantCount, setRestaurantCount] = useState<number>(12)

  // Cálculos de Ingresos Mensuales (4 semanas por mes)
  const driversMonthlyTotalGross = driverCount * (driverWeeklyTotal * 4)
  const microMonthlyGross = microCount * microMonthlyTotal
  const standardMonthlyGross = standardCount * standardMonthlyTotal
  const restaurantMonthlyGross = restaurantCount * restaurantMonthlyTotal

  const totalMonthlyGross = driversMonthlyTotalGross + microMonthlyGross + standardMonthlyGross + restaurantMonthlyGross
  
  // Split 50/50 Inmutable
  const ownerMonthlyNet = totalMonthlyGross * 0.50
  const vamoPlatformRoyalties = totalMonthlyGross * 0.50

  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSavePricing = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="billing" />

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs sticky top-0 z-30">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
              Finanzas de Plaza & Tarifas Oficiales
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Gestión operativa de tu flotilla, ingresos de plaza y transparencia de cuotas autorizadas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-[#161e00] text-[#c3f400] px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Tarifas Reguladas &bull; Sin Comisiones Ocultas</span>
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Bento Grid: Resumen de Ganancias y Transparencia Legal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Ganancia Neta del Socio Operador */}
            <div className="bg-[#0056d2] text-white p-6 sm:p-8 rounded-[32px] space-y-3 shadow-lg flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-[#ccd8ff] uppercase tracking-wider block">
                  TU UTILIDAD OPERATIVA MENSUAL
                </span>
                <p className="text-4xl sm:text-5xl font-black text-[#c3f400]">
                  ${ownerMonthlyNet.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-blue-100 font-semibold block">MXN / Mes generado en tu plaza activa</span>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl text-xs font-bold text-blue-100 flex items-center justify-between">
                <span>Total Recaudado en Plaza:</span>
                <strong className="text-white">${totalMonthlyGross.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
              </div>
            </div>

            {/* Card 2: Marco Legal & Transparencia Comercial */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[32px] space-y-3 shadow-lg flex flex-col justify-between border border-slate-800">
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-[#c3f400] uppercase tracking-wider block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#c3f400]" />
                  TRANSPARENCIA LEGAL & FISCAL
                </span>
                <p className="text-base font-black text-white">
                  Cumplimiento Normativo (PROFECO / SAT)
                </p>
                <span className="text-xs text-slate-300 font-semibold block leading-relaxed">
                  Todas las tarifas son públicas y transparentes antes de operar. Cero sanciones por cobros no estipulados.
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Estatus Legal:</span>
                <strong className="text-[#c3f400]">🟢 En Regla &bull; Cuotas Claras</strong>
              </div>
            </div>

            {/* Card 3: Resumen de Membresías Activas */}
            <div className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ecosistema Activo en Plaza</span>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-[#f6f3f2] p-3 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Motos Activas</span>
                    <strong className="text-xl font-black text-slate-900">{driverCount}</strong>
                  </div>
                  <div className="bg-[#f6f3f2] p-3 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Locales Afiliados</span>
                    <strong className="text-xl font-black text-slate-900">{microCount + standardCount + restaurantCount}</strong>
                  </div>
                </div>
              </div>

              <p className="text-[11px] font-semibold text-slate-500">
                Los choferes conservan el 100% de lo cobrado en cada viaje.
              </p>
            </div>

          </div>

          {/* MATRIZ DE PRECIOS Y CUOTAS DINÁMICAS POR ZONA */}
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Cuotas Oficiales por Zona Socioeconómica
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Tarifas transparentes acordadas para motociclistas y comercios en tu plaza.
                </p>
              </div>

              <button
                onClick={handleSavePricing}
                className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{savedSuccess ? '¡Tarifas Guardadas!' : 'Guardar Nueva Matriz'}</span>
              </button>
            </div>

            {/* Controles de Sliders de Precios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bloque 1: Cuota Semanal por Motociclista */}
              <div className="bg-[#fcf9f8] p-5 sm:p-6 rounded-[28px] border border-[#e5e2e1] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-black text-slate-900 block">Cuota Semanal de Motociclista</strong>
                      <span className="text-[11px] font-semibold text-slate-500">Motos con acceso ilimitado a viajes</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#0056d2]">${driverWeeklyTotal} MXN</span>
                    <span className="text-[10px] font-bold text-slate-400 block">por semana</span>
                  </div>
                </div>

                <input 
                  type="range"
                  min={60}
                  max={200}
                  step={10}
                  value={driverWeeklyTotal}
                  onChange={e => setDriverWeeklyTotal(Number(e.target.value))}
                  className="w-full accent-[#0056d2] cursor-pointer"
                />

                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 bg-white p-3 rounded-2xl border border-[#e5e2e1]">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-black">Tu Ganancia Neta:</span>
                    <strong className="text-emerald-700 font-black">${(driverWeeklyTotal * 0.5).toFixed(2)} MXN/sem</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-black">Infraestructura y App:</span>
                    <strong className="text-slate-700 font-black">Servidores & GPS</strong>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Micro / Callejero / Taquero / Puestos */}
              <div className="bg-[#fcf9f8] p-5 sm:p-6 rounded-[28px] border border-[#e5e2e1] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-black text-slate-900 block">Puestos Callejeros & Taquerías</strong>
                      <span className="text-[11px] font-semibold text-slate-500">Radar Urbano con 50 artículos más vendidos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-700">${microMonthlyTotal} MXN</span>
                    <span className="text-[10px] font-bold text-slate-400 block">al mes</span>
                  </div>
                </div>

                <input 
                  type="range"
                  min={60}
                  max={200}
                  step={10}
                  value={microMonthlyTotal}
                  onChange={e => setMicroMonthlyTotal(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />

                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 bg-white p-3 rounded-2xl border border-[#e5e2e1]">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-black">Tu Ganancia Neta:</span>
                    <strong className="text-emerald-700 font-black">${(microMonthlyTotal * 0.5).toFixed(2)} MXN/mes</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-black">Infraestructura y App:</span>
                    <strong className="text-slate-700 font-black">Radar de Clientes</strong>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Locales Comerciales / Farmacias / Ferreterías */}
              <div className="bg-[#fcf9f8] p-5 sm:p-6 rounded-[28px] border border-[#e5e2e1] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-black text-slate-900 block">Comercios Locales & Farmacias</strong>
                      <span className="text-[11px] font-semibold text-slate-500">Catálogo mediano y auto-despacho</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-700">${standardMonthlyTotal} MXN</span>
                    <span className="text-[10px] font-bold text-slate-400 block">al mes</span>
                  </div>
                </div>

                <input 
                  type="range"
                  min={200}
                  max={500}
                  step={25}
                  value={standardMonthlyTotal}
                  onChange={e => setStandardMonthlyTotal(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 bg-white p-3 rounded-2xl border border-[#e5e2e1]">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-black">Tu Ganancia Neta:</span>
                    <strong className="text-emerald-700 font-black">${(standardMonthlyTotal * 0.5).toFixed(2)} MXN/mes</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-black">Infraestructura y App:</span>
                    <strong className="text-slate-700 font-black">Auto-Despacho</strong>
                  </div>
                </div>
              </div>

              {/* Bloque 4: Restaurantes de Alta Demanda */}
              <div className="bg-[#fcf9f8] p-5 sm:p-6 rounded-[28px] border border-[#e5e2e1] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-black">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-black text-slate-900 block">Restaurantes de Alta Demanda</strong>
                      <span className="text-[11px] font-semibold text-slate-500">Comandera KDS, menú completo y descuentos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-rose-700">${restaurantMonthlyTotal} MXN</span>
                    <span className="text-[10px] font-bold text-slate-400 block">al mes ($400 - $1,000)</span>
                  </div>
                </div>

                <input 
                  type="range"
                  min={400}
                  max={1000}
                  step={50}
                  value={restaurantMonthlyTotal}
                  onChange={e => setRestaurantMonthlyTotal(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />

                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 bg-white p-3 rounded-2xl border border-[#e5e2e1]">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-black">Tu Ganancia Neta:</span>
                    <strong className="text-emerald-700 font-black">${(restaurantMonthlyTotal * 0.5).toFixed(2)} MXN/mes</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-black">Infraestructura y App:</span>
                    <strong className="text-slate-700 font-black">KDS de Cocina</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>


        </main>
      </div>
    </div>
  )
}
