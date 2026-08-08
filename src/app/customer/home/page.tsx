'use client'

import React from 'react'
import Link from 'next/link'
import { Truck, ShoppingBag, Route, Compass, Bell, ArrowRight, ChevronRight, Package, Wallet, User, Home } from 'lucide-react'

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

        {/* Action Cards (Bento Grid Original 1:1) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          
          {/* Card 1: Llevar algo (Azul VAMO) */}
          <Link 
            href="/customer/quote"
            className="bg-[#0056d2] text-white p-6 rounded-2xl flex flex-col justify-between min-h-[160px] md:min-h-[200px] shadow-md hover:opacity-95 active:scale-98 transition-all relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex justify-between items-start w-full z-10">
              <Truck className="w-10 h-10 mb-4" />
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold z-10">Llevar algo</h3>
          </Link>

          {/* Card 2: Comprar y llevar (Amarillo VAMO) */}
          <Link 
            href="/customer/radar"
            className="bg-[#fddf33] text-[#726200] p-6 rounded-2xl flex flex-col justify-between min-h-[160px] md:min-h-[200px] shadow-md hover:opacity-95 active:scale-98 transition-all relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/40 rounded-full -mr-6 -mb-6 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex justify-between items-start w-full z-10">
              <ShoppingBag className="w-10 h-10 mb-4" />
              <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-[#726200]" />
              </div>
            </div>
            <h3 className="text-xl font-bold z-10">Comprar y llevar</h3>
          </Link>

          {/* Card 3: Varias paradas (Blanco Bordeado en Spans Full) */}
          <Link 
            href="/customer/quote"
            className="bg-white border-2 border-[#c3c6d6] text-[#1c1b1b] p-6 rounded-2xl flex flex-row items-center justify-between min-h-[100px] shadow-sm hover:border-[#0056d2] active:scale-98 transition-all md:col-span-2 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#f0eded] flex items-center justify-center text-[#0056d2]">
                <Route className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Varias paradas</h3>
                <p className="text-sm font-semibold text-[#424654]">Rutas complejas, un solo viaje</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-[#c3c6d6]" />
          </Link>
        </section>

        {/* Explore Radar Section */}
        <section className="mt-4 bg-[#f6f3f2] border border-[#e5e2e1] p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-[#1c1b1b]">Explorar Radar VAMO</h3>
            <p className="text-sm font-semibold text-[#424654] mt-0.5">Encuentra socios cerca de ti</p>
          </div>
          <Link 
            href="/customer/radar"
            className="w-14 h-14 rounded-full bg-[#0056d2] text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-90 transition-all"
          >
            <Compass className="w-8 h-8" />
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
