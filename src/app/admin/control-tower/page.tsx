'use client'

import React from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { Radio, AlertTriangle, Clock, MapPin, Bike, CheckCircle2, ShieldAlert, RefreshCw, Zap, Navigation } from 'lucide-react'

export default function AdminControlTowerPage() {
  const [exceptions, setExceptions] = React.useState([
    {
      id: 'ORD-9821',
      severity: 'CRITICAL',
      type: 'RETARDO_COCINA',
      merchant: 'Taquería El Pastor Centro',
      customer: 'Sra. Elena Rostro',
      driver: 'Juan P. (Rider #14)',
      timeElapsedMinutes: 28,
      slaLimitMinutes: 15,
      status: 'REQUIERE_INTERVENCION',
      location: 'Av. Hidalgo #104, CDMX'
    },
    {
      id: 'ORD-9844',
      severity: 'WARNING',
      type: 'CHOFER_DETENIDO',
      merchant: 'Farmacia San Gabriel',
      customer: 'Carlos M.',
      driver: 'Pedro S. (Rider #08)',
      timeElapsedMinutes: 12,
      slaLimitMinutes: 8,
      status: 'CHOFER_SIN_MOVIMIENTO',
      location: 'Calle 5 de Mayo #45, Puebla'
    }
  ])

  const handleAutoReassign = (orderId: string) => {
    setExceptions(prev => prev.filter(e => e.id !== orderId))
    alert(`⚡ Reasignación Proactiva Meituan Ejecutada: Pedido ${orderId} asignado al repartidor flotante más cercano.`)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="control-tower" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Torre de Control de Excepciones & SLA (Meituan Style)</h1>
            <p className="text-xs text-[#737785] font-semibold">Gestión inteligente por excepción: Solución proactiva automática de demoras y reasignación de flota flotante</p>
          </div>

          <span className="bg-[#161e00] text-[#c3f400] px-4 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5">
            <Radio className="w-4 h-4 animate-pulse" />
            Algoritmo Meituan Active
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* FILOSOFÍA MEITUAN CONTROL TOWER */}
          <div className="bg-[#161e00] text-[#c3f400] p-6 rounded-[32px] shadow-lg border border-[#c3f400]/30 space-y-3">
            <div className="flex justify-between items-center">
              <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                FILOSOFÍA MEITUAN / ELE.ME DE ALTA EFICIENCIA
              </span>
              <span className="text-xs font-bold text-slate-300">Gestión por Excepción (Zero Noise)</span>
            </div>

            <h2 className="text-xl font-extrabold text-white">No pierdas tiempo viendo pedidos normales. La Torre resalta sólo el peligro.</h2>
            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              En las plataformas chinas de entrega masiva (Meituan procesa 50+ millones de pedidos/día), los operadores humanos NO monitorean repartidores en curso. El algoritmo de la Torre de Control resuelve automáticamente el 99% de las entregas e interviene automáticamente resaltando en rojo únicamente las variaciones de SLA.
            </p>
          </div>

          {/* MOTOR DE AGENTES IA AUTÓNOMOS Y RECURSIVIDAD AGÉNTICA (VAMO-AI RECURSIVE ENGINE) */}
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border-2 border-[#0056d2] shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#e5e2e1] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#0056d2] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    VAMO-AI AGENTS ENGINE
                  </span>
                  <h3 className="text-base font-extrabold text-[#1c1b1b]">Motor Agéntico Recursivo Autónomo</h3>
                </div>
                <p className="text-xs font-semibold text-[#737785] mt-0.5">
                  Agentes autónomos que evalúan en bucle, toman decisiones y se auto-corrigen recursivamente.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#f0eded] p-1.5 rounded-full border border-[#e5e2e1]">
                <span className="text-xs font-bold text-[#1c1b1b] px-3">Auto-Piloto Agéntico:</span>
                <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#161e00] animate-pulse" /> ACTIVADO
                </span>
              </div>
            </div>

            {/* LOG DE DECISIONES RECURSIVAS EN TIEMPO REAL */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[#737785] uppercase tracking-wider block">Últimas Decisiones Tomadas por Agentes:</span>
              <div className="bg-[#1c1b1b] text-white p-4 rounded-2xl space-y-2.5 font-mono text-xs border border-slate-800">
                <div className="flex justify-between items-center text-[#c3f400] text-[11px] pb-2 border-b border-white/10 font-sans">
                  <span className="font-bold flex items-center gap-1">🤖 [AGENTE DESPACHADOR] Bucle Recursivo Profundidad 2</span>
                  <span>Hace 30 seg</span>
                </div>
                <p className="text-slate-300">
                  &bull; <strong className="text-white">Causa:</strong> Chofer Pedro S. (Rider #08) inactivo 3m en pedido #ORD-9844 sin movimiento GPS.
                </p>
                <p className="text-slate-300">
                  &bull; <strong className="text-white">Acción Recursiva Ejecutada:</strong> Desasignación automática del chofer inactivo y re-despacho autónomo a Chofer Flotante en Zona Centro.
                </p>
                <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 font-sans">
                  <span>Estado: RESOLVED (Sin intervención humana)</span>
                  <span className="bg-[#0056d2] text-white px-2 py-0.5 rounded-full font-bold">100% Autocorregido</span>
                </div>
              </div>
            </div>
          </div>

          {/* LISTADO DE EXCEPCIONES EN VIVO */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
                Excepciones SLA Detectadas en Vivo ({exceptions.length})
              </h3>
            </div>

            {exceptions.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] border border-[#e5e2e1] text-center space-y-3 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-[#0056d2] mx-auto" />
                <h4 className="text-lg font-extrabold text-[#1c1b1b]">¡Todo Opera sin Excepciones!</h4>
                <p className="text-xs font-semibold text-[#737785]">Todos los pedidos y choferes cumplen sus tiempos SLA correctamente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exceptions.map(exc => (
                  <div 
                    key={exc.id} 
                    className={`bg-white p-6 rounded-[32px] border-2 shadow-md space-y-4 flex flex-col md:flex-row justify-between items-start md:items-center ${
                      exc.severity === 'CRITICAL' ? 'border-[#ba1a1a]' : 'border-[#fddf33]'
                    }`}
                  >
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                          exc.severity === 'CRITICAL' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#fddf33] text-[#726200]'
                        }`}>
                          {exc.type}
                        </span>
                        <strong className="text-sm font-extrabold text-[#1c1b1b]">{exc.id}</strong>
                      </div>

                      <div className="space-y-1 text-xs font-semibold text-[#737785]">
                        <p><span className="font-bold text-[#1c1b1b]">Comercio:</span> {exc.merchant}</p>
                        <p><span className="font-bold text-[#1c1b1b]">Cliente:</span> {exc.customer} &bull; <span className="text-[#0056d2] font-bold">{exc.location}</span></p>
                        <p><span className="font-bold text-[#1c1b1b]">Repartidor Asignado:</span> {exc.driver}</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-black text-[#ba1a1a]">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>Transcurrido: {exc.timeElapsedMinutes} min (SLA Máximo Permitido: {exc.slaLimitMinutes} min)</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => handleAutoReassign(exc.id)}
                        className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-3 rounded-full text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>REASIGNAR CHOFER FLOTANTE</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  )
}
