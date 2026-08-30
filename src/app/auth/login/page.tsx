'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { User, Lock, ArrowRight, ShieldCheck, ArrowLeft, Bike, Store, Building2, LayoutDashboard, Loader2, AlertCircle, Fingerprint, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PasskeyService } from '@/lib/services/passkeyService'

export default function AuthLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<'customer' | 'biz' | 'driver' | 'base' | 'owner' | 'admin'>('customer')
  const [isLoading, setIsLoading] = useState(false)
  const [isBiometricLoading, setIsBiometricLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // 1. Inicio de Sesión Biométrico 1-Tap (WebAuthn / Passkeys)
  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true)
    setErrorMessage(null)

    try {
      const res = await PasskeyService.authenticateWithPasskey()
      if (res.success) {
        // Redireccionar al rol activo guardado o al panel correspondiente
        const activeRole = localStorage.getItem('vamo_active_role') || 'driver'
        const roleRedirects: Record<string, string> = {
          superadmin: '/admin/dashboard',
          owner: '/owner/dashboard',
          fleet_owner: '/owner/dashboard',
          driver: '/driver/home',
          biz: '/biz',
          merchant: '/biz',
          base: '/base/dispatch',
          customer: '/customer/home'
        }
        router.push(roleRedirects[activeRole] || '/customer/home')
      } else {
        setErrorMessage(res.error || 'No se completó la verificación biométrica.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error con el sensor biométrico.')
    } finally {
      setIsBiometricLoading(false)
    }
  }

  // 2. Inicio Tradicional con Contraseña
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        console.warn('⚠️ [Auth Login] Supabase response:', error.message)
        setErrorMessage(error.message === 'Invalid login credentials' 
          ? 'Correo o contraseña incorrectos. Verifica tus datos.' 
          : `Error de inicio de sesión: ${error.message}`)
        setIsLoading(false)
        return
      }

      if (data?.user) {
        const appMetadata = data.user.app_metadata || {}
        const userRole = (appMetadata.user_role || data.user.user_metadata?.role || selectedRole) as string
        const isMaster = appMetadata.is_master === true

        // Guardar para persistencia biométrica posterior
        try {
          localStorage.setItem('vamo_active_role', userRole)
        } catch {}

        if (userRole === 'superadmin' || userRole === 'master' || isMaster) {
          router.push('/admin/dashboard')
        } else if (userRole === 'fleet_owner' || userRole === 'owner') {
          router.push('/owner/dashboard')
        } else if (userRole === 'dispatcher' || userRole === 'base_ops' || userRole === 'base') {
          router.push('/base/dispatch')
        } else if (userRole === 'merchant' || userRole === 'biz') {
          router.push('/biz')
        } else if (userRole === 'driver') {
          router.push('/driver/home')
        } else {
          router.push('/customer/home')
        }
        return
      }
    } catch (err: any) {
      console.error('🚨 [Auth Login Error]:', err)
      setErrorMessage('Ocurrió un error inesperado al conectar con el servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] font-sans flex flex-col justify-between p-4 sm:p-8 lg:p-12 selection:bg-[#0056d2] selection:text-white">
      
      {/* Top Header */}
      <header className="max-w-md mx-auto w-full flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 bg-white border border-[#e5e2e1] px-4 py-2 rounded-full text-xs font-bold text-[#0056d2] shadow-sm hover:bg-[#f0eded]">
          <ArrowLeft className="w-4 h-4" /> Inicio V-PORTAL
        </Link>
        <span className="text-xs font-extrabold text-[#737785]">VAMO AUTH v2.0 &bull; Biometría FIDO2</span>
      </header>

      {/* Main Form Container */}
      <main className="max-w-md mx-auto w-full my-auto space-y-5">
        <div className="text-center space-y-1.5">
          <img src="/logo-vamo.svg" alt="VAMO" className="h-10 sm:h-12 w-auto mx-auto object-contain mb-1" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0056d2] tracking-tight">
            Acceso Seguro al Sistema
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#737785]">
            Inicia con tu huella dactilar / Face ID o credenciales autorizadas
          </p>
        </div>

        {/* Botón Destacado: INICIO BIOMÉTRICO 1-TAP (PASSEYS) */}
        <div className="bg-[#161e00] text-white p-5 rounded-[28px] border border-[#c3f400]/40 shadow-lg space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#c3f400] uppercase tracking-wider block">ACCESO BIOMÉTRICO ZERO-TRUST</span>
              <strong className="text-sm font-black text-white">Face ID / Huella Dactilar</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={isBiometricLoading}
            className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer disabled:bg-slate-300"
          >
            {isBiometricLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando sensor biométrico...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-5 h-5" />
                <span>ENTRAR CON HUELLA / FACE ID 👆</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
          <div className="flex-1 h-px bg-slate-200" />
          <span>O ACCESO CON CORREO</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Formulario Login Tradicional */}
        <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#1c1b1b]">Correo Electrónico</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full p-3 rounded-2xl bg-[#f6f3f2] border border-transparent focus:border-[#0056d2] focus:bg-white text-xs font-bold outline-none transition-all"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#1c1b1b]">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-2xl bg-[#f6f3f2] border border-transparent focus:border-[#0056d2] focus:bg-white text-xs font-bold outline-none transition-all"
            />
          </div>

          {/* Botón Enviar */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:bg-slate-300"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Acceso Rápido Modo Invitado Cliente */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-2">
          <span className="text-xs text-slate-500 font-semibold block">¿Solo deseas pedir un mandado o comida?</span>
          <Link
            href="/customer/home"
            className="inline-flex items-center justify-center gap-1.5 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-extrabold transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#0056d2]" />
            <span>Navegar como Invitado (Sin Registro) 🛍️</span>
          </Link>
        </div>

      </main>

      <footer className="text-center text-xs text-slate-400 font-medium pt-4">
        VAMO &bull; Infraestructura Segura Zero-Trust &bull; WebAuthn Passkeys
      </footer>
    </div>
  )
}
