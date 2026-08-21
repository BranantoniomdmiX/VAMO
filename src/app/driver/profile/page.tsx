'use client'

import React, { useState, useEffect } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { 
  User, 
  Bike, 
  Phone, 
  ShieldCheck, 
  Award, 
  Star, 
  FileText, 
  Settings, 
  Volume2, 
  Package, 
  LogOut, 
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function DriverProfilePage() {
  const [driverData, setDriverData] = useState({
    name: 'Carlos Mendoza',
    phone: '461-987-6543',
    email: 'carlos.mendoza@vamo.app',
    motorcycle: 'Italika FT150 (Negra)',
    plates: 'GTO-842-X',
    level: 'NIVEL ORO',
    rating: '4.9 ★',
    totalTrips: 342,
    baseFleet: 'Flota Centro Titular',
    status: 'Activo / Certificado'
  })

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [heavyCargoEnabled, setHeavyCargoEnabled] = useState(true)
  const [autoAccept, setAutoAccept] = useState(false)

  return (
    <MobileDriverLayout>
      <div className="p-5 space-y-6 pb-6">
        
        {/* Header Perfil */}
        <header className="text-center pt-2 space-y-1">
          <span className="bg-[#0056d2] text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
            PERFIL DEL CONDUCTOR
          </span>
          <h1 className="text-xl font-extrabold text-slate-900">Mi Cuenta Socio VAMO</h1>
        </header>

        {/* Tarjeta de Identidad & Nivel */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200 shadow-xs space-y-4 text-center">
          <div className="relative w-20 h-20 mx-auto">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop" 
              alt="Foto Conductor" 
              className="w-full h-full rounded-full object-cover border-4 border-[#0056d2] shadow-md"
            />
            <span className="absolute bottom-0 right-0 bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#161e00] shadow-xs">
              4.9 ★
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">{driverData.name}</h2>
            <p className="text-xs font-bold text-slate-500">{driverData.phone} &bull; {driverData.baseFleet}</p>
          </div>

          <div className="flex justify-center gap-2">
            <span className="bg-[#0040a1] text-white text-xs font-black px-3 py-1 rounded-full uppercase">
              {driverData.level}
            </span>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
              {driverData.status}
            </span>
          </div>
        </div>

        {/* MÓDULO LLAVE DE RECOMENDACIÓN & BONOS POR LOCALES AFILIADOS */}
        <div className="bg-[#161e00] text-white p-5 rounded-[28px] border border-[#c3f400]/40 shadow-md space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full uppercase">
              PROGRAMA DE RECOMENDACIÓN
            </span>
            <span className="text-xs font-black text-[#c3f400]">+$150 MXN / LOCAL</span>
          </div>

          <div>
            <h3 className="text-sm font-black text-white">Tu Llave de Recomendación de Locales</h3>
            <p className="text-[11px] text-slate-300 font-semibold mt-0.5">
              Recomienda taquerías, farmacias o comercios. Cuando se afilien con tu código, ganas <strong className="text-[#c3f400]">$150 MXN en efectivo + 50 Puntos VAMO</strong>.
            </p>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-300 block uppercase">CÓDIGO EXCLUSIVO:</span>
              <strong className="font-mono text-base font-black text-[#c3f400]">MOTO-CARLOS-77</strong>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText('MOTO-CARLOS-77')
                alert('¡Código MOTO-CARLOS-77 copiado! Compártelo con el dueño del negocio.')
              }}
              className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] text-xs font-black px-3.5 py-2 rounded-full active:scale-95 transition-transform"
            >
              Copiar Código 📋
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold pt-1">
            <div className="bg-white/5 p-2 rounded-xl border border-white/10">
              <span className="text-[#c3f400] text-base font-black block">2 Locales</span>
              <span className="text-[10px] text-slate-300">Afiliados por ti</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/10">
              <span className="text-[#c3f400] text-base font-black block">$300.00 MXN</span>
              <span className="text-[10px] text-slate-300">Ganados en Bonos</span>
            </div>
          </div>
        </div>

        {/* Datos del Vehículo */}
        <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Bike className="w-4 h-4 text-[#0056d2]" />
            <span>Vehículo Registrado</span>
          </h3>

          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Motocicleta:</span>
            <span className="text-slate-900">{driverData.motorcycle}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Placas de Circulación:</span>
            <span className="text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded-md">{driverData.plates}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Estado de Operación:</span>
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {driverData.status}
            </span>
          </div>
        </div>

        {/* Documentación & Validación Oficial */}
        <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-xs space-y-2.5">
          <h3 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-[#0056d2]" />
            <span>Documentación & Seguros</span>
          </h3>

          {[
            { label: 'Licencia de Conducir Tipo Moto', status: 'Vigente hasta 2028' },
            { label: 'Tarjeta de Circulación', status: 'Verificada' },
            { label: 'Póliza de Seguro de Cobertura Amplia', status: 'Activa' }
          ].map((doc, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs py-1">
              <span className="text-slate-700 font-medium">{doc.label}</span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                ✓ {doc.status}
              </span>
            </div>
          ))}
        </div>

        {/* Preferencias de Trabajo en Ruta */}
        <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Settings className="w-4 h-4 text-[#0056d2]" />
            <span>Ajustes de Ruta</span>
          </h3>

          {/* Sonido de Alertas */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">Alertas Sonoras (TTS / Chime)</span>
              <span className="text-[10px] text-slate-500 font-medium">Anunciar pedidos en altavoz</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors ${soundEnabled ? 'bg-[#0056d2]' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-xs transition-all duration-200 ${soundEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {/* Pedidos con Carga Pesada */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">Parrilla para Carga / Ferretería</span>
              <span className="text-[10px] text-slate-500 font-medium">Recibir encargos de hasta 20kg</span>
            </div>
            <button
              onClick={() => setHeavyCargoEnabled(!heavyCargoEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors ${heavyCargoEnabled ? 'bg-[#0056d2]' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-xs transition-all duration-200 ${heavyCargoEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* SECCIÓN CAMBIAR DE ROL / HERRAMIENTAS (MODO CLIENTE & DUEÑO DE FLOTA) */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-[#737785] uppercase tracking-wider px-2 block">
            CAMBIAR DE ROL OPERATIVO
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/customer/home"
              onClick={() => {
                try { localStorage.setItem('vamo_active_role', 'customer') } catch {}
              }}
              className="bg-white p-3.5 rounded-2xl border border-blue-200 hover:border-[#0056d2] shadow-xs flex flex-col items-center text-center gap-1.5 group active:scale-95 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0056d2] text-white flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                👤
              </div>
              <div>
                <strong className="text-xs font-black text-[#1c1b1b] block">Modo Cliente</strong>
                <span className="text-[9px] text-[#737785] font-semibold">Pedir y Comprar</span>
              </div>
            </Link>

            <Link
              href="/owner/dashboard"
              onClick={() => {
                try { localStorage.setItem('vamo_active_role', 'fleet_owner') } catch {}
              }}
              className="bg-white p-3.5 rounded-2xl border border-amber-200 hover:border-amber-500 shadow-xs flex flex-col items-center text-center gap-1.5 group active:scale-95 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                👑
              </div>
              <div>
                <strong className="text-xs font-black text-[#1c1b1b] block">Dueño de Flota</strong>
                <span className="text-[9px] text-[#737785] font-semibold">Mis Motos & Finanzas</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Botón Cerrar Sesión */}
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem('vamo_active_role')
              localStorage.removeItem('vamo_user_session')
            } catch {}
            window.location.href = '/customer/home'
          }}
          className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>


      </div>
    </MobileDriverLayout>
  )
}
