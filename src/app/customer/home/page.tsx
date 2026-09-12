'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Truck, ShoppingBag, Route, Compass, Bell, ArrowRight, ChevronRight, Package, Wallet, User, Home, Star, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { RatingService } from '@/lib/services/ratingService'
import { getCustomerServices, getPendingRatingService } from '@/lib/services/serviceActions'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types/database.types'
import { formatCurrencyMXN } from '@/lib/utils/formatters'

function RatingModalSection({ 
  pendingService, 
  onDismiss 
}: { 
  pendingService: any
  onDismiss: () => void 
}) {
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [tip, setTip] = useState<number>(20)
  const [comment, setComment] = useState<string>('')
  const [submitted, setSubmitted] = useState<boolean>(false)

  if (!pendingService) return null

  const driverName = pendingService.driver?.full_name || 'tu conductor VAMO'
  const orderCode = pendingService.service_code || `#VAMO-${pendingService.id?.slice(0, 4) || 'ORD'}`

  const handleRatingSubmit = async () => {
    await RatingService.submitRating({
      orderCode: pendingService.service_code || pendingService.id,
      raterRole: 'customer',
      ratedRole: 'driver',
      stars: rating,
      tags: ['⚡ Súper rápido', '😊 Muy amable'],
      comment,
      tipAmount: tip,
      ratedUserId: pendingService.driver_id || 'driver'
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-[#e6f4ea] border border-[#34a853]/40 p-4 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-[#34a853] shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-[#1e8e3e]">¡Gracias por tu calificación!</h4>
            <p className="text-xs text-slate-700">Tu retroalimentación sumó <strong>+50 VAMO Coins</strong> a tu perfil.</p>
          </div>
        </div>
        <button 
          onClick={onDismiss}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 underline ml-2"
        >
          Cerrar
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-[#fddf33] p-5 rounded-2xl shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="bg-[#fddf33] text-[#726200] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">ÚLTIMO PEDIDO ENTREGADO</span>
          <h3 className="text-base font-bold text-[#1c1b1b] mt-1">¿Cómo fue tu entrega con {driverName}?</h3>
          <p className="text-xs text-[#424654]">Pedido {orderCode}</p>
        </div>
      </div>

      {/* Estrellas Interactivas */}
      <div className="flex items-center gap-2 justify-center py-2 bg-[#fcf9f8] rounded-xl border border-[#e5e2e1]">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 text-2xl transition-transform active:scale-125 focus:outline-hidden"
          >
            <Star 
              className={`w-7 h-7 ${(hoverRating || rating) >= star ? 'fill-[#fddf33] text-[#726200]' : 'text-slate-300'}`} 
            />
          </button>
        ))}
      </div>

      {/* Propina Opcional */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold text-[#1c1b1b]">Propina para el conductor:</span>
        <div className="flex gap-1.5">
          {[0, 10, 20, 50].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setTip(amount)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                tip === amount 
                  ? 'bg-[#0056d2] text-white border-[#0056d2]' 
                  : 'bg-white text-slate-700 border-slate-300 hover:border-[#0056d2]'
              }`}
            >
              {amount === 0 ? 'Sin propina' : `$${amount}`}
            </button>
          ))}
        </div>
      </div>

      {/* Comentario */}
      <input
        type="text"
        placeholder="Escribe un comentario opcional (ej. Excelente atención...)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full text-xs p-2.5 rounded-lg border border-[#e5e2e1] focus:border-[#0056d2] focus:outline-hidden"
      />

      <button
        type="button"
        onClick={handleRatingSubmit}
        className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white font-bold text-xs py-2.5 rounded-xl shadow-xs active:scale-98 transition-all cursor-pointer"
      >
        Enviar Calificación ⭐
      </button>
    </div>
  )
}

export default function CustomerHomePage() {
  const [userName, setUserName] = useState<string>('Cliente')
  const [recentOrders, setRecentOrders] = useState<Service[]>([])
  const [pendingRating, setPendingRating] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente'
          setUserName(name)
          
          const orders = await getCustomerServices(user.id)
          setRecentOrders(orders)

          const pending = await getPendingRatingService(user.id)
          setPendingRating(pending)
        } else {
          // Modo sin sesión o invitado
          const orders = await getCustomerServices()
          setRecentOrders(orders)
        }
      } catch (err) {
        console.warn('Error al cargar datos del cliente:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <CustomerLayout>
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Header Section Saludo Dinámico */}
        <section className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0056d2] bg-blue-50 px-2.5 py-0.5 rounded-full">
              Tu Ciudad en Movimiento
            </span>
          </div>
          <h2 className="text-lg font-semibold text-[#424654]">¡Hola, {userName}!</h2>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#1c1b1b] leading-tight max-w-[14ch]">
            ¿Qué necesitas hoy?
          </h1>
        </section>

        {/* Action Cards (4 Modalidades Únicas y Diferenciadas) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          
          {/* Card 1: Enviar Paquete Directo (Azul VAMO) */}
          <Link 
            href="/customer/quote?mode=direct"
            className="bg-[#0056d2] text-white p-6 rounded-2xl flex flex-col justify-between min-h-[160px] md:min-h-[190px] shadow-md hover:opacity-95 active:scale-98 transition-all relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex justify-between items-start w-full z-10">
              <Truck className="w-9 h-9 mb-2" />
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="z-10 space-y-0.5">
              <h3 className="text-xl font-black">Enviar Paquete Directo</h3>
              <p className="text-xs text-[#ccd8ff] font-semibold">Punto A ➔ Punto B • Llaves, documentos o paquetes</p>
            </div>
          </Link>

          {/* Card 2: Explorar Comercios & Radar Urbano (Amarillo VAMO) */}
          <Link 
            href="/customer/radar"
            className="bg-[#fddf33] text-[#726200] p-6 rounded-2xl flex flex-col justify-between min-h-[160px] md:min-h-[190px] shadow-md hover:opacity-95 active:scale-98 transition-all relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/40 rounded-full -mr-6 -mb-6 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex justify-between items-start w-full z-10">
              <ShoppingBag className="w-9 h-9 mb-2" />
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-[#726200]" />
              </div>
            </div>
            <div className="z-10 space-y-0.5">
              <h3 className="text-xl font-black">Explorar Comercios</h3>
              <p className="text-xs text-[#726200] font-semibold">Restaurantes, farmacias y promociones del radar</p>
            </div>
          </Link>

          {/* Card 3: Diligencias Multi-Paradas (Blanco Corporativo) */}
          <Link 
            href="/customer/quote?mode=multistop"
            className="bg-white border-2 border-[#e5e2e1] text-[#1c1b1b] p-5 rounded-2xl flex flex-row items-center justify-between min-h-[90px] shadow-xs hover:border-[#0056d2] active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#f0eded] flex items-center justify-center text-[#0056d2] shrink-0">
                <Route className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1c1b1b]">Diligencia Multi-Paradas</h3>
                <p className="text-xs font-semibold text-[#737785]">Visita 2 o más domicilios en un solo viaje</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#c3c6d6] shrink-0" />
          </Link>

          {/* Card 4 (Meituan Style): Encargo Combinado Multitienda */}
          <Link 
            href="/customer/combo-errand"
            className="bg-[#0040a1] text-white p-5 rounded-2xl flex flex-row items-center justify-between min-h-[90px] shadow-sm hover:opacity-95 active:scale-98 transition-all border border-blue-800 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">Encargo Multitienda</h3>
                  <span className="bg-[#c3f400] text-[#161e00] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">1 SOLO FLETE</span>
                </div>
                <p className="text-xs font-semibold text-blue-200">Pide comida + farmacia en 1 sola moto</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#c3f400] shrink-0" />
          </Link>
        </section>

        {/* Re-ordenamiento Rápido 1-Tap / Pedidos Recientes Dinámicos */}
        <section className="mt-2 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#1c1b1b]">Pedidos Recientes (Re-ordenar 1-Tap)</h3>
            <Link href="/customer/tracking" className="text-xs font-semibold text-[#0056d2] hover:underline">
              Ver todos los pedidos ➔
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-[#e5e2e1] p-4 rounded-xl animate-pulse h-20" />
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="bg-white border border-[#e5e2e1] p-4 rounded-xl flex items-center justify-between shadow-xs hover:border-[#0056d2] transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#0056d2]/10 text-[#0056d2] flex items-center justify-center font-bold shrink-0">
                      {order.service_type === 'PURCHASE' ? '🛒' : order.service_type === 'MULTI_STOP' ? '🔄' : '📦'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1c1b1b] truncate">
                        {order.service_code || `Servicio ${order.service_type}`}
                      </h4>
                      <p className="text-xs font-medium text-[#424654] truncate">
                        {order.origin_address ? `${order.origin_address.slice(0, 20)}...` : 'Origen'} ➔ {order.destination_address ? `${order.destination_address.slice(0, 20)}...` : 'Destino'} • {formatCurrencyMXN(order.total_price)}
                      </p>
                    </div>
                  </div>
                  <Link 
                    href={`/customer/quote?mode=direct&repeat=${order.id}`} 
                    className="bg-[#0056d2] hover:bg-[#0040a1] text-white text-xs font-bold px-3 py-2 rounded-lg active:scale-95 transition-all shrink-0 ml-2"
                  >
                    Repetir ⚡
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-[#c3c6d6] p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056d2] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#1c1b1b]">Aún no tienes pedidos registrados</h4>
              <p className="text-xs text-[#737785] max-w-sm">
                Cuando realices tu primer envío de paquete o mandado, aparecerá aquí para re-ordenarlo con 1 solo toque.
              </p>
              <Link
                href="/customer/quote?mode=direct"
                className="mt-2 bg-[#0056d2] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:bg-[#0040a1] transition-all"
              >
                Solicitar mi primer envío 📦
              </Link>
            </div>
          )}
        </section>

        {/* Modal de Calificación 5 Estrellas (Solo si hay pedido entregado pendiente) */}
        {pendingRating && (
          <RatingModalSection 
            pendingService={pendingRating} 
            onDismiss={() => setPendingRating(null)} 
          />
        )}

        {/* SECCIÓN BENTO GRID: 'HAZ NEGOCIO CON VAMO' (3 MODALIDADES) */}
        <section className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#0056d2] bg-blue-50 px-2.5 py-0.5 rounded-full">
                Oportunidades de Crecimiento
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#1c1b1b] mt-1">Haz Negocio con VAMO</h3>
            </div>
            <p className="text-xs text-[#737785] font-semibold max-w-xs">
              Únete al ecosistema local como chofer, comercio afiliado o dueño de tu propia flotilla.
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Tarjeta 1: 🛵 Conductor / Repartidor (Col 6) */}
            <div className="md:col-span-6 bg-[#161e00] text-white p-6 rounded-[28px] border border-[#c3f400]/40 flex flex-col justify-between shadow-md space-y-4 hover:border-[#c3f400] transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    GENERA INGRESOS AL DÍA
                  </span>
                  <span className="text-2xl">🛵</span>
                </div>
                <h4 className="text-lg font-black text-white">¿Quieres ser Conductor VAMO?</h4>
                <p className="text-xs font-semibold text-slate-300">
                  Maneja tu moto o bicicleta en tus tiempos libres. Pagos diarios en tu cuenta CLABE y 100% de tus propinas.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Link 
                  href="/auth/register-driver"
                  className="flex-1 bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3 rounded-full text-xs font-black text-center shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Registrarme como Chofer 🏍️
                </Link>
                <a 
                  href="/downloads/VAMO_Conductor.apk"
                  download
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-full text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>APK</span>
                  <span className="text-[10px] opacity-70">⬇</span>
                </a>
              </div>
            </div>

            {/* Tarjeta 2: 🏬 Local Comercial / Negocio (Col 6) */}
            <div className="md:col-span-6 bg-[#0040a1] text-white p-6 rounded-[28px] border border-blue-700 flex flex-col justify-between shadow-md space-y-4 hover:border-blue-500 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    0% COMISIONES ABUSIVAS
                  </span>
                  <span className="text-2xl">🏬</span>
                </div>
                <h4 className="text-lg font-black text-white">¿Tienes un negocio o local?</h4>
                <p className="text-xs font-semibold text-blue-200">
                  Vende en tu zona sin perder el 30% en comisiones. Conecta tu pantalla KDS y envía tus pedidos en moto express.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Link 
                  href="/auth/register-biz"
                  className="flex-1 bg-white hover:bg-slate-100 text-[#0040a1] py-3 rounded-full text-xs font-black text-center shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Afiliar mi Negocio 🏪
                </Link>
                <a 
                  href="/downloads/VAMO_Comercios.apk"
                  download
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-full text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>APK</span>
                  <span className="text-[10px] opacity-70">⬇</span>
                </a>
              </div>
            </div>

            {/* Tarjeta 3 Bento Principal: 💼 Socio Comercial / Dueño de Flota (Col 12 - Hero Card) */}
            <div className="md:col-span-12 bg-linear-to-r from-[#1c1b1b] via-[#242938] to-[#002f7a] text-white p-6 sm:p-7 rounded-[32px] border-2 border-[#fddf33]/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
              <div className="space-y-2 max-w-xl z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-[#fddf33] text-[#726200] text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                    👑 RENTA DE SOFTWARE SAAS
                  </span>
                  <span className="text-xs font-bold text-[#c3f400]">Micro-cuota semanal + 50% de comisiones</span>
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  ¿Quieres operar una Flotilla de Motos o tu propia Plaza?
                </h4>
                <p className="text-xs sm:text-sm font-medium text-slate-300">
                  Conviértete en <strong>Socio Comercial VAMO</strong>. Renta el software con consola de despacho, asigna llaves a tus propios motociclistas y genera ganancias recurrentes en tu territorio.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 z-10">
                <Link 
                  href="/auth/register-owner"
                  className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-6 py-3.5 rounded-full text-xs sm:text-sm font-black text-center shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Postular mi Flota 💼</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a 
                  href="/downloads/VAMO_Socio_Comercial.apk"
                  download
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3.5 rounded-full text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>APK Socio</span>
                  <span className="text-[10px] opacity-70">⬇</span>
                </a>
              </div>
            </div>

          </div>
        </section>

      </div>
    </CustomerLayout>
  )
}

