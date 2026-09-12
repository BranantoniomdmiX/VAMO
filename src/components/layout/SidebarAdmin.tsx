'use client'

import React from 'react'
import Link from 'next/link'
import { 
  LogOut, 
  ChevronRight, 
  Menu, 
  X
} from 'lucide-react'
import { VAMO_ROLE_CONFIGS } from './roleNavConfig'

export interface SidebarAdminProps {
  activeTab: 'dashboard' | 'requests' | 'map' | 'fleets' | 'new-fleet' | 'clearing' | 'control-tower' | 'infrastructure'
}

export function SidebarAdmin({ activeTab }: SidebarAdminProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const config = VAMO_ROLE_CONFIGS.superadmin
  const RoleIcon = config.icon

  return (
    <>
      {/* Topbar móvil / tablet / small laptop (< 1280px CSS) */}
      <div className="xl:hidden sticky top-0 z-40 bg-white border-b border-[#e5e2e1] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={config.homeRoute} className="flex items-center gap-2 shrink-0">
            <img src="/logo-vamo.svg" alt="VAMO" className="h-7 w-auto object-contain" />
          </Link>
          <div className="h-5 w-px bg-slate-300 shrink-0" />
          <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
            {config.roleTitle}
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-[48px] min-w-[48px] p-2.5 rounded-2xl bg-[#f0eded] text-[#1c1b1b] flex items-center justify-center cursor-pointer active:scale-95"
          aria-label={isOpen ? 'Cerrar navegación' : 'Abrir navegación'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 z-40 bg-black/50 xl:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Aside adaptable (Drawer < 1280px, Sidebar >= 1280px) */}
      <aside className={`
        fixed xl:sticky top-0 left-0 z-50 h-[100dvh] max-h-[100dvh] w-72 sm:w-80 xl:w-72 bg-white border-r border-[#e5e2e1] 
        p-4 sm:p-5 flex flex-col justify-between shadow-lg xl:shadow-xs transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
      `}>
        <div className="space-y-4 shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0040a1] text-white flex items-center justify-center shadow-xs shrink-0 font-black">
                <RoleIcon className="w-5 h-5 text-[#c3f400]" />
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight truncate">
                  {config.roleTitle}
                </h2>
                <p className="text-[11px] font-semibold text-slate-500 truncate">{config.roleSubtitle}</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="xl:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700"
              aria-label="Cerrar navegación"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1 pt-1 overflow-y-auto max-h-[calc(100dvh-180px)] scrollbar-thin" aria-label="Menú Superadmin">
            {config.items.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <Link
                  key={item.id}
                  href={item.route}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
                    ${isActive 
                      ? 'bg-[#0040a1] text-white shadow-xs font-black' 
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#0056d2]'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isActive ? 'text-[#c3f400]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-[#c3f400] shrink-0" />}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="pt-3 border-t border-[#e5e2e1] shrink-0">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 min-h-[44px] px-3 rounded-2xl font-black text-xs sm:text-sm text-rose-700 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
