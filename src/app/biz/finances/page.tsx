'use client'

import React from 'react'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { Download, Wallet, TrendingUp, Receipt, CheckCircle, Clock } from 'lucide-react'

export default function BizFinancesPage() {
  const settledOrders = [
    {
      id: '#V-8942',
      time: 'Hoy, 14:30 hrs',
      driver: 'Carlos M.',
      amount: '+$350.00',
      status: 'liquidated',
      statusLabel: 'Liquidado'
    },
    {
      id: '#V-8941',
      time: 'Hoy, 13:15 hrs',
      driver: 'Ana P.',
      amount: '+$125.50',
      status: 'liquidated',
      statusLabel: 'Liquidado'
    },
    {
      id: '#V-8938',
      time: 'Ayer, 19:45 hrs',
      driver: 'En ruta a base',
      amount: '+$890.00',
      status: 'pending',
      statusLabel: 'Pendiente en Base'
    }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      {/* Sidebar Responsivo */}
      <SidebarBiz activeTab="finances" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-8 py-6 md:py-10 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0056d2] tracking-tight">
                Estado de Cuenta
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#737785] mt-1">
                Resumen financiero de tu tienda. Ciclo actual.
              </p>
            </div>

            <button className="bg-white border border-[#e5e2e1] hover:border-[#0056d2] text-[#0056d2] px-6 py-3 rounded-full text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
              <Download className="w-4 h-4" />
              <span>Descargar Reporte</span>
            </button>
          </div>

          {/* MÓDULO CUENTA BANCARIA CLABE & DISPERSIÓN SPEI COMERCIO (M16) */}
          <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-[#e5e2e1] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0056d2] text-white flex items-center justify-center font-black text-lg shadow-sm">
                  🏦
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Cuenta de Depósito para Ventas (Conekta SPEI)</h3>
                  <p className="text-xs text-slate-500 font-semibold">Tus ventas con tarjeta y delivery se transfieren directamente a esta cuenta.</p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full w-fit">
                ✓ SPEI Activo (Banco Verificado)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#fcf9f8] p-4 rounded-2xl border border-[#e5e2e1]">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase block">Banco Registrado</span>
                <strong className="text-sm font-black text-slate-900">BBVA México</strong>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase block">CLABE Interbancaria</span>
                <strong className="text-sm font-mono font-black text-[#0056d2]">012180009876543210</strong>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase block">Titular del Negocio</span>
                <strong className="text-sm font-black text-slate-900">TAQUERÍA EL PASTORCITO S.A.</strong>
              </div>
            </div>

            {/* Selector de Frecuencia de Dispersión SPEI */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase">¿Cada cuándo deseas recibir tu dinero en el banco?</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl border-2 border-[#0056d2] bg-blue-50/50 text-slate-900 shadow-xs">
                  <strong className="text-xs font-black text-[#0056d2] block">⚡ Corte Diario Nocturno</strong>
                  <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">Transferencia a las 23:00 hrs de lo vendido hoy</span>
                </div>

                <div className="p-3 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] text-slate-700 hover:border-slate-300 transition-colors">
                  <strong className="text-xs font-black block">📅 Corte Semanal</strong>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Un solo depósito los lunes a las 08:00 AM</span>
                </div>

                <div className="p-3 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] text-slate-700 hover:border-slate-300 transition-colors">
                  <strong className="text-xs font-black block">🚀 Retiro Inmediato</strong>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Dispersión 1-Tap en menos de 5 minutos</span>
                </div>
              </div>
            </div>

            {/* Membresía Comercial & Beneficios VAMO */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 text-left border border-slate-800 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full uppercase">
                  MEMBRESÍA COMERCIAL VAMO
                </span>
                <strong className="text-xs font-black text-[#c3f400]">Cuota Fija Mensual Sin Comisiones</strong>
              </div>

              <div className="space-y-1 text-[11px] text-slate-300 font-semibold leading-relaxed">
                <p className="font-bold text-white">✨ Tus Beneficios como Comercio Afiliado:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li><strong>Visibilidad en Radar Local:</strong> Tus 50 productos más vendidos con pedido 1-Tap.</li>
                  <li><strong>Comandera de Cocina KDS:</strong> Control de pedidos en tiempo real en tablet o celular.</li>
                  <li><strong>Flotilla Garantizada:</strong> Repartidores en menos de 15 minutos en tu puerta.</li>
                </ul>
              </div>

              <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800">
                <span>💡 <strong>Formas de Pago:</strong> Se descuenta automáticamente de tus ventas con tarjeta del fin de mes o puedes pagarla <strong>en Efectivo directamente en la Base Operativa</strong> o con el supervisor de zona.</span>
              </div>
            </div>


            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button 
                onClick={() => {
                  alert('¡Solicitud de dispersión SPEI enviada a Conekta! Recibirás $4,250.00 MXN en tu cuenta BBVA en menos de 5 minutos.')
                }}
                className="flex-1 bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3.5 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                ⚡ Solicitar Dispersión Inmediata 1-Tap ($4,250.00 MXN)
              </button>
            </div>
          </div>



          {/* Bento Grid Layout para Finanzas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Tarjeta Principal Highlight: Balance a Recibir */}
            <div className="md:col-span-2 bg-[#0056d2] text-white rounded-[32px] p-6 sm:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="text-sm font-bold text-[#ccd8ff] block">Balance a Recibir</span>
                  <span className="text-xs font-bold bg-white/10 text-white px-3 py-1 rounded-full mt-1 inline-block">
                    Efectivo recolectado por repartidores
                  </span>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>

              <div>
                <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">$4,250.00</span>
                <div className="flex items-center gap-2 mt-4 text-[#c3f400] text-xs sm:text-sm font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Disponible para liquidación en base</span>
                </div>
              </div>
            </div>

            {/* Tarjetas de Métricas Secundarias */}
            <div className="space-y-6 flex flex-col justify-between">
              {/* Ventas Totales */}
              <div className="bg-white rounded-[24px] p-6 border border-[#e5e2e1] shadow-sm space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#fddf33] text-[#726200] rounded-full flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#737785]">Ventas Totales</span>
                </div>
                <p className="text-2xl font-extrabold text-[#1c1b1b]">$12,800.50</p>
                <span className="text-xs font-bold text-[#c3f400] bg-[#161e00] px-2.5 py-0.5 rounded-full inline-block">
                  +15% esta semana
                </span>
              </div>

              {/* Comisiones VAMO */}
              <div className="bg-white rounded-[24px] p-6 border border-[#e5e2e1] shadow-sm space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f0eded] text-[#1c1b1b] rounded-full flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#737785]">Comisiones VAMO</span>
                </div>
                <p className="text-2xl font-extrabold text-[#1c1b1b]">$1,920.00</p>
                <span className="text-xs font-semibold text-[#737785]">15% tarifa estándar</span>
              </div>
            </div>

          </div>

          {/* Análisis de Horas Pico & Volumen de Pedidos */}
          <div className="bg-white rounded-[28px] p-6 border border-[#e5e2e1] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-[#1c1b1b]">Métricas de Horas Pico</h3>
                <p className="text-xs font-semibold text-[#737785]">Distribución de demanda por horario de cocina</p>
              </div>
              <span className="bg-[#0056d2]/10 text-[#0056d2] text-xs font-bold px-3 py-1 rounded-full">
                Pico Máximo: 14:00 - 15:30 hrs 🔥
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2 text-center">
              {[
                { time: '11:00', orders: 12, height: 'h-12', color: 'bg-slate-200' },
                { time: '13:00', orders: 28, height: 'h-24', color: 'bg-[#0056d2]' },
                { time: '14:00', orders: 45, height: 'h-36', color: 'bg-[#fddf33]' },
                { time: '15:00', orders: 38, height: 'h-32', color: 'bg-[#0056d2]' },
                { time: '19:00', orders: 30, height: 'h-24', color: 'bg-[#0056d2]' },
                { time: '21:00', orders: 22, height: 'h-16', color: 'bg-slate-200' },
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-bold text-[#1c1b1b]">{bar.orders} ped.</span>
                  <div className={`w-full ${bar.height} ${bar.color} rounded-lg shadow-xs transition-all`} />
                  <span className="text-[10px] font-semibold text-[#737785]">{bar.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Directorio de Clientes Frecuentes */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-[#1c1b1b]">Directorio de Clientes Frecuentes</h2>
              <span className="text-xs font-bold text-[#0056d2]">Fidelización 360°</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'María Fernanda L.', orders: 18, total: '$2,850 MXN', address: 'Av. Constituyentes 450, Col. Centro', phone: '442-123-4567' },
                { name: 'Roberto Gómez P.', orders: 14, total: '$1,980 MXN', address: 'Calle 5 de Mayo #12, Fracc. Las Rosas', phone: '442-987-6543' },
                { name: 'Dra. Claudia Ramos', orders: 22, total: '$4,120 MXN', address: 'Clínica Quirúrgica, Consultorio 4', phone: '442-555-8899' },
              ].map((client, idx) => (
                <div key={idx} className="bg-white rounded-[24px] p-5 border border-[#e5e2e1] shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-bold text-sm">
                      {client.name.split(' ')[0][0]}{client.name.split(' ')[1]?.[0] || ''}
                    </div>
                    <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {client.orders} PEDIDOS
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1c1b1b]">{client.name}</h4>
                    <p className="text-xs text-[#737785]">{client.address}</p>
                    <p className="text-xs font-bold text-[#0056d2] mt-1">Acumulado: {client.total}</p>
                  </div>
                  <a 
                    href={`tel:${client.phone}`}
                    className="w-full bg-[#f6f3f2] hover:bg-[#0056d2] hover:text-white text-[#1c1b1b] text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors block text-center"
                  >
                    📞 Llamar / Contactar 1-Click
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Órdenes Liquidadas Recientes */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-extrabold text-[#1c1b1b] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#0056d2]" />
              <span>Órdenes Liquidadas Recientes</span>
            </h2>

            <div className="space-y-3">
              {settledOrders.map((order, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-[24px] p-4 sm:p-5 border border-[#e5e2e1] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                      order.status === 'liquidated' ? 'bg-[#c3f400] text-[#161e00]' : 'bg-[#fddf33] text-[#726200]'
                    }`}>
                      {order.status === 'liquidated' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-extrabold text-[#1c1b1b]">Orden {order.id}</p>
                      <p className="text-xs font-semibold text-[#737785]">{order.time} &bull; {order.driver}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <span className="text-base sm:text-lg font-extrabold text-[#1c1b1b]">{order.amount}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      order.status === 'liquidated' ? 'bg-[#c3f400]/40 text-[#161e00]' : 'bg-[#fddf33]/40 text-[#726200]'
                    }`}>
                      {order.statusLabel}
                    </span>
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
