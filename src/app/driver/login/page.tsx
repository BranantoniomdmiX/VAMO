'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bike, Key, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, Fingerprint, Loader2 } from 'lucide-react'
import { AuthService } from '@/lib/services/authService'
import { PasskeyService } from '@/lib/services/passkeyService'

export default function DriverLoginPage() {
  const [phone, setPhone] = useState('')
  const [activationKey, setActivationKey] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<string | null>(null)
  const [isBiometricLoading, setIsBiometricLoading] = useState(false)
  const router = useRouter()

  // Comprobar si ya tiene sesión o Passkey configurada
  useEffect(() => {
    try {
      const activeRole = localStorage.getItem('vamo_active_role')
      if (activeRole === 'driver' || activeRole === 'DRIVER') {
        router.replace('/driver/home')
      }
    } catch {}
  }, [router])

  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true)
    setErrorMsg(null)

    try {
      const res = await PasskeyService.authenticateWithPasskey()
      if (res.success) {
        AuthService.setActiveRole('DRIVER')
        setSuccessData('¡Identidad biométrica confirmada! Ingresando a tu turno...')
        setTimeout(() => router.push('/driver/home'), 1200)
      } else {
        setErrorMsg(res.error || 'No se completó la verificación biométrica.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error con el sensor biométrico.')
    } finally {
      setIsBiometricLoading(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!phone || phone.length < 10) {
      setErrorMsg('Ingresa un número de celular válido de 10 dígitos.')
      return
    }

    if (!activationKey) {
      setErrorMsg('Debes ingresar la llave de activación entregada por tu Socio Comercial.')
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
      <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-lg space-y-5">
        
        {/* Header con Logo Oficial Conductor */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <img 
              src="/logos/logo-driver.png" 
              alt="VAMO Conductor" 
              className="h-20 sm:h-24 w-auto object-contain rounded-2xl shadow-md border border-[#0056d2]/20" 
            />
          </div>
          <span className="bg-[#0040a1] text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase inline-block shadow-sm">
            VAMO CONDUCTOR &bull; ACCESO EXCLUSIVO
          </span>
          <h1 className="text-2xl font-black text-slate-900">Iniciar Turno</h1>
          <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
            Accede con tu huella dactilar registrada o ingresa tu Llave de Activación.
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

        {/* Botón Biométrico 1-Tap Passkeys */}
        <div className="bg-[#161e00] p-4 rounded-2xl border border-[#c3f400]/40 text-white space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Fingerprint className="w-5 h-5 text-[#c3f400] shrink-0" />
            <div>
              <span className="text-[10px] font-black text-[#c3f400] uppercase block">ACCESO RÁPIDO BIOMÉTRICO</span>
              <strong className="text-xs font-black text-white">Sensor de Huella / Face ID</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={isBiometricLoading}
            className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs cursor-pointer disabled:bg-slate-300"
          >
            {isBiometricLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Leyendo sensor...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <span>ENTRAR CON HUELLA / FACE ID 👆</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
          <div className="flex-1 h-px bg-slate-200" />
          <span>O LLAVE DE ACTIVACIÓN</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Número de Celular (WhatsApp)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 461 123 4567"
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-xs font-bold outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 block">Llave de Activación de tu Plaza</label>
              <span className="text-[10px] text-blue-600 font-bold">Ej. CEL-4982</span>
            </div>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                placeholder="Ingresa tu Llave"
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl pl-10 pr-4 py-3 text-xs font-mono font-black outline-none uppercase tracking-wider"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mt-1"
          >
            <span>ENTRAR CON LLAVE 🚀</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center space-y-0.5">
          <p className="text-[11px] font-bold text-slate-600">¿Aún no tienes una Llave o Invitación?</p>
          <p className="text-[10px] text-slate-400">
            Contacta al Socio Comercial VAMO de tu ciudad para recibir tu enlace o código de acceso.
          </p>
        </div>

      </div>
    </div>
  )
}
