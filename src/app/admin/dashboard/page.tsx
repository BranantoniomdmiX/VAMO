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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-bold">
                  <Bike className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1c1b1b]">Motos Conectadas</h3>
              </div>
              <p className="text-2xl font-black text-[#1c1b1b]">248 Riders</p>
              <span className="text-xs font-semibold text-[#737785]">En 12 ciudades</span>
            </div>

            <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fddf33] text-[#726200] flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1c1b1b]">Viajes Totales Mes</h3>
              </div>
              <p className="text-2xl font-black text-[#1c1b1b]">42,890 Viajes</p>
              <span className="text-xs font-semibold text-[#737785]">99.4% completados</span>
            </div>

            <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1c1b1b]">Latencia Supabase</h3>
              </div>
              <p className="text-2xl font-black text-[#161e00]">42 ms</p>
              <span className="text-xs font-semibold text-[#737785]">WebSocket Realtime OK</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
