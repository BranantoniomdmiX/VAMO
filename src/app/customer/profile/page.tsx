'use client'

import React from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import Link from 'next/link'
import { 
  User, 
  MapPin, 
  Bell, 
  ShieldCheck, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Phone, 
  Mail, 
  Heart,
  Gift,
  Share2
} from 'lucide-react'

export default function CustomerProfilePage() {
  const [profile] = React.useState({
    fullName: 'Carlos Mendoza',
    phone: '+52 (461) 123-4567',
    email: 'carlos.mendoza@gmail.com',
    memberSince: 'Agosto 2026',
    savedAddressesCount: 3,
    favoritePlacesCount: 8,
    referralCode: 'CARLOS-VAMO'
  })

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <span className="bg-[#0056d2]/10 text-[#0056d2] text-xs font-black px-3 py-1 rounded-full uppercase">
              MI CUENTA VAMO
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1c1b1b] mt-1">Perfil de Usuario</h1>
          </div>
        </header>

        {/* Tarjeta de Perfil Hero */}
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0040A1] to-[#0056D2] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
            CM
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#1c1b1b] truncate">{profile.fullName}</h2>
              <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                Verificado
              </span>
            </div>
            <p className="text-xs font-semibold text-[#737785] flex items-center gap-1 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-[#0056d2]" /> {profile.phone}
            </p>
            <p className="text-xs font-semibold text-[#737785] flex items-center gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-[#0056d2]" /> {profile.email}
            </p>
          </div>
        </div>

        {/* Banner Programa de Referidos (Punto 44 del Resumen Maestro) */}
        <div className="bg-[#161e00] text-[#c3f400] p-5 rounded-[24px] shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-[#c3f400]/70 tracking-wider">PROGRAMA DE REFERIDOS</span>
            <p className="text-sm font-extrabold text-white">Gana $50 por cada amigo que use tu código</p>
            <p className="text-xs text-slate-300 font-mono font-bold">Tu código: <span className="text-[#c3f400]">{profile.referralCode}</span></p>
          </div>
          <button className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-all">
            <Share2 className="w-4 h-4" />
            Compartir
          </button>
        </div>

        {/* Opciones y Ajustes de Cuenta */}
        <div className="bg-white rounded-[28px] border border-[#e5e2e1] shadow-sm overflow-hidden divide-y divide-[#f0eded]">
          
          <Link href="/customer/radar" className="p-4 flex items-center justify-between hover:bg-[#faf8f7] transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0056d2] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-extrabold text-[#1c1b1b] block group-hover:text-[#0056d2] transition-colors">
                  Direcciones Guardadas ({profile.savedAddressesCount})
                </strong>
                <span className="text-[11px] text-[#737785]">Casa, Trabajo, Domicilios frecuentes</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#737785] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/customer/radar?tab=promos" className="p-4 flex items-center justify-between hover:bg-[#faf8f7] transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-extrabold text-[#1c1b1b] block group-hover:text-[#0056d2] transition-colors">
                  Lugares & Comercios Favoritos ({profile.favoritePlacesCount})
                </strong>
                <span className="text-[11px] text-[#737785]">Acceso 1-tap a tus restaurantes y locales</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#737785] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/customer/wallet" className="p-4 flex items-center justify-between hover:bg-[#faf8f7] transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-extrabold text-[#1c1b1b] block group-hover:text-[#0056d2] transition-colors">
                  VAMO Puntos & Beneficios
                </strong>
                <span className="text-[11px] text-[#737785]">420 puntos listos para canjear en envíos</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#737785] group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="p-4 flex items-center justify-between hover:bg-[#faf8f7] transition-colors group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-extrabold text-[#1c1b1b] block group-hover:text-[#0056d2] transition-colors">
                  Notificaciones & Alertas en Vivo
                </strong>
                <span className="text-[11px] text-[#737785]">Avisos de motociclista y estado del pedido</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#737785]" />
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-[#faf8f7] transition-colors group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-extrabold text-[#1c1b1b] block group-hover:text-[#0056d2] transition-colors">
                  Centro de Ayuda & Reportar Incidencia
                </strong>
                <span className="text-[11px] text-[#737785]">Soporte directo con la Base Operativa</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#737785]" />
          </div>

        </div>

        {/* SECCIÓN CAMBIAR DE MODO OPERATIVO (ESTILO UBER / RAPPI) */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-[#737785] uppercase tracking-wider px-2 block">
            HERRAMIENTAS DE TRABAJO VAMO
          </span>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/driver/home"
              onClick={() => {
                try { localStorage.setItem('vamo_active_role', 'driver') } catch {}
              }}
              className="bg-white p-4 rounded-2xl border border-[#c3f400]/50 hover:border-[#c3f400] shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🛵
              </div>
              <div>
                <strong className="text-xs font-black text-[#1c1b1b] block">Modo Conductor</strong>
                <span className="text-[10px] text-[#737785] font-semibold">Entrar a Repartir</span>
              </div>
            </Link>

            <Link
              href="/biz"
              onClick={() => {
                try { localStorage.setItem('vamo_active_role', 'merchant') } catch {}
              }}
              className="bg-white p-4 rounded-2xl border border-[#fddf33]/50 hover:border-[#fddf33] shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#fddf33] text-[#726200] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🏪
              </div>
              <div>
                <strong className="text-xs font-black text-[#1c1b1b] block">Modo Comercio</strong>
                <span className="text-[10px] text-[#737785] font-semibold">Gestionar Local</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Botón Cerrar Sesión */}
        <Link
          href="/auth/login"
          className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Link>

      </div>
    </CustomerLayout>
  )
}
