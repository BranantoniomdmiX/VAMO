'use client'

import React from 'react'
import Link from 'next/link'
import { Bike, Package, Wallet, User, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { BackButton } from '@/components/ui/BackButton'

export function MobileDriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { id: 'home', label: 'Inicio', route: '/driver/home', icon: Home },
    { id: 'offer', label: 'Ofertas', route: '/driver/offer', icon: Package },
    { id: 'wallet', label: 'Billetera', route: '/driver/wallet', icon: Wallet },
    { id: 'profile', label: 'Perfil', route: '/driver/profile', icon: User }
  ]

  const isHome = pathname === '/driver/home'

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-0 sm:p-4 font-sans selection:bg-[#c3f400] selection:text-[#161e00]">
      <div className="w-full max-w-[440px] h-screen sm:h-[860px] bg-white sm:rounded-[40px] border-0 sm:border-8 border-[#e5e2e1] shadow-[0_25px_60px_-15px_rgba(0,86,210,0.15)] flex flex-col relative overflow-hidden">
        
        {/* Subheader Movil con Boton de Retroceso */}
        {!isHome && (
          <div className="bg-[#0056d2] px-4 py-2 flex items-center justify-between text-white">
            <BackButton label="Regresar" fallbackRoute="/driver/home" />
            <span className="text-[10px] font-black uppercase tracking-wider">VAMO RIDER</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-20">
          {children}
        </div>

        <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-[#e5e2e1] px-4 py-2 flex justify-around items-center z-50 rounded-t-3xl shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.route
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
    </div>
  )
}
