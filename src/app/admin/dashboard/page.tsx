'use client'

import React from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { Globe, Building2, Bike, DollarSign, ArrowUpRight, Activity } from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="dashboard" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Dashboard Maestro Global VAMO</h1>
            <p className="text-xs text-[#737785] font-semibold">Monitor en tiempo real de toda la infraestructura y tenants SaaS</p>
          </div>

          <span className="bg-[#1c1b1b] text-[#c3f400] px-4 py-1.5 rounded-full text-xs font-black shadow-sm">
            ● Todos los Sistemas Operativos
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[#1c1b1b] text-white p-6 sm:p-8 rounded-[32px] space-y-4 shadow-lg">
              <span className="text-xs font-extrabold text-[#c3f400] uppercase tracking-wider">VOLUMEN BRUTO PROCESADO (GMV)</span>
              <p className="text-4xl sm:text-6xl font-black text-white">$1,480,250.00 MXN</p>
              <div className="flex items-center gap-2 text-xs font-bold text-[#e5e2e1]">
                <ArrowUpRight className="w-4 h-4 text-[#c3f400]" />
                <span>+24.2% este mes en 12 ciudades activas</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#737785] block">Tenants / Flotas SaaS Activas</span>
                <p className="text-3xl font-extrabold text-[#0056d2] mt-1">14 Flotas</p>
              </div>
              <span className="text-xs font-bold text-[#161e00] bg-[#c3f400] px-3 py-1 rounded-full w-fit">
                100% cobro recurrente al día
              </span>
            </div>
          </div>

          {/* Recaudación Global de Comisiones de Plataforma */}
          <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#e5e2e1] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black bg-[#0056d2]/10 text-[#0056d2] px-3 py-1 rounded-full uppercase">
                  AUDITORÍA RECAUDACIÓN GLOBAL 100%
                </span>
                <h3 className="text-xl font-extrabold text-[#1c1b1b] mt-1">Recaudación de Comisiones & Licencias SaaS</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-[#0056d2]">$222,037.50 MXN</span>
                <span className="text-xs font-bold text-[#161e00] bg-[#c3f400] px-3 py-1 rounded-full block mt-0.5">
                  15% Plataforma Master + Suscripciones
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#f5fff6] p-4 rounded-2xl border border-[#e5e2e1]">
                <span className="text-xs font-bold text-[#737785] block">Comisiones Retenidas Flotas</span>
                <p className="text-xl font-black text-[#1c1b1b] mt-1">$184,500.00 MXN</p>
                <span className="text-[10px] font-bold text-[#34a853]">Cobro en tiempo real</span>
              </div>
              <div className="bg-[#f5fff6] p-4 rounded-2xl border border-[#e5e2e1]">
                <span className="text-xs font-bold text-[#737785] block">Licencias de Conductores</span>
                <p className="text-xl font-black text-[#1c1b1b] mt-1">$24,800.00 MXN</p>
                <span className="text-[10px] font-bold text-[#0056d2]">248 choferes activos</span>
              </div>
              <div className="bg-[#f5fff6] p-4 rounded-2xl border border-[#e5e2e1]">
                <span className="text-xs font-bold text-[#737785] block">Radar Urbano Comercios</span>
                <p className="text-xl font-black text-[#1c1b1b] mt-1">$12,737.50 MXN</p>
                <span className="text-[10px] font-bold text-[#726200]">38 comercios destacados</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
