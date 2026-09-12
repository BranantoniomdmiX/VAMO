'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Store, 
  ClipboardList, 
  Package, 
  Wallet, 
  LogOut, 
  PlusCircle, 
  ChevronRight,
  Menu,
  X,
  User,
  ExternalLink
} from 'lucide-react'

import { NewOrderModal } from '@/components/biz/NewOrderModal'
import { VAMO_ROLE_CONFIGS } from './roleNavConfig'

export interface SidebarBizProps {
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

  const config = VAMO_ROLE_CONFIGS.merchant

  return (
    <>
      {/* Botón Hamburguesa para Celulares / Tablet / Small Laptop (< 1280px CSS) */}
      <div className="xl:hidden sticky top-0 z-40 bg-white border-b border-[#e5e2e1] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={config.homeRoute} className="flex items-center gap-2 shrink-0">
            <img src="/logo-vamo.svg" alt="VAMO" className="h-7 w-auto object-contain" />
          </Link>
          <div className="h-5 w-px bg-slate-300 shrink-0" />
          <span className="font-black text-xs sm:text-sm text-[#0056d2] truncate">
            {storeName}
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-[48px] min-w-[48px] p-2.5 rounded-2xl bg-[#f0eded] text-[#1c1b1b] flex items-center justify-center cursor-pointer active:scale-95"
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop móvil */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 z-40 bg-black/50 xl:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Principal (Drawer < 1280px, Sidebar >= 1280px) */}
      <aside className={`
        fixed xl:sticky top-0 left-0 z-50 h-[100dvh] max-h-[100dvh] w-72 sm:w-80 xl:w-72 bg-white border-r border-[#e5e2e1] 
        p-4 sm:p-5 flex flex-col justify-between shadow-lg xl:shadow-xs transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
      `}>
        {/* PARTE SUPERIOR FIJA: HEADER Y BOTÓN NUEVO PEDIDO */}
        <div className="space-y-4 shrink-0">
          {/* Header del Comercio */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0040a1] text-white flex items-center justify-center shadow-xs shrink-0">
                <Store className="w-5 h-5 text-[#c3f400]" />
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight truncate">
                  {storeName}
                </h2>
                <p className="text-[11px] font-semibold text-slate-500 truncate">{category}</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="xl:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Botón Acción Principal (+ Nuevo Pedido POS) */}
          <button
            onClick={() => {
              setIsOpen(false)
              setIsNewOrderOpen(true)
            }}
            className="w-full min-h-[48px] bg-[#0040a1] hover:bg-[#0056d2] text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
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
              flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
              ${activeTab === 'hub' 
                ? 'bg-[#0040a1] text-white shadow-xs font-black' 
                : 'text-slate-700 hover:bg-slate-100 hover:text-[#0056d2]'}
            `}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Store className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${activeTab === 'hub' ? 'text-[#c3f400]' : 'text-slate-400'}`} />
              <span className="truncate">🏪 Inicio (Comercio)</span>
            </div>
            {activeTab === 'hub' && <ChevronRight className="w-4 h-4 text-[#c3f400] shrink-0" />}
          </Link>

