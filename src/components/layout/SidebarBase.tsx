'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Radio, 
  PhoneCall, 
  Map, 
  DollarSign, 
  Package, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  ShieldCheck
} from 'lucide-react'
import { usePathname } from 'next/navigation'

interface SidebarBaseProps {
  activeTab: 'radar' | 'dispatch' | 'call' | 'cashier' | 'warehouse'
}

export function SidebarBase({ activeTab }: SidebarBaseProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const navItems = [
    { id: 'radar', label: 'Radar Operativo Macro', route: '/base/radar', icon: Map },
    { id: 'dispatch', label: 'Consola de Despacho', route: '/base/dispatch', icon: Radio },
    { id: 'call', label: 'Registro Telefónico', route: '/base/call-register', icon: PhoneCall },
    { id: 'cashier', label: 'Caja Física y Corte', route: '/base/cashier', icon: DollarSign },
    { id: 'warehouse', label: 'Control de Almacén', route: '/base/warehouse', icon: Package }
  ]

  return (
    <>
      {/* Botón Hamburguesa Móvil / Tablet */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#e5e2e1] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#1c1b1b] text-[#c3f400] flex items-center justify-center font-bold">
            <Radio className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base text-[#1c1b1b]">VAMO Base Control</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-[#f0eded] text-[#1c1b1b]"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Base Control (Celulares, Tabletas y PC) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-[#e5e2e1] 
        p-6 flex flex-col justify-between shadow-sm transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Header de la Base */}
          <div className="flex items-center gap-3 pb-4 border-b border-[#f0eded]">
            <div className="w-12 h-12 rounded-full bg-[#1c1b1b] text-[#c3f400] flex items-center justify-center shadow-md flex-shrink-0 font-black">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#1c1b1b] leading-tight">
                Centro de Despacho
              </h2>
              <p className="text-xs font-semibold text-[#737785]">Base Operativa VAMO</p>
            </div>
          </div>

          {/* Enlace Rápido Alta Telefónica */}
          <Link
            href="/base/call-register"
            onClick={() => setIsOpen(false)}
            className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white h-12 rounded-full font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#0056d2]/20 active:scale-95 transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>+ PEDIDO TELEFÓNICO</span>
          </Link>

          {/* Enlaces Nativos Base */}
          <nav className="space-y-2 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <Link
                  key={item.id}
                  href={item.route}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center justify-between p-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
                    ${isActive 
                      ? 'bg-[#1c1b1b] text-[#c3f400] shadow-sm font-extrabold' 
                      : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#c3f400]' : 'text-[#0056d2]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-[#c3f400]" />}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="pt-4 border-t border-[#e5e2e1]">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3.5 rounded-2xl font-bold text-xs sm:text-sm text-[#ba1a1a] hover:bg-[#ffdad6]/60 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
