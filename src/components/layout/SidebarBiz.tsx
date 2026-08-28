import React from 'react'
import Link from 'next/link'
import { 
  Store, 
  ClipboardList, 
  Package, 
  Wallet, 
  History, 
  LogOut, 
  PlusCircle, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react'

import { NewOrderModal } from '@/components/biz/NewOrderModal'

interface SidebarBizProps {
  activeTab: 'hub' | 'kds' | 'catalog' | 'finances' | 'history' | 'settings' | 'manager' | 'simple' | 'pharmacy' | 'hardware'
}

export function SidebarBiz({ activeTab }: SidebarBizProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isNewOrderOpen, setIsNewOrderOpen] = React.useState(false)
  const [category, setCategory] = React.useState('Restaurante')
  const [isFoodCategory, setIsFoodCategory] = React.useState(true)
  const [storeName, setStoreName] = React.useState('Centro de Comercio VAMO')

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_merchant_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.storeName) setStoreName(parsed.storeName)
        const cat = parsed.category || 'Restaurante'
        setCategory(cat)
        if (cat.includes('Farmacia') || cat.includes('Ferretería') || cat.includes('Abarrotes') || cat.includes('Ropa') || cat.includes('Servicios')) {
          setIsFoodCategory(false)
        } else {
          setIsFoodCategory(true)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const navItems = [
    {
      id: 'hub',
      label: '🏪 Centro de Comercio (Inicio)',
      route: '/biz',
      icon: Store
    },
    {
      id: 'simple',
      label: '🌮 Modo Callejero / Taquero',
      route: '/biz/simple',
      icon: Store
    },
    {
      id: 'manager',
      label: '🖥️ Caja & Gerencia (Dueño)',
      route: '/biz/manager',
      icon: Store
    },
    {
      id: 'kds',
      label: isFoodCategory ? '👨‍🍳 Pantalla KDS (Cocina)' : '📦 Tablero de Mostrador (ODS)',
      route: '/biz/kds',
      icon: isFoodCategory ? ClipboardList : Package
    },
    {
      id: 'pharmacy',
      label: '💊 Modo Farmacia & Recetas',
      route: '/biz/pharmacy',
      icon: Package
    },
    {
      id: 'hardware',
      label: '🔧 Modo Ferretería & Carga',
      route: '/biz/hardware',
      icon: Package
    },
    {
      id: 'catalog',
      label: 'Productos & Catálogo',
      route: '/biz/catalog',
      icon: Package
    },
    {
      id: 'settings',
      label: 'Perfil & Configuración de Local',
      route: '/biz/settings',
      icon: Store
    },
    {
      id: 'finances',
      label: 'Finanzas & Estado de Cuenta',
      route: '/biz/finances',
      icon: Wallet
    }
  ]

  return (
    <>
      {/* Botón Hamburguesa para Celulares */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#e5e2e1] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base text-[#0056d2]">VAMO Store Manager</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-[#f0eded] text-[#1c1b1b]"
          aria-label="Abrir Menú"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop móvil */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Principal (Celulares, Tabletas y PC) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen max-h-screen w-72 bg-white border-r border-[#e5e2e1] 
        p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* PARTE SUPERIOR FIJA: HEADER Y BOTÓN NUEVO PEDIDO */}
        <div className="space-y-4 shrink-0">
          {/* Header del Comercio */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#f0eded]">
            <div className="w-11 h-11 rounded-2xl bg-[#0056d2] text-white flex items-center justify-center shadow-md shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-base text-[#0056d2] leading-tight truncate">
                {storeName}
              </h2>
              <p className="text-[11px] font-semibold text-[#737785]">Centro de Operaciones</p>
            </div>
          </div>

          {/* Botón Acción Principal (+ Nuevo Pedido POS) */}
          <button
            onClick={() => {
              setIsOpen(false)
              setIsNewOrderOpen(true)
            }}
            className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white h-11 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#0056d2]/20 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#c3f400]" />
            <span>+ Nuevo Pedido</span>
          </button>
        </div>

        {/* PARTE MEDIA: NAVEGACIÓN SCROLLABLE INTERNA */}
        <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-1.5 scrollbar-thin">
          
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 block pt-1">
            Menú Principal
          </span>

          {/* Enlace Inicio Hub */}
          <Link
            href="/biz"
            onClick={() => setIsOpen(false)}
            className={`
              flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-all
              ${activeTab === 'hub' 
                ? 'bg-[#0056d2] text-white shadow-xs font-black' 
                : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
            `}
          >
            <div className="flex items-center gap-2.5">
              <Store className={`w-4 h-4 ${activeTab === 'hub' ? 'text-[#c3f400]' : 'text-[#0056d2]'}`} />
              <span>🏪 Inicio (Centro de Comercio)</span>
            </div>
          </Link>

          {/* Productos & Catálogo */}
          <Link
            href="/biz/catalog"
            onClick={() => setIsOpen(false)}
            className={`
              flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-all
              ${activeTab === 'catalog' 
                ? 'bg-[#0056d2] text-white shadow-xs font-black' 
                : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
            `}
          >
            <div className="flex items-center gap-2.5">
              <Package className={`w-4 h-4 ${activeTab === 'catalog' ? 'text-[#c3f400]' : 'text-[#0056d2]'}`} />
              <span>📋 Catálogo & Lista Rápida</span>
            </div>
          </Link>

          {/* Perfil & Configuración de Local */}
          <Link
            href="/biz/settings"
            onClick={() => setIsOpen(false)}
            className={`
              flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-all
              ${activeTab === 'settings' 
                ? 'bg-[#0056d2] text-white shadow-xs font-black' 
                : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
            `}
          >
            <div className="flex items-center gap-2.5">
              <Store className={`w-4 h-4 ${activeTab === 'settings' ? 'text-[#c3f400]' : 'text-[#0056d2]'}`} />
              <span>⚙️ Configuración & Giro</span>
            </div>
          </Link>

          {/* Finanzas & Ganancias */}
          <Link
            href="/biz/finances"
            onClick={() => setIsOpen(false)}
            className={`
              flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-all
              ${activeTab === 'finances' 
                ? 'bg-[#0056d2] text-white shadow-xs font-black' 
                : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
            `}
          >
            <div className="flex items-center gap-2.5">
              <Wallet className={`w-4 h-4 ${activeTab === 'finances' ? 'text-[#c3f400]' : 'text-[#0056d2]'}`} />
              <span>💰 Finanzas & Ganancias</span>
            </div>
          </Link>

          {/* SECCIÓN MODOS ADAPTATIVOS ESPECIALIZADOS */}
          {/* SECCIÓN PANTALLA OPERATIVA PRINCIPAL DEL GIRO */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 block mb-1">
              Terminal Operativa Activa
            </span>

            {category.toLowerCase().includes('taquer') || category.toLowerCase().includes('puesto') || category.toLowerCase().includes('callejero') || category.toLowerCase().includes('simple') ? (
              <Link
                href="/biz/simple"
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-all
                  ${activeTab === 'simple' 
                    ? 'bg-amber-100 text-amber-900 font-black border border-amber-300 shadow-2xs' 
                    : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span>🌮</span>
                  <span>Modo Callejero / Taquero (2 Botones)</span>
                </div>
              </Link>
            ) : category.toLowerCase().includes('farma') || category.toLowerCase().includes('salud') ? (
              <Link
                href="/biz/pharmacy"
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-all
                  ${activeTab === 'pharmacy' 
                    ? 'bg-emerald-100 text-emerald-900 font-black border border-emerald-300 shadow-2xs' 
                    : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span>💊</span>
                  <span>Modo Farmacia & Recetas</span>
                </div>
              </Link>
            ) : category.toLowerCase().includes('ferret') || category.toLowerCase().includes('refacc') || category.toLowerCase().includes('carga') ? (
              <Link
                href="/biz/hardware"
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-all
                  ${activeTab === 'hardware' 
                    ? 'bg-slate-200 text-slate-900 font-black border border-slate-300 shadow-2xs' 
                    : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span>🔧</span>
                  <span>Modo Ferretería & Carga</span>
                </div>
              </Link>
            ) : (
              <Link
                href="/biz/kds"
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-all
                  ${activeTab === 'kds' 
                    ? 'bg-blue-50 text-[#0056d2] font-black border border-blue-200/60 shadow-2xs' 
                    : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span>👨‍🍳</span>
                  <span>Pantalla KDS (Cocina)</span>
                </div>
              </Link>
            )}

            {/* Acceso a Caja & Gerencia */}
            <Link
              href="/biz/manager"
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center justify-between p-2 rounded-xl font-bold text-xs transition-all mt-1
                ${activeTab === 'manager' 
                  ? 'bg-blue-50 text-[#0056d2] font-black border border-blue-200/60 shadow-2xs' 
                  : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
              `}
            >
              <div className="flex items-center gap-2">
                <span>🖥️</span>
                <span>Caja & Gerencia (Dueño)</span>
              </div>
            </Link>
          </div>

          {/* ACCESO RÁPIDO A MODO CLIENTE DESDE COMERCIO */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-black text-[#737785] uppercase tracking-wider px-2 block mb-1">
              CAMBIAR DE MODO
            </span>
            <Link
              href="/customer/home"
              onClick={() => {
                setIsOpen(false)
                try { localStorage.setItem('vamo_active_role', 'customer') } catch {}
              }}
              className="flex items-center gap-2.5 p-2.5 rounded-xl font-bold text-xs bg-blue-50 text-[#0056d2] hover:bg-blue-100 transition-all cursor-pointer"
            >
              <span>👤</span>
              <span className="font-extrabold">Modo Cliente (Comprar)</span>
            </Link>
          </div>

        </div>

        {/* PARTE INFERIOR FIJA: BOTÓN CERRAR SESIÓN SIEMPRE VISIBLE */}
        <div className="pt-3 border-t border-[#e5e2e1] shrink-0 bg-white">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              try {
                localStorage.removeItem('vamo_active_role')
                localStorage.removeItem('vamo_user_session')
              } catch {}
              window.location.href = '/customer/home'
            }}
            className="flex items-center justify-center gap-2.5 p-3 rounded-2xl font-black text-xs sm:text-sm text-white bg-[#ba1a1a] hover:bg-[#93000a] shadow-sm active:scale-95 transition-all w-full cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

      </aside>

      {/* Modal POS Venta Manual */}
      <NewOrderModal 
        isOpen={isNewOrderOpen} 
        onClose={() => setIsNewOrderOpen(false)} 
      />
    </>
  )
}
