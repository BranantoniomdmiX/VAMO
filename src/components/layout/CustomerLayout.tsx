'use client'

import React from 'react'
import Link from 'next/link'
import { Home, Compass, ShoppingBag, MapPin, User, Search, Bell, Tag, ListFilter, Package, Wallet } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { BackButton } from '@/components/ui/BackButton'
import { PushNotificationBanner } from '@/components/ui/PushNotificationBanner'

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { id: 'home', label: 'Inicio', route: '/customer/home', icon: Home },
    { id: 'tracking', label: 'Pedidos', route: '/customer/tracking', icon: Package },
    { id: 'wallet', label: 'Billetera', route: '/customer/wallet', icon: Wallet },
    { id: 'profile', label: 'Perfil', route: '/customer/profile', icon: User }
  ]

  const isHome = pathname === '/customer/home'

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] font-sans flex flex-col selection:bg-[#0056d2] selection:text-white">
      {/* Header Superior Omnicanal con Boton de Retroceso */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e5e2e1] px-4 md:px-8 py-3.5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          {!isHome && <BackButton label="Atrás" fallbackRoute="/customer/home" />}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-vamo.svg" alt="VAMO" className="h-10 sm:h-12 w-auto object-contain" />
            <span className="text-[#c3f400] text-xs bg-[#161e00] px-2.5 py-0.5 rounded-full font-black uppercase">Cliente</span>
          </Link>
        </div>

        {/* Buscador Rápido en PC (Oculto en /customer/radar porque ya tiene su propio buscador en el panel izquierdo) */}
        {!pathname.includes('/customer/radar') && (
          <div className="hidden sm:flex items-center gap-2 bg-[#f0eded] px-4 py-2 rounded-full w-full max-w-md border border-transparent focus-within:border-[#0056d2] transition-colors">
            <Search className="w-4 h-4 text-[#737785]" />
            <input 
              type="text" 
              placeholder="Buscar tacos, farmacias, mandados o tiendas..."
              className="bg-transparent text-xs font-semibold w-full outline-none text-[#1c1b1b]"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-[#f0eded] hover:bg-[#e5e2e1] text-[#1c1b1b] flex items-center justify-center transition-colors">
            <Bell className="w-5 h-5 text-[#0056d2]" />
          </button>
          <Link href="/" className="w-10 h-10 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-bold text-xs shadow-md">
            <User className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 pb-24 md:pb-12">
        <PushNotificationBanner role="customer" />
        {children}
      </main>


      {/* Navigation Bar Inferior Móvil / Tablet Sticky con Safe Area para iOS */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#e5e2e1] px-4 py-2 ios-safe-bottom flex justify-around items-center z-50 rounded-t-3xl shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.route || pathname.startsWith(item.route)
          return (
            <Link
              key={item.id}
              href={item.route}
              className={`flex flex-col items-center justify-center w-16 py-1 transition-all ${
                isActive ? 'text-[#0056d2] font-black scale-105' : 'text-[#737785] font-semibold hover:text-[#0056d2]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-[#0056d2]/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
