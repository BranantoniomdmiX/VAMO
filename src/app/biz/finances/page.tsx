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