          {/* Productos & Catálogo */}
          <Link
            href="/biz/catalog"
            onClick={() => setIsOpen(false)}
            className={`
              flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
              ${activeTab === 'catalog' 
                ? 'bg-[#0040a1] text-white shadow-xs font-black' 
                : 'text-slate-700 hover:bg-slate-100 hover:text-[#0056d2]'}
            `}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Package className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${activeTab === 'catalog' ? 'text-[#c3f400]' : 'text-slate-400'}`} />
              <span className="truncate">📋 Catálogo & Menú</span>
            </div>
            {activeTab === 'catalog' && <ChevronRight className="w-4 h-4 text-[#c3f400] shrink-0" />}
          </Link>

          {/* Perfil & Configuración de Local */}
          <Link
            href="/biz/settings"
            onClick={() => setIsOpen(false)}
            className={`
              flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
              ${activeTab === 'settings' 
                ? 'bg-[#0040a1] text-white shadow-xs font-black' 
                : 'text-slate-700 hover:bg-slate-100 hover:text-[#0056d2]'}
            `}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Store className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${activeTab === 'settings' ? 'text-[#c3f400]' : 'text-slate-400'}`} />
              <span className="truncate">⚙️ Configuración & Giro</span>
            </div>
            {activeTab === 'settings' && <ChevronRight className="w-4 h-4 text-[#c3f400] shrink-0" />}
          </Link>

          {/* Finanzas & Ganancias */}
          <Link
            href="/biz/finances"
            onClick={() => setIsOpen(false)}
            className={`
              flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
              ${activeTab === 'finances' 
                ? 'bg-[#0040a1] text-white shadow-xs font-black' 
                : 'text-slate-700 hover:bg-slate-100 hover:text-[#0056d2]'}
            `}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Wallet className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${activeTab === 'finances' ? 'text-[#c3f400]' : 'text-slate-400'}`} />
              <span className="truncate">💰 Finanzas & Ganancias</span>
            </div>
            {activeTab === 'finances' && <ChevronRight className="w-4 h-4 text-[#c3f400] shrink-0" />}
          </Link>

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
                  flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
                  ${activeTab === 'simple' 
                    ? 'bg-amber-100 text-amber-900 font-black border border-amber-300' 
                    : 'text-slate-700 hover:bg-slate-100 hover:text-[#0056d2]'}
                `}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>🌮</span>
                  <span className="truncate">Modo Callejero / Taquero</span>
                </div>
              </Link>
            ) : category.toLowerCase().includes('farma') || category.toLowerCase().includes('salud') ? (
              <Link
                href="/biz/pharmacy"
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
                  ${activeTab === 'pharmacy' 
                    ? 'bg-emerald-100 text-emerald-900 font-black border border-emerald-300' 
                    : 'text-slate-700 hover:bg-slate-100 hover:text-[#0056d2]'}
                `}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>💊</span>
                  <span className="truncate">Modo Farmacia & Recetas</span>
                </div>
              </Link>
            ) : category.toLowerCase().includes('ferret') || category.toLowerCase().includes('refacc') || category.toLowerCase().includes('carga') ? (
              <Link
                href="/biz/hardware"
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
                  ${activeTab === 'hardware' 
                    ? 'bg-slate-200 text-slate-900 font-black border border-slate-300' 
                    : 'text-slate-700 hover:bg-slate-100 hover:text-[#0056d2]'}
                `}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>🔧</span>
                  <span className="truncate">Modo Ferretería & Carga</span>
                </div>
              </Link>
            ) : (
              <Link
                href="/biz/kds"
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
                  ${activeTab === 'kds' 
                    ? 'bg-[#0040a1] text-white shadow-xs font-black' 
                    : 'text-slate-700 hover:bg-slate-100 hover:text-[#0056d2]'}
                `}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ClipboardList className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${activeTab === 'kds' ? 'text-[#c3f400]' : 'text-slate-400'}`} />
                  <span className="truncate">Pantalla KDS (Cocina)</span>
                </div>
                {activeTab === 'kds' && <ChevronRight className="w-4 h-4 text-[#c3f400] shrink-0" />}
              </Link>
            )}

            {/* Acceso a Caja & Gerencia */}
            <Link
              href="/biz/manager"
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all mt-1
                ${activeTab === 'manager' 
                  ? 'bg-blue-50 text-[#0056d2] font-black border border-blue-200/60' 
                  : 'text-slate-700 hover:bg-slate-100 hover:text-[#0056d2]'}
              `}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span>🖥️</span>
                <span className="truncate">Caja & Gerencia (Dueño)</span>
              </div>
            </Link>
          </div>
        </div>

        {/* PARTE INFERIOR: SWITCH DE MODO Y CERRAR SESIÓN */}
        <div className="pt-3 border-t border-[#e5e2e1] space-y-2 shrink-0 bg-white">
          <Link
            href="/customer/home"
            onClick={() => {
              setIsOpen(false)
              try { localStorage.setItem('vamo_active_role', 'customer') } catch {}
            }}
            className="flex items-center justify-between min-h-[44px] px-3 rounded-xl font-bold text-xs text-[#0056d2] bg-blue-50/80 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Modo Cliente (Comprar)</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

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
            className="flex items-center justify-center gap-2 min-h-[44px] w-full px-3 rounded-2xl font-black text-xs sm:text-sm text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
