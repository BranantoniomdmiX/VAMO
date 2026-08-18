'use client'

import React from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { TrendingUp, DollarSign, Wallet, ShieldCheck, ArrowUpRight, Bike, Store } from 'lucide-react'

export default function OwnerDashboardPage() {
  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="dashboard" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Dashboard Financiero 360°</h1>
            <p className="text-xs text-[#737785] font-semibold">Resumen ejecutivo y salud financiera de tu flotilla</p>
          </div>

          <span className="bg-[#0056d2] text-white px-4 py-1.5 rounded-full text-xs font-black shadow-sm">
            Flotilla VAMO Centro &bull; Activa
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Bento Grid Métricas Financieras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-2 bg-[#0056d2] text-white p-6 sm:p-8 rounded-[32px] space-y-4 shadow-lg">
              <span className="text-xs font-extrabold text-[#ccd8ff] uppercase">UTILIDAD NETA DEL MES</span>
              <p className="text-4xl sm:text-6xl font-black text-[#c3f400]">$84,250.00 MXN</p>
              <div className="flex items-center gap-2 text-xs font-bold text-[#ccd8ff]">
                <ArrowUpRight className="w-4 h-4 text-[#c3f400]" />
                <span>+18.4% respecto al mes anterior (4,250 viajes completados)</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#737785] block">Efectivo Circulante en Base</span>
                <p className="text-3xl font-extrabold text-[#1c1b1b] mt-1">$12,450.00</p>
              </div>
              <span className="text-xs font-bold text-[#0056d2] bg-[#0056d2]/10 px-3 py-1 rounded-full w-fit">
                En caja lista para corte
              </span>
            </div>

          </div>

          {/* Tarjetas Secundarias: Motos y Comercios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-bold">
                    <Bike className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#1c1b1b]">Flota Activa</h3>
                </div>
                <span className="text-lg font-black text-[#0056d2]">18 / 20 Riders</span>
              </div>
              <p className="text-xs font-semibold text-[#737785]">90% de ocupación en turno diurno</p>
            </div>

            <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#fddf33] text-[#726200] flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#1c1b1b]">Convenios Locales</h3>
                </div>
                <span className="text-lg font-black text-[#726200]">34 Negocios</span>
              </div>
              <p className="text-xs font-semibold text-[#737785]">Contratos B2B con tarifa preferencial</p>
            </div>
          </div>
          {/* Telemetría de Salud de Motos & Mantenimiento Preventivo Meituan */}
          <div className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#f0eded] pb-3">
              <h3 className="text-base font-extrabold text-[#1c1b1b]">Telemetría de Salud de Motos & Mantenimiento Preventivo</h3>
              <span className="text-xs font-bold text-[#0056d2] bg-[#0056d2]/10 px-3 py-1 rounded-full">
                18 Vehículos Monitoreados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#f6f3f2] p-4 rounded-2xl border border-[#e5e2e1] space-y-1">
                <span className="text-[10px] font-black text-[#737785] uppercase">MOTO #04 &bull; YAMAHA YBR</span>
                <p className="text-sm font-extrabold text-[#1c1b1b]">12,450 km Recorridos</p>
                <span className="text-[10px] font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded-full block w-fit">
                  ⚠️ Requiere Cambio de Aceite (En 50 km)
                </span>
              </div>

              <div className="bg-[#f6f3f2] p-4 rounded-2xl border border-[#e5e2e1] space-y-1">
                <span className="text-[10px] font-black text-[#737785] uppercase">MOTO #09 &bull; ITALIKA FT150</span>
                <p className="text-sm font-extrabold text-[#1c1b1b]">8,200 km Recorridos</p>
                <span className="text-[10px] font-bold text-[#161e00] bg-[#c3f400] px-2 py-0.5 rounded-full block w-fit">
                  🟢 Estado Óptimo (Llantas ok)
                </span>
              </div>

              <div className="bg-[#f6f3f2] p-4 rounded-2xl border border-[#e5e2e1] space-y-1">
                <span className="text-[10px] font-black text-[#737785] uppercase">MOTO #12 &bull; HONDA CARGO</span>
                <p className="text-sm font-extrabold text-[#1c1b1b]">15,100 km Recorridos</p>
                <span className="text-[10px] font-bold text-[#726200] bg-[#fddf33] px-2 py-0.5 rounded-full block w-fit">
                  ⚡ Servicio Programado Viernes
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
