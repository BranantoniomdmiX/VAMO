'use client'

import React from 'react'
import Link from 'next/link'
import { 
  ShieldCheck, 
  Globe, 
  Building2, 
  PlusCircle, 
  CreditCard, 
  Activity, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  Users,
  Radio,
  Inbox
} from 'lucide-react'
import { usePathname } from 'next/navigation'

interface SidebarAdminProps {
  activeTab: 'dashboard' | 'requests' | 'fleets' | 'new-fleet' | 'plans' | 'infrastructure' | 'crm' | 'control-tower'
}

export function SidebarAdmin({ activeTab }: SidebarAdminProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Maestro Global', route: '/admin/dashboard', icon: Globe },
    { id: 'requests', label: 'Bandeja de Solicitudes & KYC', route: '/admin/requests', icon: Inbox },
    { id: 'control-tower', label: 'Torre de Control (Meituan Style)', route: '/admin/control-tower', icon: Radio },
    { id: 'clearing', label: 'VAMO Clearing & Ledger', route: '/admin/clearing', icon: CreditCard },
    { id: 'crm', label: 'CRM Hyper-Local 360°', route: '/admin/crm', icon: Users },
    { id: 'fleets', label: 'Gestión de Tenants & Flotas', route: '/admin/fleets', icon: Building2 },
    { id: 'new-fleet', label: 'Alta Nueva Flota / Tenant', route: '/admin/new-fleet', icon: PlusCircle },
    { id: 'plans', label: 'Configuración de Planes SaaS', route: '/admin/plans', icon: CreditCard },
    { id: 'infrastructure', label: 'Monitor de Infraestructura', route: '/admin/infrastructure', icon: Activity }
  ]

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#e5e2e1] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#1c1b1b] text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base text-[#1c1b1b]">VAMO SuperAdmin</span>
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

      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-[#e5e2e1] 
        p-6 flex flex-col justify-between shadow-sm transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#f0eded]">
            <div className="w-12 h-12 rounded-full bg-[#1c1b1b] text-white flex items-center justify-center shadow-md flex-shrink-0 font-black">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#1c1b1b] leading-tight">
                VAMO SuperAdmin
              </h2>
              <p className="text-xs font-semibold text-[#737785]">Panel Maestro Global</p>
            </div>
          </div>

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
