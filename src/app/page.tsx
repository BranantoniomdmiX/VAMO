'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { User, Store, Bike, LayoutDashboard, Building2, ShieldCheck, ArrowRight, Sparkles, LogIn, CheckCircle2, ChevronRight, ArrowLeft, Globe } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'welcome' | 'portals'>('welcome')

  const portals = [
    {
      id: 'customer',
      title: 'Quiero pedir algo',
      subtitle: 'Entrar como Cliente (Pedidos & Cotizador)',
      route: '/customer/home',
      icon: User,
      iconBg: 'bg-[#0056d2]/10 text-[#0056d2]',
      cardBg: 'bg-white border-[#0056d2]/20 hover:border-[#0056d2]',
      shadow: 'shadow-[0_8px_24px_rgba(0,86,210,0.06)]'
    },
    {
      id: 'biz',
      title: 'Tengo un negocio',
      subtitle: 'Entrar como Comercio Afiliado (Centro de Comercio)',
      route: '/biz',
      icon: Store,
      iconBg: 'bg-[#fddf33] text-[#726200]',
      cardBg: 'bg-white border-[#fddf33]/40 hover:border-[#fddf33]',
      shadow: 'shadow-[0_8px_24px_rgba(253,223,51,0.1)]'
    },
    {
      id: 'driver',
      title: 'Quiero repartir',
      subtitle: 'Entrar como Motociclista',
      route: '/driver/home',
      icon: Bike,
      iconBg: 'bg-[#c3f400] text-[#161e00]',
      cardBg: 'bg-white border-[#c3f400]/50 hover:border-[#c3f400]',
      shadow: 'shadow-[0_8px_24px_rgba(195,244,0,0.12)]'
    },
    {
      id: 'base',
      title: 'Centro de Control',
      subtitle: 'Entrar a la Base de Despacho',
      route: '/base/dispatch',
      icon: LayoutDashboard,
      iconBg: 'bg-[#f0eded] text-[#1c1b1b]',
      cardBg: 'bg-white border-[#e5e2e1] hover:border-[#0056d2]',
      shadow: 'shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
    },
    {
      id: 'owner',
      title: 'Administrar mi Flotilla',
      subtitle: 'Entrar como Dueño de Flota',
      route: '/owner/dashboard',
      icon: Building2,
      iconBg: 'bg-[#0056d2] text-white',
      cardBg: 'bg-white border-[#0056d2]/30 hover:border-[#0056d2]',
      shadow: 'shadow-[0_8px_24px_rgba(0,86,210,0.08)]'
    },
    {
      id: 'regional',
      title: 'Supervisión Regional',
      subtitle: 'Portal 6 &bull; Índice ISF / ICV',
      route: '/regional/dashboard',
      icon: Globe,
      iconBg: 'bg-[#0040a1] text-[#c3f400]',
      cardBg: 'bg-white border-[#0040a1]/30 hover:border-[#0040a1]',
      shadow: 'shadow-[0_8px_24px_rgba(0,64,161,0.08)]'
    },
    {
      id: 'admin',
      title: 'Sistema Global',
      subtitle: 'Panel Superadmin VAMO',
      route: '/admin/dashboard',
      icon: ShieldCheck,
      iconBg: 'bg-[#1c1b1b] text-white',
      cardBg: 'bg-white border-[#e5e2e1] hover:border-[#1c1b1b]',
      shadow: 'shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
    }
  ]

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] p-4 sm:p-8 lg:p-12 font-sans flex flex-col justify-between selection:bg-[#0056d2] selection:text-white">
      <div className="max-w-6xl mx-auto w-full my-auto space-y-8">
        
        {/* Header VAMO con Logo Oficial */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-5 sm:p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <img src="/logo-vamo.svg" alt="VAMO Logo Oficial" className="h-16 sm:h-20 md:h-24 w-auto object-contain shrink-0 transition-all hover:scale-105" />
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0056d2] tracking-tight flex items-center gap-2 leading-tight">
                ¡Hola! Bienvenido a VAMO. <span className="text-2xl">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#737785] font-semibold">
                Plataforma de Logística & Entregas Locales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            {activeTab === 'welcome' ? (
              <button
                onClick={() => setActiveTab('portals')}
                className="w-full sm:w-auto bg-[#f6f3f2] hover:bg-[#e5e2e1] text-[#0056d2] px-5 py-3 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 border border-[#e5e2e1]"
              >
                <span>Acceso a Portales Multi-Rol</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('welcome')}
                className="w-full sm:w-auto bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-3 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Inicio de Sesión</span>
              </button>
            )}
          </div>
        </header>

        {/* 🔴 PRIMERA PANTALLA: BIENVENIDA / AUTH & BOTÓN PROBAR (CERO ROCES) */}
        {activeTab === 'welcome' && (
          <main className="bg-white p-6 sm:p-10 lg:p-12 rounded-[36px] border border-[#e5e2e1] shadow-md space-y-8 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
                EXPERIENCIA FLUIDA SIN ROCES
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#1c1b1b] leading-tight">
                ¿Qué deseas hacer en VAMO hoy?
              </h2>
              <p className="text-sm sm:text-base font-semibold text-[#737785]">
                Puedes hacer pedidos y cotizar al instante sin necesidad de registrarte, o iniciar sesión con tu cuenta corporativa.
              </p>
            </div>

            {/* BOTÓN PRINCIPAL DE CERO ROCES: PROBAR Y HACER PEDIDOS */}
            <div className="bg-[#0056d2]/5 border-2 border-[#0056d2] p-6 sm:p-8 rounded-[32px] text-center space-y-4 max-w-xl mx-auto shadow-sm hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="text-xs font-black text-[#0056d2] uppercase tracking-wider block">ACCESO DIRECTO AUTORIZADO</span>
                <h3 className="text-xl sm:text-2xl font-black text-[#1c1b1b]">Hacer Pedidos / Cotizar Envío</h3>
                <p className="text-xs font-semibold text-[#737785]">Sin registros obligatorios ni formularios largos</p>
              </div>

              <Link
                href="/customer/home"
                className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-4 px-6 rounded-full font-black text-sm sm:text-base shadow-lg shadow-[#0056d2]/30 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-[#c3f400]" />
                <span>PROBAR LA APLICACIÓN Y HACER PEDIDOS YA</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#737785] pt-1">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-[#0056d2]" /> Sin Tarjetas</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-[#0056d2]" /> Cotización Realtime</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-[#0056d2]" /> Rastreo GPS</span>
              </div>
            </div>

            {/* ACCESO A AUTENTICACIÓN FORMAL O PORTALES */}
            <div className="pt-4 border-t border-[#e5e2e1] flex flex-col sm:flex-row justify-between items-center gap-4 max-w-xl mx-auto">
              <Link
                href="/auth/login"
                className="text-xs font-extrabold text-[#0056d2] hover:underline flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión / Registrarme formalmente</span>
              </Link>

              <button
                onClick={() => setActiveTab('portals')}
                className="text-xs font-extrabold text-[#737785] hover:text-[#1c1b1b] underline"
              >
                Ver los 6 Portales de la Plataforma (Comercio, Motos, Admin) →
              </button>
            </div>
          </main>
        )}

        {/* 🟡 SEGUNDA PANTALLA: PORTALES MULTI-ROL (LOS 6 BLOQUES DE SELECCIÓN DE ROL) */}
        {activeTab === 'portals' && (
          <section className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1c1b1b]">Portales de Acceso Multi-Rol</h2>
                <p className="text-xs sm:text-sm font-semibold text-[#737785]">Selecciona el portal operativo para ingresar a tu consola</p>
              </div>
              <button
                onClick={() => setActiveTab('welcome')}
                className="text-xs font-extrabold text-[#0056d2] underline hidden sm:block"
              >
                ← Volver a Pantalla Principal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {portals.map(portal => {
                const IconComponent = portal.icon
                return (
                  <Link
                    key={portal.id}
                    href={portal.route}
                    className={`p-6 sm:p-8 rounded-[28px] border transition-all duration-300 flex flex-col justify-between min-h-[180px] sm:min-h-[210px] ${portal.cardBg} ${portal.shadow} hover:-translate-y-1 group cursor-pointer`}
                  >
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-110 ${portal.iconBg}`}>
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>

                    <div className="mt-6 space-y-1">
                      <h3 className="text-lg sm:text-xl font-bold text-[#1c1b1b] group-hover:text-[#0056d2] transition-colors">
                        {portal.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-[#737785]">
                        {portal.subtitle}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-8 mt-8 border-t border-[#e5e2e1]/60 flex flex-col sm:flex-row justify-between items-center text-xs text-[#737785] font-medium gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c3f400]" />
          <span>VAMO Logistics Platform &bull; Estrategia Cero Roces</span>
        </div>
        <Link href="/customer/home" className="hover:text-[#0056d2] font-bold">
          Probar Pedidos Directo &rarr;
        </Link>
      </footer>
    </div>
  )
}
