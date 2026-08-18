'use client'

import React from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { CreditCard, Check, DollarSign, UserCheck, Calendar, ArrowUpRight, ShieldCheck } from 'lucide-react'

export default function OwnerPaymentsPage() {
  const [schemes, setSchemes] = React.useState([
    { id: 1, title: 'Comisión Estándar 15%', desc: 'Se descuenta el 15% automático por cada viaje completado.', active: true },
    { id: 2, title: 'Cuota Fija Diaria ($120 MXN)', desc: 'Rider paga una tarifa plana al día sin comisiones por viaje.', active: false },
    { id: 3, title: 'Suscripción Semanal ($700 MXN)', desc: 'Acceso ilimitado a viajes durante 7 días.', active: false }
  ])

  const [payrollRiders, setPayrollRiders] = React.useState([
    { id: 'R-01', name: 'Carlos M. (Yamaha YBR)', tripsWeek: 48, grossEarnings: '$3,840 MXN', netPayout: '$3,264 MXN', status: 'PENDIENTE' },
    { id: 'R-02', name: 'Roberto M. (Italika FT150)', tripsWeek: 36, grossEarnings: '$2,880 MXN', netPayout: '$2,448 MXN', status: 'PAGADO' },
    { id: 'R-03', name: 'Ana P. (Honda Cargo)', tripsWeek: 52, grossEarnings: '$4,160 MXN', netPayout: '$3,536 MXN', status: 'PENDIENTE' }
  ])

  const handleActivateScheme = (id: number) => {
    setSchemes(prev => prev.map(s => ({ ...s, active: s.id === id })))
  }

  const handlePayRider = (id: string) => {
    setPayrollRiders(prev => prev.map(r => r.id === id ? { ...r, status: 'PAGADO' } : r))
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="payments" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Nómina & Esquemas de Pago a Repartidores</h1>
            <p className="text-xs text-[#737785] font-semibold">Liquidación semanal, comisiones y dispersión a la flotilla</p>
          </div>

          <span className="bg-[#c3f400] text-[#161e00] px-4 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Corte Semanal Activo
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* SECCIÓN 1: ESQUEMAS DE COBRO PARA LA FLOTILLA */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#1c1b1b] uppercase tracking-wider">Esquemas de Comisión de la Flotilla</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {schemes.map((s) => (
                <div key={s.id} className={`p-6 rounded-[32px] border shadow-sm space-y-4 flex flex-col justify-between transition-all ${
                  s.active ? 'bg-white border-[#0056d2] shadow-md ring-2 ring-[#0056d2]/20' : 'bg-white border-[#e5e2e1]'
                }`}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-base font-extrabold text-[#1c1b1b]">{s.title}</strong>
                      {s.active && <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full">ACTIVO</span>}
                    </div>
                    <p className="text-xs font-semibold text-[#737785]">{s.desc}</p>
                  </div>

                  <button 
                    onClick={() => handleActivateScheme(s.id)}
                    className={`w-full py-3 rounded-full font-extrabold text-xs transition-all active:scale-95 ${
                      s.active ? 'bg-[#0056d2] text-white shadow-sm' : 'bg-[#f0eded] text-[#1c1b1b] hover:bg-[#e5e2e1]'
                    }`}
                  >
                    {s.active ? 'Esquema Activo Actual' : 'Activar Este Esquema'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: LIQUIDACIÓN DE NÓMINA DE CHOFERES */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-extrabold text-[#1c1b1b] uppercase tracking-wider">Liquidación & Dispersión Semanal a Choferes</h2>
              <span className="text-xs font-bold text-[#737785]">3 Choferes en Nómina</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {payrollRiders.map(r => (
                <div key={r.id} className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <strong className="text-base font-extrabold text-[#1c1b1b]">{r.name}</strong>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        r.status === 'PAGADO' ? 'bg-[#c3f400] text-[#161e00]' : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="bg-[#f6f3f2] p-4 rounded-2xl space-y-1.5 border border-[#e5e2e1] text-xs font-semibold">
                      <div className="flex justify-between text-[#737785]">
                        <span>Viajes Completados:</span>
                        <span className="font-bold text-[#1c1b1b]">{r.tripsWeek} viajes</span>
                      </div>
                      <div className="flex justify-between text-[#737785]">
                        <span>Ingresos Brutos:</span>
                        <span className="font-bold text-[#1c1b1b]">{r.grossEarnings}</span>
                      </div>
                      <div className="flex justify-between text-[#0056d2] font-black text-sm pt-1 border-t border-[#e5e2e1]">
                        <span>Pago Neto A Dispersar:</span>
                        <span>{r.netPayout}</span>
                      </div>
                    </div>
                  </div>

                  {r.status === 'PENDIENTE' ? (
                    <button 
                      onClick={() => handlePayRider(r.id)}
                      className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>DISPERSAR NÓMINA AHORA</span>
                    </button>
                  ) : (
                    <div className="bg-[#c3f400] text-[#161e00] py-3 rounded-full text-center font-black text-xs flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>NÓMINA DISPERSADA &bull; AL DÍA</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
