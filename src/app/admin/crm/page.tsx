'use client'

import React from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { Users, Building2, Store, TrendingUp, Award, Phone, Mail, MapPin, Calendar, Heart, ShieldAlert, ArrowUpRight } from 'lucide-react'

export default function AdminCRMPage() {
  const [clients, setClients] = React.useState([
    {
      id: 1,
      type: 'FLEET_OWNER',
      name: 'Don Manuel H. (VAMO Flotilla Centro)',
      contact: '+52 55 4123 9876',
      city: 'CDMX - Zona Centro',
      riders: 18,
      ltv: '$142,500 MXN',
      activeOrdersMonth: 1420,
      retentionRate: '98%',
      tier: 'VIP PLATINUM',
      tierBg: 'bg-[#1c1b1b] text-[#c3f400]',
      lastInteraction: 'Ajuste de contrato semanal por 3 choferes nuevos'
    },
    {
      id: 2,
      name: 'Grupo Gastronómico El Pastor (Franquicias)',
      type: 'MERCHANT_CHAIN',
      contact: '+52 22 2876 5432',
      city: 'Puebla',
      riders: 0,
      ltv: '$38,900 MXN',
      activeOrdersMonth: 890,
      retentionRate: '95%',
      tier: 'GOLD MEMBER',
      tierBg: 'bg-[#fddf33] text-[#726200]',
      lastInteraction: 'Activación de suscripción Radar Urbano 5 sucursales'
    },
    {
      id: 3,
      name: 'Farmacias San Gabriel',
      type: 'MERCHANT_GENERIC',
      contact: '+52 44 2901 2345',
      city: 'Querétaro',
      riders: 0,
      ltv: '$18,400 MXN',
      activeOrdersMonth: 340,
      retentionRate: '92%',
      tier: 'SILVER MEMBER',
      tierBg: 'bg-[#e5e2e1] text-[#1c1b1b]',
      lastInteraction: 'Consulta de pedidos B2B insumos de empaque'
    }
  ])

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="crm" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">CRM Hyper-Local 360° & Valor de Cliente (LTV)</h1>
            <p className="text-xs text-[#737785] font-semibold">Trazabilidad total de dueños de flota, comercios afiliados, retención y propuesta de valor VAMO</p>
          </div>

          <span className="bg-[#0056d2] text-white px-4 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#c3f400]" />
            0% Comisión por Pedido &bull; CRM Exclusivo VAMO
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* TABLERO DE PROPUESTA DE VALOR DISRUPTIVA VAMO VS UBER/DIDI */}
          <div className="bg-[#0056d2] text-white p-6 rounded-[32px] shadow-lg space-y-4">
            <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              VENTAJA COMPETITIVA ABSOLUTA DE MARCA
            </span>
            <h2 className="text-xl font-black">¿Por qué los Comercios y Dueños de Flota prefieren VAMO sobre Uber/DiDi/Rappi?</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20 space-y-1">
                <strong className="text-sm font-extrabold text-[#c3f400] block">0% Comisión por Comisión de Venta</strong>
                <p className="text-xs text-slate-100 font-semibold">
                  Uber cobra del 25% al 35%. Con VAMO el negocio conserva el 100% de su margen mediante suscripción plana.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl border border-white/20 space-y-1">
                <strong className="text-sm font-extrabold text-[#fddf33] block">Propiedad Absoluta de Datos del Cliente</strong>
                <p className="text-xs text-slate-100 font-semibold">
                  El comercio es dueño de su base de clientes, teléfonos y hábitos, permitiendo fidelización directa por WhatsApp.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl border border-white/20 space-y-1">
                <strong className="text-sm font-extrabold text-[#c3f400] block">Ecosistema B2B Insumos entre Locales</strong>
                <p className="text-xs text-slate-100 font-semibold">
                  Los comercios se compran empaques y suministros entre ellos con choferes VAMO auto-despachados.
                </p>
              </div>
            </div>
          </div>

          {/* LISTADO DE CLIENTES Y TRACEABILIDAD LTV */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-[#1c1b1b] uppercase tracking-wider">Directorio 360° de Clientes Corporativos</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {clients.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${c.tierBg}`}>
                        {c.tier}
                      </span>
                      <span className="text-xs font-black text-[#0056d2]">{c.retentionRate} Retención</span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-[#1c1b1b] leading-snug">{c.name}</h4>
                      <p className="text-xs font-bold text-[#737785] mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0056d2]" /> {c.city}
                      </p>
                    </div>

                    <div className="bg-[#f6f3f2] p-4 rounded-2xl space-y-1.5 border border-[#e5e2e1]">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[#737785]">Valor de Vida (LTV):</span>
                        <span className="font-black text-[#0056d2]">{c.ltv}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[#737785]">Entregas Mensuales:</span>
                        <span className="font-extrabold text-[#1c1b1b]">{c.activeOrdersMonth} envíos</span>
                      </div>
                    </div>

                    <div className="text-[11px] font-semibold text-[#737785] bg-[#fcf9f8] p-3 rounded-xl border border-[#f0eded]">
                      <span className="font-black text-[#1c1b1b] block mb-0.5">Última interacción registrada:</span>
                      "{c.lastInteraction}"
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#f0eded] flex gap-2">
                    <a 
                      href={`https://wa.me/${c.contact.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#161e00] hover:bg-black text-[#c3f400] py-2.5 rounded-full font-black text-xs transition-all text-center flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Contactar WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
