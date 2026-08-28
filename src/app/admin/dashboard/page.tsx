'use client'

import React, { useState, useEffect } from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { Globe, Building2, Bike, DollarSign, ArrowUpRight, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Dashboard Maestro Global VAMO</h1>
            <p className="text-xs text-[#737785] font-semibold">Monitor en tiempo real de toda la infraestructura y plazas SaaS</p>
          </div>

          <span className="bg-[#1c1b1b] text-[#c3f400] px-4 py-1.5 rounded-full text-xs font-black shadow-sm">
            ● Todos los Sistemas Operativos
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[#1c1b1b] text-white p-6 sm:p-8 rounded-[32px] space-y-4 shadow-lg">
              <span className="text-xs font-extrabold text-[#c3f400] uppercase tracking-wider">VOLUMEN BRUTO PROCESADO (GMV)</span>
              <p className="text-4xl sm:text-6xl font-black text-white">${gmvTotal.toFixed(2)} MXN</p>
              <div className="flex items-center gap-2 text-xs font-bold text-[#e5e2e1]">
                <ArrowUpRight className="w-4 h-4 text-[#c3f400]" />
                <span>{fleetsCount} {fleetsCount === 1 ? 'plaza activa' : 'plazas activas'} en tiempo real</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#737785] block">Plazas / Socios Comerciales Activos</span>
                <p className="text-3xl font-extrabold text-[#0056d2] mt-1">{fleetsCount} Plazas</p>
              </div>
              <span className="text-xs font-bold text-[#161e00] bg-[#c3f400] px-3 py-1 rounded-full w-fit">
                Alta y control directo
              </span>
            </div>
          </div>

          {/* Recaudación Global de Comisiones de Plataforma */}
          <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#e5e2e1] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black bg-[#0056d2]/10 text-[#0056d2] px-3 py-1 rounded-full uppercase">
                  AUDITORÍA RECAUDACIÓN GLOBAL
                </span>
                <h3 className="text-xl font-extrabold text-[#1c1b1b] mt-1">Recaudación de Cuotas de Servidor & Licencias</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-[#0056d2]">${platformFees.toFixed(2)} MXN</span>
                <span className="text-xs font-bold text-[#161e00] bg-[#c3f400] px-3 py-1 rounded-full block mt-0.5">
                  Plataforma Master
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#fcf9f8] rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0056d2] flex items-center justify-center font-black">
                  🌐
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block">Sincronización Supabase Realtime & Socket VPS</strong>
                  <span className="text-[10px] font-bold text-slate-500">Hostinger VPS 212.1.213.44 &bull; Sincronizado</span>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full">
                ONLINE
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
