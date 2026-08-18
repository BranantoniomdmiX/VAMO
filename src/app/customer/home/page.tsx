'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Truck, ShoppingBag, Route, Compass, Bell, ArrowRight, ChevronRight, Package, Wallet, User, Home, Star, CheckCircle2 } from 'lucide-react'

function RatingModalSection() {
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [tip, setTip] = useState<number>(20)
  const [comment, setComment] = useState<string>('')
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [showModal, setShowModal] = useState<boolean>(true)

  if (!showModal) return null

  if (submitted) {
    return (
      <div className="bg-[#e6f4ea] border border-[#34a853]/40 p-4 rounded-xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-[#34a853]" />
          <div>
            <h4 className="text-sm font-bold text-[#1e8e3e]">¡Gracias por tu calificación!</h4>
            <p className="text-xs text-slate-700">Tu retroalimentación fortalece el servicio de nuestros conductores VAMO.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(false)}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
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
          <h3 className="text-base font-bold text-[#1c1b1b] mt-1">¿Cómo fue tu entrega con Carlos M.?</h3>
          <p className="text-xs text-[#424654]">Pedido #VAMO-8842 • Hace 15 min</p>
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
      <div className="flex items-center justify-between gap-2">
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
        onClick={() => setSubmitted(true)}
        className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white font-bold text-xs py-2.5 rounded-xl shadow-xs active:scale-98 transition-all"
      >
        Enviar Calificación ⭐
      </button>
    </div>
  )
}

export default function CustomerHomePage() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] font-sans flex flex-col justify-between selection:bg-[#0056d2] selection:text-white pb-28 md:pb-12">
      
      {/* Header Superior Original de Stitch: Avatar + VAMO + Notificaciones */}
      <header className="w-full sticky top-0 z-40 bg-[#fcf9f8]/90 backdrop-blur-md border-b border-[#e5e2e1]/60">
        <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
          {/* Leading: Avatar */}
          <Link href="/auth/login" className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#e5e2e1] hover:opacity-80 transition-opacity active:scale-95">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRtRo9d9XDyLBUhXGR9uWb6M35vctBZYnvTs5USq-jv2heq_tBYS0ZIq3FxsEtRcmZ4zF6syHbTGE4v7WnyuFXIgL0KYjFcZhfnpGsiwGH3Fl-lrJdMb_OaYapgZtcsN0MQJ_Icrh7_q7W3Mvge2ii6kuX0c3zH_U25OfAYDmLE5lfVTOmUqGm92Z2xBE-jVeJEXlT5vdgqa6vaiKosF3PKrCFYARzs_enoOtO4Tsmkm3uJnx3xweM" 
              alt="Foto de Perfil" 
              className="w-full h-full object-cover"
            />
          </Link>

          {/* Headline Central VAMO */}
          <h1 className="text-2xl font-extrabold text-[#0040a1] tracking-tight">VAMO</h1>

          {/* Trailing: Notificaciones */}
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#e5e2e1] transition-colors text-[#0040a1] active:scale-95">
            <Bell className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="w-full max-w-4xl mx-auto px-6 pt-6 flex flex-col gap-6">
        
        {/* Header Section Saludo */}
        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-[#424654]">¡Hola, Carlos!</h2>
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

        {/* Re-ordenamiento Rápido 1-Tap */}
        <section className="mt-2 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#1c1b1b]">Pedidos Recientes (Re-ordenar 1-Tap)</h3>
            <span className="text-xs font-semibold text-[#0056d2]">1-Tap Express</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-[#e5e2e1] p-4 rounded-xl flex items-center justify-between shadow-xs hover:border-[#0056d2] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fddf33]/30 text-[#726200] flex items-center justify-center font-bold">
                  🍕
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1c1b1b]">Torta de Pierna + Refresco</h4>
                  <p className="text-xs font-medium text-[#424654]">Tortas El Pariente • $145.00 MXN</p>
                </div>
              </div>
              <Link href="/customer/quote?mode=direct" className="bg-[#0056d2] hover:bg-[#0040a1] text-white text-xs font-bold px-3 py-2 rounded-lg active:scale-95 transition-all">
                Pedir 1-Tap ⚡
              </Link>
            </div>

            <div className="bg-white border border-[#e5e2e1] p-4 rounded-xl flex items-center justify-between shadow-xs hover:border-[#0056d2] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0056d2]/10 text-[#0056d2] flex items-center justify-center font-bold">
                  📦
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1c1b1b]">Envío Llaves & Llaves de Repuesto</h4>
                  <p className="text-xs font-medium text-[#424654]">Centro ➔ Fracc. Las Palmas • $45.00 MXN</p>
                </div>
              </div>
              <Link href="/customer/quote?mode=direct" className="bg-[#0056d2] hover:bg-[#0040a1] text-white text-xs font-bold px-3 py-2 rounded-lg active:scale-95 transition-all">
                Pedir 1-Tap ⚡
              </Link>
            </div>
          </div>
        </section>

        {/* Modal de Calificación 5 Estrellas Integrado */}
        <RatingModalSection />

        {/* Banner de Afiliación de Negocios (Sustituye la duplicidad del Radar) */}
        <section className="mt-2 bg-[#161e00] text-white p-6 rounded-[28px] border border-[#c3f400]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="space-y-1">
            <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
              0% COMISIONES ABUSIVAS
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white">¿Tienes un restaurante o negocio local?</h3>
            <p className="text-xs font-semibold text-slate-300">
              Afíliate a VAMO, conecta tu cocina con la pantalla KDS y vende sin perder el 30% de tus ganancias.
            </p>
          </div>
          <Link 
            href="/biz/catalog"
            className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-5 py-3 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all shrink-0"
          >
            Afiliar mi Local 🏬
          </Link>
        </section>

      </main>

      {/* Bottom Navigation Bar 1:1 de Stitch */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 shadow-[0_-4px_20px_rgba(0,86,210,0.08)] bg-white border-t border-[#e5e2e1] md:hidden">
        
        {/* Tab 1: Inicio (Activo) */}
        <Link href="/customer/home" className="flex flex-col items-center justify-center bg-[#fddf33] text-[#726200] rounded-full px-6 py-2 active:scale-90 transition-all">
          <Home className="w-6 h-6 mb-0.5" />
          <span className="text-xs font-bold">Inicio</span>
        </Link>

        {/* Tab 2: Pedidos */}
        <Link href="/customer/tracking/1" className="flex flex-col items-center justify-center text-[#424654] p-2 hover:bg-[#f0eded] rounded-full active:scale-90 transition-all">
          <Package className="w-6 h-6 mb-0.5" />
          <span className="text-xs font-semibold">Pedidos</span>
        </Link>

        {/* Tab 3: Billetera */}
        <Link href="/customer/home" className="flex flex-col items-center justify-center text-[#424654] p-2 hover:bg-[#f0eded] rounded-full active:scale-90 transition-all">
          <Wallet className="w-6 h-6 mb-0.5" />
          <span className="text-xs font-semibold">Billetera</span>
        </Link>

        {/* Tab 4: Perfil */}
        <Link href="/auth/login" className="flex flex-col items-center justify-center text-[#424654] p-2 hover:bg-[#f0eded] rounded-full active:scale-90 transition-all">
          <User className="w-6 h-6 mb-0.5" />
          <span className="text-xs font-semibold">Perfil</span>
        </Link>

      </nav>
    </div>
  )
}
