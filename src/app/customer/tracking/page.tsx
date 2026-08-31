'use client'

import React, { useState, useEffect } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import Link from 'next/link'
import { Package, Clock, CheckCircle2, ChevronRight, MapPin, Store, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface OrderSummary {
  id: string
  code: string
  merchantName: string
  date: string
  itemsSummary: string
  total: number
  status: 'EN_CAMINO' | 'ENTREGADO' | 'PREPARANDO' | 'CANCELADO' | 'PENDIENTE'
  trackingUrl: string
}

export default function CustomerOrdersListPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCustomerOrders() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        let query = supabase
          .from('service_orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (user) {
          query = query.eq('customer_id', user.id)
        }

        const { data: ordersData, error } = await query

        if (!error && ordersData && ordersData.length > 0) {
          setOrders(ordersData.map(o => {
            let statusBadge: OrderSummary['status'] = 'PENDIENTE'
            if (o.status === 'DELIVERED') statusBadge = 'ENTREGADO'
            else if (o.status === 'IN_TRANSIT') statusBadge = 'EN_CAMINO'
            else if (o.status === 'CANCELLED') statusBadge = 'CANCELADO'
            else if (o.status === 'READY_FOR_PICKUP' || o.status === 'PREPARING') statusBadge = 'PREPARANDO'

            return {
              id: o.id,
              code: o.service_code || `#VAMO-${o.id.slice(0, 4).toUpperCase()}`,
              merchantName: o.origin_name || o.merchant_name || 'Envío Directo VAMO',
              date: new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
              itemsSummary: o.package_description || o.items_summary || 'Servicio de entrega local',
              total: Number(o.total_amount || o.price || 0),
              status: statusBadge,
              trackingUrl: `/customer/tracking/${o.id}`
            }
          }))
        } else {
          setOrders([])
        }
      } catch (err) {
        console.warn('Error al consultar pedidos de Supabase:', err)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    loadCustomerOrders()
  }, [])

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
            className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-4 py-2 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            + Nuevo Envío
          </Link>
        </header>

        {/* Lista de Pedidos o Estado Vacío */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#0056d2]" />
            <span className="text-xs font-bold">Consultando pedidos en Supabase...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 rounded-[28px] border border-[#e5e2e1] text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056d2] flex items-center justify-center mx-auto text-xl">
              📦
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Aún no tienes pedidos registrados</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Tus compras en comercios locales y envíos punto a punto aparecerán aquí en vivo.
              </p>
            </div>
            <Link
              href="/customer/quote"
              className="inline-block bg-[#0056d2] text-white px-5 py-2.5 rounded-full text-xs font-black active:scale-95 transition-all shadow-xs"
            >
              Cotizar mi Primer Envío
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <Link
                key={order.id}
                href={order.trackingUrl}
                className="block bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-sm hover:border-[#0056d2] transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#0056d2]" />
                      <strong className="text-sm sm:text-base font-black text-[#1c1b1b]">{order.merchantName}</strong>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 block">{order.code} &bull; {order.date}</span>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                    order.status === 'EN_CAMINO'
                      ? 'bg-[#c3f400] text-[#161e00] animate-pulse'
                      : order.status === 'ENTREGADO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'CANCELADO'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.status === 'EN_CAMINO' ? '🛵 En Camino' : order.status === 'ENTREGADO' ? '✓ Entregado' : order.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-semibold mb-3">
                  {order.itemsSummary}
                </p>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs font-black">
                  <span className="text-slate-900">${order.total.toFixed(2)} MXN</span>
                  <span className="text-[#0056d2] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Ver Tracking en Vivo <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </CustomerLayout>
  )
}
