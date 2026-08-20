'use client'

import React from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import Link from 'next/link'
import { Package, Clock, CheckCircle2, ChevronRight, MapPin, Store, ArrowRight } from 'lucide-react'

interface OrderSummary {
  id: string
  code: string
  merchantName: string
  date: string
  itemsSummary: string
  total: number
  status: 'EN_CAMINO' | 'ENTREGADO' | 'PREPARANDO' | 'CANCELADO'
  trackingUrl: string
}

export default function CustomerOrdersListPage() {
  const [orders] = React.useState<OrderSummary[]>([
    {
      id: '1',
      code: 'V-9042',
      merchantName: 'Taquería El Pastorcito',
      date: 'Hoy, 12:05 PM',
      itemsSummary: '3 Tacos al Pastor + 1 Coca-Cola 600ml',
      total: 145.00,
      status: 'EN_CAMINO',
      trackingUrl: '/customer/tracking/1'
    },
    {
      id: '2',
      code: 'V-8821',
      merchantName: 'Farmacia San Francisco',
      date: 'Ayer, 06:30 PM',
      itemsSummary: 'Paracetamol 500mg + Suero Oral',
      total: 89.00,
      status: 'ENTREGADO',
      trackingUrl: '/customer/tracking/1'
    },
    {
      id: '3',
      code: 'V-7910',
      merchantName: 'Envío Directo (Llaves Olvidadas)',
      date: '17 Ago 2026, 03:15 PM',
      itemsSummary: 'Diligencia Punto A a Punto B (2.4 km)',
      total: 45.00,
      status: 'ENTREGADO',
      trackingUrl: '/customer/tracking/1'
    }
  ])

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <span className="bg-[#0056d2]/10 text-[#0056d2] text-xs font-black px-3 py-1 rounded-full uppercase">
              MIS PEDIDOS & SERVICIOS
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1c1b1b] mt-1">Historial de Envíos</h1>
          </div>

          <Link
            href="/customer/quote"
            className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-4 py-2 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all"
          >
            + Nuevo Envío
          </Link>
        </header>

        {/* Lista de Pedidos */}
        <div className="space-y-3">
          {orders.map(order => (
            <Link
              key={order.id}
              href={order.trackingUrl}
              className="block bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-sm hover:border-[#0056d2] transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                    order.status === 'EN_CAMINO' ? 'bg-[#0056d2]' : 'bg-[#161e00]'
                  }`}>
                    {order.status === 'EN_CAMINO' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-[#c3f400]" />}
                  </div>
                  <div>
                    <strong className="text-sm font-extrabold text-[#1c1b1b] block group-hover:text-[#0056d2] transition-colors">
                      {order.merchantName}
                    </strong>
                    <span className="text-[11px] font-semibold text-[#737785] font-mono">
                      #{order.code} &bull; {order.date}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  order.status === 'EN_CAMINO'
                    ? 'bg-[#c3f400] text-[#161e00]'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {order.status === 'EN_CAMINO' ? '⚡ EN CAMINO' : '✓ ENTREGADO'}
                </span>
              </div>

              <p className="text-xs text-[#424654] font-medium pl-12 line-clamp-1 mb-3">
                {order.itemsSummary}
              </p>

              <div className="flex justify-between items-center pl-12 pt-2 border-t border-[#f0eded]">
                <span className="text-xs font-black text-[#1c1b1b]">
                  Total: <span className="text-[#0056d2] font-black">${order.total.toFixed(2)} MXN</span>
                </span>
                
                <span className="text-xs font-bold text-[#0056d2] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Ver Detalles / Rastrear <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </CustomerLayout>
  )
}
