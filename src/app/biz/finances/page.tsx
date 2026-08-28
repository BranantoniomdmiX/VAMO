'use client'

import React, { useState, useEffect } from 'react'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { Download, Wallet, TrendingUp, Receipt, CheckCircle, Clock, Building2, CreditCard } from 'lucide-react'

export default function BizFinancesPage() {
  const [storeName, setStoreName] = useState('Mi Negocio VAMO')
  const [ownerName, setOwnerName] = useState('Titular Registrado')
  const [bankName, setBankName] = useState('BBVA México')
  const [clabe, setClabe] = useState('012180009876543210')
  const [balance, setBalance] = useState(0.00)
  const [settledOrders, setSettledOrders] = useState<{
    id: string
    time: string
    driver: string
    amount: string
    status: 'liquidated' | 'pending'
    statusLabel: string
  }[]>([])

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('vamo_merchant_profile')
      if (storedProfile) {
        const p = JSON.parse(storedProfile)
        if (p.storeName) setStoreName(p.storeName)
        if (p.ownerName) setOwnerName(p.ownerName)
      }

      const storedOrders = localStorage.getItem('vamo_merchant_settled_orders')
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders)
        setSettledOrders(parsed)
        const total = parsed.reduce((sum: number, o: any) => sum + (parseFloat(o.amount.replace(/[^0-9.]/g, '')) || 0), 0)
        setBalance(total)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      {/* Sidebar Responsivo */}
      <SidebarBiz activeTab="finances" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-8 py-6 md:py-10 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0056d2] tracking-tight">
                Estado de Cuenta & Finanzas
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#737785] mt-1">
                Resumen financiero de {storeName}. Ciclo actual en tiempo real.
              </p>
            </div>

            <button 
              onClick={() => alert('Generando estado de cuenta oficial foliado...')}
              className="bg-white border border-[#e5e2e1] hover:border-[#0056d2] text-[#0056d2] px-6 py-3 rounded-full text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
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
                  <p className="text-xs text-slate-500 font-semibold">Tus ventas digitales y motomandados se transfieren a esta cuenta.</p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full w-fit">
                ✓ SPEI Activo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#fcf9f8] p-4 rounded-2xl border border-[#e5e2e1]">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase block">Banco Registrado</span>
                <strong className="text-sm font-black text-slate-900">{bankName}</strong>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase block">CLABE Interbancaria</span>
                <strong className="text-sm font-mono font-black text-[#0056d2]">{clabe}</strong>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase block">Titular del Negocio</span>
                <strong className="text-sm font-black text-slate-900 uppercase">{ownerName || storeName}</strong>
              </div>
            </div>

            {/* Membresía Comercial & Beneficios VAMO */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 text-left border border-slate-800 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full uppercase">
                  CONVENIO VAMO &bull; NOM-151
                </span>
                <strong className="text-xs font-black text-[#c3f400]">0% de Comisión Sobre Tus Ventas</strong>
              </div>

              <div className="space-y-1 text-[11px] text-slate-300 font-semibold leading-relaxed">
                <p className="font-bold text-white">✨ 100% de la venta para tu negocio:</p>
                <p className="text-slate-300">
                  En VAMO <strong>el 100% de tu cobro es íntegro para tu negocio</strong>. Sin cobros del 30% ni cargos ocultos sobre tus platillos o productos.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button 
                onClick={() => {
                  if (balance <= 0) {
                    alert('No hay saldo acumulado pendiente de dispersar en este momento.')
                    return
                  }
                  alert(`¡Solicitud de dispersión SPEI enviada a Conekta! Recibirás $${balance.toFixed(2)} MXN en tu cuenta bancaria.`)
                }}
                className="flex-1 bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3.5 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                ⚡ Solicitar Dispersión Inmediata 1-Tap (${balance.toFixed(2)} MXN)
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
                <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">${balance.toFixed(2)}</span>
                <div className="flex items-center gap-2 mt-4 text-[#c3f400] text-xs sm:text-sm font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Disponible para corte y liquidación</span>
                </div>
              </div>
            </div>

            {/* Tarjetas Secundarias */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-2">
                <span className="text-xs font-bold text-[#737785] block">Órdenes Liquidadas Hoy</span>
                <p className="text-3xl font-extrabold text-[#1c1b1b]">{settledOrders.length}</p>
                <span className="text-xs font-bold text-[#0056d2] bg-blue-50 px-2.5 py-0.5 rounded-full inline-block">
                  Al 100% de cobro
                </span>
              </div>

              <div className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-2">
                <span className="text-xs font-bold text-[#737785] block">Comisión Cobrada</span>
                <p className="text-3xl font-extrabold text-[#161e00]">$0.00 MXN</p>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                  0% Comisión VAMO
                </span>
              </div>
            </div>

          </div>

          {/* Historial de Liquidaciones */}
          <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#e5e2e1] shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#f0eded] pb-4">
              <h3 className="text-lg font-black text-[#1c1b1b]">Historial de Liquidaciones & Pedidos</h3>
              <span className="text-xs font-bold text-[#737785] bg-[#f0eded] px-3 py-1 rounded-full">
                {settledOrders.length} Registros
              </span>
            </div>

            {settledOrders.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-500">No hay órdenes liquidadas en el ciclo actual.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {settledOrders.map((ord) => (
                  <div key={ord.id} className="py-3 flex justify-between items-center">
                    <div>
                      <strong className="text-xs font-black text-slate-900 block">{ord.id}</strong>
                      <span className="text-[10px] text-slate-500 font-semibold">{ord.time} &bull; Repartidor: {ord.driver}</span>
                    </div>
                    <span className="text-xs font-black text-[#0056d2]">{ord.amount}</span>
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
