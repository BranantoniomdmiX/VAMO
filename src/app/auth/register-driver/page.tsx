'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bike, Camera, CheckCircle2, Building2, UserCheck, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RegisterDriverPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [license, setLicense] = useState('')
  const [registrationMode, setRegistrationMode] = useState<'independent' | 'fleet'>('fleet')
  const [fleetCode, setFleetCode] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(true)
    setTimeout(() => router.push('/driver/home'), 1200)
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] font-sans flex flex-col justify-between p-4 sm:p-8 selection:bg-[#0056d2] selection:text-white">
      <header className="max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 bg-white border border-[#e5e2e1] px-4 py-2 rounded-full text-xs font-bold text-[#0056d2] w-fit shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Inicio V-PORTAL
        </Link>
      </header>

      <main className="max-w-md mx-auto w-full my-auto space-y-5">
        <div className="text-center space-y-1">
          <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase">
            UNETE COMO MOTOCICLISTA
          </span>
          <h1 className="text-2xl font-extrabold text-[#1c1b1b]">Alta de Conductor / Rider</h1>
          <p className="text-xs font-semibold text-[#737785]">Gana dinero repartiendo pedidos en tu localidad</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4">
          
          {/* Modalidad de Registro: Flotilla vs Directo */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Modalidad de Alta</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRegistrationMode('fleet')}
                className={`p-3 rounded-2xl border text-xs font-extrabold transition-all flex flex-col items-center gap-1.5 text-center ${
                  registrationMode === 'fleet'
                    ? 'bg-[#0056d2] text-white border-[#0056d2] shadow-sm'
                    : 'bg-[#f6f3f2] text-[#424654] border-transparent'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>Dado de alta por Flotilla 🏢</span>
              </button>

              <button
                type="button"
                onClick={() => setRegistrationMode('independent')}
                className={`p-3 rounded-2xl border text-xs font-extrabold transition-all flex flex-col items-center gap-1.5 text-center ${
                  registrationMode === 'independent'
                    ? 'bg-[#c3f400] text-[#161e00] border-[#c3f400] shadow-sm'
                    : 'bg-[#f6f3f2] text-[#424654] border-transparent'
                }`}
              >
                <Bike className="w-5 h-5" />
                <span>Chofer Independiente 🏍️</span>
              </button>
            </div>
          </div>

          {registrationMode === 'fleet' && (
            <div className="bg-[#0056d2]/5 p-3 rounded-2xl border border-[#0056d2]/20 space-y-1 text-xs text-[#0056d2]">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Validado por Dueño de Flota</span>
              </div>
              <p className="text-[11px] text-[#737785] font-medium">
                Tu alta será vinculada al panel del Dueño de Flotilla para control de equipamiento y nómina.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Nombre Completo</label>
            <input 
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Carlos Ruiz M."
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Teléfono de Contacto</label>
            <input 
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ej. 555-987-6543"
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Número de Licencia de Conducir</label>
            <input 
              type="text"
              value={license}
              onChange={e => setLicense(e.target.value)}
              placeholder="Ej. LIC-8942-MX"
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          {success ? (
            <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-full text-center font-black text-xs flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5" />
              <span>¡ALTA COMPLETADA! ENTRANDO AUTOMÁTICAMENTE A APP MOTOCICLISTA...</span>
            </div>
          ) : (
            <button 
              type="submit"
              className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3.5 rounded-full font-black text-xs shadow-md active:scale-95 transition-all"
            >
              COMPLETAR ALTA E INGRESAR DIRECTO 🏍️
            </button>
          )}
        </form>
      </main>

      <footer className="text-center text-xs font-semibold text-[#737785]">
        VAMO Rider Partner &bull; 2026
      </footer>
    </div>
  )
}
