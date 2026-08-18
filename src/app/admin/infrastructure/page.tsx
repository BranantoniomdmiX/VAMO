'use client'

import React from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { Activity, CheckCircle2, Server, Database, Radio, Cpu, HardDrive, Wifi, ShieldAlert, Zap, AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminInfrastructurePage() {
  const [oracleMetrics, setOracleMetrics] = React.useState({
    cpuCores: 4, // Máximo 4 OCPUs Ampere A1
    cpuUsagePercent: 24.5, // > 15-20% para evitar reclamación de Oracle
    ramGb: 24, // Máximo 24 GB RAM
    ramUsedGb: 8.2,
    diskGb: 200, // Máximo 200 GB Block Storage
    diskUsedGb: 48.6,
    bandwidthMonthlyTb: 10, // 10 TB límite mensual
    bandwidthUsedTb: 0.42, // Usado este mes
    publicIpsUsed: 1, // Máximo 2 IPs gratis
    dokployStatus: 'RUNNING (Dokploy Keep-Alive Active)',
    antiReclaimStatus: 'PROTEGIDO (Uso CPU > 20% Constante)'
  })

  const [interactions, setInteractions] = React.useState({
    activeSockets: 42,
    httpRequestsPerMin: 380,
    gpsEventsPerSec: 18,
    activeDbConnections: 14,
    totalOrdersToday: 248
  })

  const services = [
    { name: 'Oracle Cloud Always Free (Dokploy VPS)', status: 'Gratuito Ilimitado', latency: '24 ms', uptime: '100.00%', icon: Server },
    { name: 'Supabase PostgreSQL Cluster', status: 'Optimal', latency: '42 ms', uptime: '99.99%', icon: Database },
    { name: 'Supabase Realtime WebSockets', status: 'Optimal', latency: '18 ms', uptime: '100.00%', icon: Radio }
  ]

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="infrastructure" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Monitor de Infraestructura & Interacciones Globales</h1>
            <p className="text-xs text-[#737785] font-semibold">Control estricto de límites Oracle Cloud "Always Free", tráfico e interacciones en tiempo real</p>
          </div>

          <span className="bg-[#c3f400] text-[#161e00] px-4 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Oracle Cloud Always Free &bull; Protegido
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* METRICAS DE INTERACCIONES EN TIEMPO REAL */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#0056d2] uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#c3f400] bg-[#161e00] rounded-full p-0.5" />
              Interacciones & Tráfico del Sistema en Vivo
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-1">
                <span className="text-[10px] font-black text-[#737785] block">SOCKETS ACTIVOS</span>
                <p className="text-2xl font-black text-[#0056d2]">{interactions.activeSockets}</p>
                <span className="text-[10px] font-bold text-[#c3f400] bg-[#161e00] px-2 py-0.5 rounded-full">GPS Celulares + Base</span>
              </div>

              <div className="bg-white p-4 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-1">
                <span className="text-[10px] font-black text-[#737785] block">PETICIONES HTTP / MIN</span>
                <p className="text-2xl font-black text-[#1c1b1b]">{interactions.httpRequestsPerMin}</p>
                <span className="text-[10px] font-semibold text-[#737785]">Rutas y API Clicks</span>
              </div>

              <div className="bg-white p-4 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-1">
                <span className="text-[10px] font-black text-[#737785] block">EVENTOS GPS / SEG</span>
                <p className="text-2xl font-black text-[#0056d2]">{interactions.gpsEventsPerSec} /s</p>
                <span className="text-[10px] font-semibold text-[#737785]">Telemetría VPS</span>
              </div>

              <div className="bg-white p-4 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-1">
                <span className="text-[10px] font-black text-[#737785] block">CONEXIONES SUPABASE</span>
                <p className="text-2xl font-black text-[#1c1b1b]">{interactions.activeDbConnections}</p>
                <span className="text-[10px] font-semibold text-[#737785]">Pool PostgreSQL</span>
              </div>

              <div className="bg-white p-4 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-1">
                <span className="text-[10px] font-black text-[#737785] block">ÓRDENES HOY</span>
                <p className="text-2xl font-black text-[#161e00]">{interactions.totalOrdersToday}</p>
                <span className="text-[10px] font-bold bg-[#c3f400] text-[#161e00] px-2 py-0.5 rounded-full">Procesadas</span>
              </div>
            </div>
          </div>

          {/* MONITOREO ESTRICTO REGLAS DE ORO ORACLE CLOUD "ALWAYS FREE" */}
          <div className="bg-[#161e00] text-[#c3f400] p-6 rounded-[32px] shadow-lg border border-[#c3f400]/30 space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#c3f400]/20 pb-4">
              <div>
                <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  PROTECTOR ALWAYS FREE ILIMITADO
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1">Límites Estrictos Oracle Cloud (VM.Standard.A1.Flex)</h2>
              </div>

              <div className="bg-white/10 text-white px-4 py-2 rounded-2xl border border-white/20 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#c3f400]" />
                <span>{oracleMetrics.antiReclaimStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* CPU Ampere ARM */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-bold"><Cpu className="w-4 h-4 text-[#c3f400]" /> CPU Ampere (ARM)</span>
                  <span className="font-extrabold text-[#c3f400]">{oracleMetrics.cpuUsagePercent}%</span>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#c3f400] h-full transition-all" style={{ width: `${oracleMetrics.cpuUsagePercent}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Máximo: 4 OCPUs &bull; Mantener &gt;15-20% para evitar que Oracle pause el servidor.
                </p>
              </div>

              {/* Memoria RAM */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-bold"><Zap className="w-4 h-4 text-[#c3f400]" /> Memoria RAM</span>
                  <span className="font-extrabold text-white">{oracleMetrics.ramUsedGb} / {oracleMetrics.ramGb} GB</span>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#0056d2] h-full transition-all" style={{ width: `${(oracleMetrics.ramUsedGb / oracleMetrics.ramGb) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Límite total: 24 GB RAM &bull; Dokploy corriendo sin sobrecosto.
                </p>
              </div>

              {/* Almacenamiento Block Storage */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-bold"><HardDrive className="w-4 h-4 text-[#c3f400]" /> Disco Duro</span>
                  <span className="font-extrabold text-white">{oracleMetrics.diskUsedGb} / {oracleMetrics.diskGb} GB</span>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#fddf33] h-full transition-all" style={{ width: `${(oracleMetrics.diskUsedGb / oracleMetrics.diskGb) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Tope de disco acumulado: 200 GB máximo en total.
                </p>
              </div>

              {/* Transferencia de Red Outbound */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-bold"><Wifi className="w-4 h-4 text-[#c3f400]" /> Red Salida</span>
                  <span className="font-extrabold text-white">{oracleMetrics.bandwidthUsedTb} / {oracleMetrics.bandwidthMonthlyTb} TB</span>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#c3f400] h-full transition-all" style={{ width: `${(oracleMetrics.bandwidthUsedTb / oracleMetrics.bandwidthMonthlyTb) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  10 TB mensuales gratis &bull; IPs públicas usadas: {oracleMetrics.publicIpsUsed}/2.
                </p>
              </div>
            </div>
          </div>

          {/* ESTADO DE SERVICIOS GENERALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s, idx) => {
              const IconComp = s.icon
              return (
                <div key={idx} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <IconComp className="w-5 h-5 text-[#0056d2]" />
                      <strong className="text-sm font-extrabold text-[#1c1b1b]">{s.name}</strong>
                    </div>
                    <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full">
                      {s.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs font-semibold text-[#737785]">
                    <p>Latencia media: <span className="text-[#0056d2] font-bold">{s.latency}</span></p>
                    <p>Uptime de red: <span className="text-[#1c1b1b] font-bold">{s.uptime}</span></p>
                  </div>
                </div>
              )
            })}
          </div>

        </main>
      </div>
    </div>
  )
}
