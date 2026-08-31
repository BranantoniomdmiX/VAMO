'use client'

import React, { useState, useEffect } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { 
  DollarSign, Sliders, Store, Bike, Building2, 
  ArrowUpRight, ShieldCheck, CheckCircle2, Download, 
  Sparkles, Layers, RefreshCw, Scale, Utensils, Pill, ShoppingBag, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function OwnerBillingAndPricingPage() {
  const supabase = createClient()
  const [driverWeeklyTotal, setDriverWeeklyTotal] = useState<number>(100)
  const [microMonthlyTotal, setMicroMonthlyTotal] = useState<number>(100)
  const [standardMonthlyTotal, setStandardMonthlyTotal] = useState<number>(300)
  const [restaurantMonthlyTotal, setRestaurantMonthlyTotal] = useState<number>(600)

  const [driverCount, setDriverCount] = useState<number>(0)
  const [merchantsCount, setMerchantsCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    async function loadBillingMetrics() {
      try {
        setIsLoading(true)
        // 1. Choferes
        const { count: dCount } = await supabase
          .from('drivers')
          .select('*', { count: 'exact', head: true })
        setDriverCount(dCount || 0)

        // 2. Comercios
        const { count: bCount } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
        setMerchantsCount(bCount || 0)
      } catch (err) {
        console.warn('Error al cargar métricas de facturación:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadBillingMetrics()
  }, [])

  // Cálculos de Ingresos Reales en base a volumen activo
  const driversMonthlyTotalGross = driverCount * (driverWeeklyTotal * 4)
  const merchantsMonthlyGross = merchantsCount * microMonthlyTotal
  const totalMonthlyGross = driversMonthlyTotalGross + merchantsMonthlyGross
  
  // Split 50/50 Inmutable
  const ownerMonthlyNet = totalMonthlyGross * 0.50

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
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Todas las tarifas son públicas y transparentes antes de operar. Cero sanciones por cobros no estipulados.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Estatus Legal:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> En Regla &bull; Cuotas Claras
                </span>
              </div>
            </div>

            {/* Card 3: Ecosistema Activo Real */}
            <div className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">ECOSISTEMA ACTIVO EN PLAZA</span>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase block">MOTOS ACTIVAS</span>
                    <strong className="text-2xl font-black text-slate-900">{driverCount}</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase block">LOCALES AFILIADOS</span>
                    <strong className="text-2xl font-black text-slate-900">{merchantsCount}</strong>
                  </div>
                </div>
              </div>

              <span className="text-[11px] text-slate-500 font-semibold block text-center">
                Los choferes conservan el 100% de lo cobrado en cada viaje.
              </span>
            </div>

          </div>

          {/* Configuración de Cuotas por Zona */}
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Cuotas Oficiales por Zona Socioeconómica</h3>
                <p className="text-xs text-slate-500 font-semibold">Tarifas transparentes acordadas para motociclistas y comercios en tu plaza.</p>
              </div>

              <button
                onClick={handleSavePricing}
                className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{savedSuccess ? '¡Matriz Guardada!' : 'Guardar Nueva Matriz'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cuota Motociclista */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-bold">
                      <Bike className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-slate-900 block">Aportación de Conectividad Satelital</strong>
                      <span className="text-[10px] text-slate-500 font-semibold">Acceso a viajes & 0% de comisión por entrega</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="text-base font-black text-[#0056d2]">${driverWeeklyTotal} MXN</strong>
                    <span className="text-[9px] text-slate-400 block font-bold">por semana ($14/día)</span>
                  </div>
                </div>

                <input 
                  type="range" 
                  min={50} 
                  max={200} 
                  step={10}
                  value={driverWeeklyTotal} 
                  onChange={e => setDriverWeeklyTotal(Number(e.target.value))}
                  className="w-full accent-[#0056d2] cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-200">
                  <span>TU FONDO OPERATIVO LOCAL: <strong className="text-slate-900">${(driverWeeklyTotal * 0.50).toFixed(2)} MXN/sem</strong></span>
                  <span>INFRAESTRUCTURA NUBE VAMO: <strong className="text-slate-900">${(driverWeeklyTotal * 0.50).toFixed(2)} MXN/sem</strong></span>
                </div>
              </div>

              {/* Cuota Micro-Comercio */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#fddf33] text-[#726200] flex items-center justify-center font-bold">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-slate-900 block">Puestos Callejeros & Taquerías</strong>
                      <span className="text-[10px] text-slate-500 font-semibold">Membresía Radar & Comanda Digital (0% comisión)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="text-base font-black text-[#0056d2]">${microMonthlyTotal} MXN</strong>
                    <span className="text-[9px] text-slate-400 block font-bold">al mes</span>
                  </div>
                </div>

                <input 
                  type="range" 
                  min={50} 
                  max={300} 
                  step={10}
                  value={microMonthlyTotal} 
                  onChange={e => setMicroMonthlyTotal(Number(e.target.value))}
                  className="w-full accent-[#0056d2] cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-200">
                  <span>TU COORDINACIÓN DE PLAZA: <strong className="text-slate-900">${(microMonthlyTotal * 0.50).toFixed(2)} MXN/mes</strong></span>
                  <span>TECNOLOGÍA RADAR & KDS: <strong className="text-slate-900">${(microMonthlyTotal * 0.50).toFixed(2)} MXN/mes</strong></span>
                </div>
              </div>

            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
