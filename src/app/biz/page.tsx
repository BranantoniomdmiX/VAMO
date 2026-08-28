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
  DollarSign, 
  Bike, 
  ShieldCheck, 
  ChevronRight, 
  PackageCheck,
  ShoppingBag,
  QrCode,
  ArrowRight,
  RefreshCw
} from 'lucide-react'

export default function BizMainHubPage() {
  const [storeName, setStoreName] = useState('Mi Negocio VAMO')
  const [category, setCategory] = useState('Restaurante / Cocina Formal')
  const [isOpen, setIsOpen] = useState(true)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  const [dailySales, setDailySales] = useState(0.00)
  const [kdsPin, setKdsPin] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_merchant_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.storeName) setStoreName(parsed.storeName)
        if (parsed.category) setCategory(parsed.category)
        if (parsed.isOpen !== undefined) setIsOpen(parsed.isOpen)
        if (parsed.kdsPin) setKdsPin(parsed.kdsPin)
        if (parsed.dailySales !== undefined) setDailySales(parsed.dailySales)
        if (parsed.activeOrders !== undefined) setActiveOrdersCount(parsed.activeOrders)
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

  // Identificador de la pantalla operativa única asignada al giro del local
  const getAssignedWorkstation = () => {
    const c = category.toLowerCase()
    if (c.includes('taquer') || c.includes('puesto') || c.includes('callejero') || c.includes('rápida') || c.includes('simple')) {
      return {
        id: 'simple',
        title: '🌮 Modo Callejero / Taquería (2 Botones)',
        badge: 'Tu Pantalla Operativa Asignada',
        desc: 'Botones táctiles gigantes para tomar órdenes a máxima velocidad, lectura de comandas por voz y aviso a motomandados.',
        route: '/biz/simple',
        icon: Zap,
        actionText: 'ABRIR MODO CALLEJERO 🌮',
        colorBadge: 'bg-amber-100 text-amber-900 border-amber-300',
        bgBox: 'bg-gradient-to-r from-amber-600 to-orange-600'
      }
    }
    if (c.includes('farma') || c.includes('salud') || c.includes('medic')) {
      return {
        id: 'pharmacy',
        title: '💊 Modo Farmacia & Salud (Recetas)',
        badge: 'Tu Terminal Operativa Asignada',
        desc: 'Visor de recetas médicas por foto, surtido de botiquín urgente y despacho de medicamentos en menos de 12 minutos.',
        route: '/biz/pharmacy',
        icon: Pill,
        actionText: 'ABRIR TERMINAL DE FARMACIA 💊',
        colorBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        bgBox: 'bg-gradient-to-r from-emerald-600 to-teal-700'
      }
    }
    if (c.includes('ferret') || c.includes('refacc') || c.includes('material') || c.includes('carga')) {
      return {
        id: 'hardware',
        title: '🔧 Modo Ferretería & Refaccionaria',
        badge: 'Tu Mostrador Operativo Asignado',
        desc: 'Cotizador de piezas y herramientas por foto o medida, con asignación de motos con parrilla de carga.',
        route: '/biz/hardware',
        icon: Wrench,
        actionText: 'ABRIR MOSTRADOR DE FERRETERÍA 🔧',
        colorBadge: 'bg-slate-200 text-slate-900 border-slate-300',
        bgBox: 'bg-gradient-to-r from-slate-700 to-slate-900'
      }
    }
    if (c.includes('abarrot') || c.includes('tienda') || c.includes('comercio general')) {
      return {
        id: 'catalog',
        title: '🛒 Catálogo & Venta Rápida de Abarrotes',
        badge: 'Tu Tienda Operativa Asignada',
        desc: 'Control de inventario, lista de productos y despacho de pedidos a vecinos y clientes de tu zona.',
        route: '/biz/catalog',
        icon: ShoppingBag,
        actionText: 'ABRIR CATÁLOGO & VENTA 🛒',
        colorBadge: 'bg-blue-100 text-blue-900 border-blue-300',
        bgBox: 'bg-gradient-to-r from-blue-700 to-indigo-800'
      }
    }
    // Por defecto: Restaurante KDS
    return {
      id: 'kds',
      title: '👨‍🍳 Modo Restaurante & Cocina (KDS)',
      badge: 'Tu Comandera Operativa Asignada',
      desc: 'Comandera digital de cocina con tiempos de preparación, alertas de voz manos libres y semáforo de pedidos.',
      route: '/biz/kds',
      icon: Utensils,
      actionText: 'ABRIR PANTALLA KDS COCINA 👨‍🍳',
      colorBadge: 'bg-blue-100 text-blue-900 border-blue-300',
      bgBox: 'bg-gradient-to-r from-[#0040A1] to-[#0056D2]'
    }
  }

  const activeWorkstation = getAssignedWorkstation()
  const ActiveIcon = activeWorkstation.icon

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
                  Panel maestro de operaciones &bull; 0% comisiones directas
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

          {/* HERO WORKSTATION: La pantalla que le corresponde a este local */}
          <div className={`${activeWorkstation.bgBox} text-white p-6 sm:p-8 rounded-[32px] shadow-xl space-y-4 relative overflow-hidden`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className={`inline-flex items-center gap-1.5 ${activeWorkstation.colorBadge} text-[10px] font-black px-3 py-1 rounded-full uppercase border shadow-xs`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{activeWorkstation.badge}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {activeWorkstation.title}
                </h2>
                <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
                  {activeWorkstation.desc}
                </p>
              </div>

              <Link
                href={activeWorkstation.route}
                className="bg-[#C3F400] hover:bg-[#abd600] text-[#161e00] px-7 py-4 rounded-full font-black text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <span>{activeWorkstation.actionText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {kdsPin && (
              <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/80">
                <span>🔑 Tu PIN de acceso rápido para tablets de cocina/mostrador: <strong className="font-mono text-[#C3F400] text-sm ml-1">{kdsPin}</strong></span>
                <Link href="/kds/auth" className="underline font-bold text-[#C3F400] hover:text-white">Abrir Terminal KDS Remota</Link>
              </div>
            )}
          </div>

          {/* Tarjeta de Métricas Reales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Ventas Acumuladas</span>
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
                {activeOrdersCount === 0 ? 'Sin comandas pendientes en este momento' : 'Despachándose en cocina o mostrador'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Red de Motomandados</span>
                <Bike className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">🟢 Conectada</p>
              <p className="text-[11px] font-semibold text-slate-500">
                Despacho inmediato a motociclistas de tu zona
              </p>
            </div>
          </div>

          {/* Accesos Rápidos de Gestión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/biz/catalog"
              className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs hover:border-[#0056d2] hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056d2] border border-blue-200 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-[#0056d2]">
                    Catálogo de Productos & Precios
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Agrega platillos, productos y fotos para tu menú
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#0056d2] transition-all" />
            </Link>

            <Link
              href="/biz/finances"
              className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs hover:border-emerald-600 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700">
                    Finanzas, Cuenta CLABE & Retiros
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Configura tu cuenta bancaria y solicita dispersión SPEI
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 transition-all" />
            </Link>
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
