'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { User, Lock, ArrowRight, ShieldCheck, ArrowLeft, Bike, Store, Building2, LayoutDashboard, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<'customer' | 'biz' | 'driver' | 'base' | 'owner' | 'admin'>('customer')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // 1. Intento de autenticación real con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        // Si hay error en Supabase, verificamos si es credencial inválida
        console.warn('⚠️ [Auth Login] Supabase response:', error.message)
        setErrorMessage(error.message === 'Invalid login credentials' 
          ? 'Correo o contraseña incorrectos. Verifica tus datos.' 
          : `Error de inicio de sesión: ${error.message}`)
        setIsLoading(false)
        return
      }

      if (data?.user) {
        // 2. Extraer rol desde app_metadata o user_metadata
        const appMetadata = data.user.app_metadata || {}
        const userRole = (appMetadata.user_role || data.user.user_metadata?.role || selectedRole) as string
        const isMaster = appMetadata.is_master === true

        // 3. Redirección automática según el rol verificado
        if (userRole === 'superadmin' || userRole === 'master' || isMaster) {
          router.push('/admin/dashboard')
        } else if (userRole === 'fleet_owner') {
          router.push('/owner/dashboard')
        } else if (userRole === 'dispatcher' || userRole === 'base_ops') {
          router.push('/base/radar')
        } else if (userRole === 'merchant' || userRole === 'biz') {
          router.push('/biz/kds')
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
        <span className="text-xs font-extrabold text-[#737785]">VAMO AUTH v2.0</span>
      </header>

      {/* Main Form Container */}
      <main className="max-w-md mx-auto w-full my-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0056d2] tracking-tight">
            ¡Bienvenido de vuelta! 👏
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#737785]">
            Ingresa tus credenciales para acceder a la plataforma VAMO
          </p>
        </div>

        {/* Formulario Login */}
        <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-5">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Selector de Rol */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Selecciona tu Rol de Acceso</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button" 
                onClick={() => setSelectedRole('customer')}
                className={`p-2.5 rounded-2xl border text-xs font-extrabold transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'customer' ? 'bg-[#0056d2] text-white border-[#0056d2]' : 'bg-[#f6f3f2] text-[#424654] border-transparent'
                }`}
              >
                <User className="w-4 h-4" /> Cliente
              </button>

              <button 
                type="button" 
                onClick={() => setSelectedRole('biz')}
                className={`p-2.5 rounded-2xl border text-xs font-extrabold transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'biz' ? 'bg-[#fddf33] text-[#726200] border-[#fddf33]' : 'bg-[#f6f3f2] text-[#424654] border-transparent'
                }`}
              >
                <Store className="w-4 h-4" /> Comercio
              </button>

              <button 
                type="button" 
                onClick={() => setSelectedRole('driver')}
                className={`p-2.5 rounded-2xl border text-xs font-extrabold transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'driver' ? 'bg-[#c3f400] text-[#161e00] border-[#c3f400]' : 'bg-[#f6f3f2] text-[#424654] border-transparent'
                }`}
              >
                <Bike className="w-4 h-4" /> Motocicleta
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Correo Electrónico</label>
            <input 
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Contraseña</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0056d2] hover:bg-[#0040a1] disabled:bg-[#0056d2]/70 text-white py-3.5 rounded-full font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>INICIANDO SESIÓN...</span>
              </>
            ) : (
              <>
                <span>INICIAR SESIÓN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Links de Registro Rápido */}
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold text-[#737785]">¿Aún no tienes cuenta en VAMO?</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs font-bold">
            <Link href="/auth/register-customer" className="text-[#0056d2] hover:underline">Registrarme como Cliente</Link>
            <span>&bull;</span>
            <Link href="/auth/register-biz" className="text-[#726200] hover:underline">Registrar Comercio</Link>
            <span>&bull;</span>
            <Link href="/auth/register-driver" className="text-[#161e00] hover:underline">Alta Motociclista</Link>
          </div>
        </div>

      </main>

      <footer className="text-center text-xs text-slate-400 font-medium pt-4">
        VAMO &bull; Tus datos y pedidos están protegidos
      </footer>
    </div>
  )
}
