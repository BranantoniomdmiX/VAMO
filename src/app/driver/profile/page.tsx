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
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black text-xs shadow-xs border-2 border-white">
              ★
            </div>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">{driverData.name}</h2>
            <p className="text-xs font-bold text-slate-500">{driverData.baseFleet}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="bg-[#f0f4ff] p-2.5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Nivel</span>
              <strong className="text-xs font-black text-[#0056d2]">ORO 🏆</strong>
            </div>
            <div className="bg-[#f0f4ff] p-2.5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Rating</span>
              <strong className="text-xs font-black text-amber-600">{driverData.rating}</strong>
            </div>
            <div className="bg-[#f0f4ff] p-2.5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Viajes</span>
              <strong className="text-xs font-black text-slate-900">{driverData.totalTrips}</strong>
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

        {/* Botón Cerrar Sesión */}
        <Link
          href="/"
          className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión del Conductor</span>
        </Link>

      </div>
    </MobileDriverLayout>
  )
}
