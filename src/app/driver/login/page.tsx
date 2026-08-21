'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bike, Key, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react'
import { AuthService } from '@/lib/services/authService'

export default function DriverLoginPage() {
  const [phone, setPhone] = useState('')
  const [activationKey, setActivationKey] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!phone || phone.length < 10) {
      setErrorMsg('Ingresa un número de celular válido de 10 dígitos.')
      return
    }

    if (!activationKey) {
      setErrorMsg('Debes ingresar la llave de activación entregada por tu Franquiciatario.')
      return
    }

    const validation = AuthService.validateKey(activationKey)
    if (!validation.valid) {
      setErrorMsg(validation.message)
      return
    }

    AuthService.setActiveRole('DRIVER')
    setSuccessData(validation.message)

    setTimeout(() => {
      router.push('/driver/home')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] p-4 flex items-center justify-center font-sans">
      <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-lg space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black mx-auto shadow-sm border border-[#a7d600]">
            <Bike className="w-8 h-8" />
          </div>
          <span className="bg-[#0040a1] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase inline-block">
            VAMO CONDUCTOR &bull; ACCESO EXCLUSIVO
          </span>
          <h1 className="text-2xl font-black text-slate-900">Iniciar Turno</h1>
          <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
            Ingresa tu número celular y la Llave de Activación generada por tu Franquiciatario.
          </p>
        </div>

        {/* Notificaciones */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a] text-[#ba1a1a] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successData && (
          <div className="p-3.5 rounded-2xl bg-[#f5fff6] border border-[#34a853] text-[#1e8e3e] text-xs font-black flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successData}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Número de Celular (WhatsApp)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 461 123 4567"
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 block">Llave de Activación de Franquicia</label>
              <span className="text-[10px] text-blue-600 font-bold">Ej. CEL-4982</span>
            </div>
            <div className="relative">
              <Key className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                placeholder="Ingresa tu Llave"
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl pl-11 pr-4 py-3 text-sm font-mono font-black outline-none uppercase tracking-wider"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-4 rounded-full text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mt-2"
          >
            <span>ENTRAR A MI TURNO 🚀</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
          <p className="text-[11px] font-bold text-slate-600">¿Aún no tienes una Llave de Activación?</p>
          <p className="text-[10px] text-slate-400">
            Contacta al Franquiciatario VAMO de tu ciudad para darte de alta y recibir tu código de acceso.
          </p>
        </div>

      </div>
    </div>
  )
}
