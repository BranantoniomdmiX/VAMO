'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { 
  Store, 
  Sparkles, 
  Utensils, 
  Pill, 
  Wrench, 
  Zap, 
  Volume2, 
  QrCode, 
  DollarSign, 
  Bike, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  TrendingUp,
  Share2,
  PackageCheck,
  Smartphone
} from 'lucide-react'

export default function BizMainHubPage() {
  const [storeName, setStoreName] = useState('Mi Negocio VAMO')
  const [category, setCategory] = useState('Comida / Restaurante')
  const [isOpen, setIsOpen] = useState(true)
  const [activeOrdersCount, setActiveOrdersCount] = useState(3)
  const [dailySales, setDailySales] = useState(1485.00)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_merchant_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.storeName) setStoreName(parsed.storeName)
        if (parsed.category) setCategory(parsed.category)
        if (parsed.isOpen !== undefined) setIsOpen(parsed.isOpen)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleToggleStore = () => {
    const nextState = !isOpen
    setIsOpen(nextState)
    try {
      const stored = localStorage.getItem('vamo_merchant_profile')
      const parsed = stored ? JSON.parse(stored) : {}
      parsed.isOpen = nextState
      localStorage.setItem('vamo_merchant_profile', JSON.stringify(parsed))
    } catch (e) {
      console.error(e)
    }
  }

  const verticalModes = [
    {
      id: 'simple',
      title: '🌮 Modo Callejero / Taquero / Puesto',
      subtitle: 'Para puestos de tacos, gorditas y comercio ambulante. 2 botones gigantes táctiles, comanda en voz alta y cero fricción.',
      route: '/biz/simple',
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: 'Cero Complicaciones',
      badgeStyle: 'bg-amber-50 text-amber-800 border border-amber-200',
      icon: Zap
    },
    {
      id: 'kds',
      title: '👨‍🍳 Modo Restaurante & Cocina (KDS)',
      subtitle: 'Comandera digital de cocina con tiempos de preparación, alertas de voz manos libres y semáforo de pedidos.',
      route: '/biz/kds',
      iconBg: 'bg-blue-50 text-[#0056d2] border-blue-200',
      badge: 'Cocina & Comandas',
      badgeStyle: 'bg-blue-50 text-[#0056d2] border border-blue-200',
      icon: Utensils
    },
    {
      id: 'pharmacy',
      title: '💊 Modo Farmacia & Salud',
      subtitle: 'Visor de recetas médicas por foto, surtido de botiquín urgente y despacho de medicamentos en <12 min.',
      route: '/biz/pharmacy',
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'Recetas & Botiquín',
      badgeStyle: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      icon: Pill
    },
    {
      id: 'hardware',
      title: '🔧 Modo Ferretería & Refaccionaria',
      subtitle: 'Cotizador de piezas por foto y medida, atención de mostrador y asignación de motos con parrilla de carga.',
      route: '/biz/hardware',
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      badge: 'Mostrador & Carga',
      badgeStyle: 'bg-slate-100 text-slate-700 border border-slate-200',
      icon: Wrench
    }
  ]

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      {/* Sidebar Responsivo */}
      <SidebarBiz activeTab="hub" />

      {/* Main Content Hub */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-8 py-6 md:py-10 max-w-6xl mx-auto w-full space-y-8">
          
          {/* Header Superior con Switch de Estado y Nombre del Local */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs">
            <div className="flex items-center gap-4">
              <img 
                src="/logos/logo-merchant.png" 
                alt="VAMO Comercio" 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain shadow-xs border border-[#fddf33]/40 bg-[#fcf9f8] p-1 shrink-0" 
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-[#0056d2] text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                    CENTRO DE COMERCIO VAMO
                  </span>
                  <span className="text-xs font-bold text-slate-500">• {category}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {storeName}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                  Panel maestro de operaciones, comandas y despacho a motomandados
                </p>
              </div>
            </div>

            {/* Switch Abierto / Cerrado */}
            <div className="flex items-center gap-3 bg-[#f6f3f2] p-2 rounded-2xl border border-[#e5e2e1]">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Estado del Local</span>
                <span className={`text-xs font-black ${isOpen ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isOpen ? '🟢 Abierto en Radar' : '🔴 Cerrado'}
                </span>
              </div>
              <button
                onClick={handleToggleStore}
                className={`px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer ${
                  isOpen 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isOpen ? 'Cerrar Local' : 'Abrir Local'}
              </button>
            </div>
          </div>

          {/* Tarjeta de Métricas Rápidas (0% Comisiones) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Ventas de Hoy</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">${dailySales.toFixed(2)} MXN</p>
              <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% de ganancia directa (0% comisiones)
              </p>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Pedidos en Proceso</span>
                <PackageCheck className="w-4 h-4 text-[#0056d2]" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#0056d2]">{activeOrdersCount} Activos</p>
              <p className="text-[11px] font-semibold text-slate-500">
                Despachándose en cocina y mostrador
              </p>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Motos VAMO en Zona</span>
                <Bike className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">4 Disponibles</p>
              <p className="text-[11px] font-semibold text-slate-500">
                Tiempo promedio de recolección: &lt; 4 min
              </p>
            </div>
          </div>

          {/* Selector de Pantalla de Trabajo Adaptativa según Giro */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">Pantallas de Operación por Giro</h2>
                <p className="text-xs font-medium text-slate-500">
                  Herramientas diseñadas a la medida de tu tipo de negocio
                </p>
              </div>
              <span className="hidden sm:inline-block bg-blue-50 text-[#0056d2] border border-blue-200 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                4 Modos Adaptativos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verticalModes.map((mode) => {
                const IconComponent = mode.icon
                return (
                  <Link
                    key={mode.id}
                    href={mode.route}
                    className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs hover:border-[#0056d2]/50 hover:shadow-md active:scale-98 transition-all flex flex-col justify-between min-h-[160px] group cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${mode.iconBg}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${mode.badgeStyle}`}>
                          {mode.badge}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#0056d2] group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="space-y-1 mt-4">
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#0056d2] transition-colors">{mode.title}</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {mode.subtitle}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Herramienta Comercial: Menú Digital QR & Link para WhatsApp */}
          <div className="bg-[#002d72] text-white p-6 sm:p-8 rounded-[32px] border border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-black px-3 py-0.5 rounded-full uppercase">
                <QrCode className="w-3.5 h-3.5 text-blue-300" />
                <span>VENTA DIRECTA SIN COMISIONES</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Comparte tu Menú Digital en WhatsApp o Código QR
              </h3>
              <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
                Pon tu código QR en las mesas de tu local o comparte el enlace en WhatsApp. Tus clientes piden directo y VAMO les envía el motomandado.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
              <Link
                href="/biz/catalog"
                className="bg-white hover:bg-slate-100 text-[#0040a1] px-6 py-3.5 rounded-full font-black text-xs shadow-md text-center active:scale-95 transition-all"
              >
                Ver Mi Catálogo 📋
              </Link>
              <Link
                href="/biz/settings"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 rounded-full font-bold text-xs text-center active:scale-95 transition-all"
              >
                Configurar Horarios ⚙️
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
