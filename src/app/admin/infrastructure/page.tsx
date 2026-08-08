'use client'

import React from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { Activity, CheckCircle2, Server, Database, Radio } from 'lucide-react'

export default function AdminInfrastructurePage() {
  const services = [
    { name: 'Supabase PostgreSQL Cluster', status: 'Optimal', latency: '42 ms', uptime: '99.99%' },
    { name: 'Supabase Realtime WebSockets', status: 'Optimal', latency: '18 ms', uptime: '100.00%' },
    { name: 'Next.js Turbopack Edge CDN', status: 'Optimal', latency: '12 ms', uptime: '99.98%' }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="infrastructure" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Monitor de Infraestructura Global</h1>
            <p className="text-xs text-[#737785] font-semibold">Estado de servidores, bases de datos y canales Realtime</p>
          </div>

          <span className="bg-[#c3f400] text-[#161e00] px-4 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Infraestructura Saludable
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <strong className="text-sm font-extrabold text-[#1c1b1b]">{s.name}</strong>
                  <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full">
                    {s.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs font-semibold text-[#737785]">
                  <p>Latencia media: <span className="text-[#0056d2] font-bold">{s.latency}</span></p>
                  <p>Uptime de red: <span className="text-[#1c1b1b] font-bold">{s.uptime}</span></p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
