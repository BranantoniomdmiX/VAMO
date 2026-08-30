'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Phone, CheckCircle2, Lock, Loader2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterCustomerPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // 1. Registro real con Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone.trim(),
            role: 'customer',
          }
        }
      })

      if (error) {
        setErrorMessage(error.message)
        setIsLoading(false)
        return
      }

      // 2. Guardar perfil local / DB
      if (data?.user) {
        try {
          await supabase.from('user_profiles').upsert({
            id: data.user.id,
            full_name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            primary_role: 'customer',
          })
        } catch (dbErr) {
          console.warn('⚠️ [Profile creation note]:', dbErr)
        }
      }

      setSuccess(true)
      setTimeout(() => router.push('/customer/home'), 1200)
    } catch (err: any) {
      console.error('🚨 [Register Customer Error]:', err)
      setErrorMessage('Ocurrió un error inesperado al registrar la cuenta.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestAccess = () => {
    try {
      localStorage.setItem('vamo_guest_mode', 'true')
    } catch (e) {}
    router.push('/customer/home')
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] font-sans flex flex-col justify-between p-4 sm:p-8 selection:bg-[#0056d2] selection:text-white">
      <header className="max-w-md mx-auto w-full flex justify-between items-center">
        <Link href="/customer/home" className="flex items-center gap-2 bg-white border border-[#e5e2e1] px-4 py-2 rounded-full text-xs font-bold text-[#0056d2] w-fit shadow-sm hover:bg-[#f0eded]">
          <ArrowLeft className="w-4 h-4" /> Volver a Inicio VAMO
        </Link>
        <span className="text-xs font-extrabold text-[#737785]">CLIENTE VAMO</span>
      </header>

      <main className="max-w-md mx-auto w-full my-auto space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0056d2] tracking-tight">Registro de Cliente</h1>
          <p className="text-xs sm:text-sm font-semibold text-[#737785]">Crea tu cuenta en 1 minuto o pide directamente como invitado</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Nombre Completo</label>
            <input 
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Carlos Rodríguez"
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Teléfono WhatsApp</label>
            <input 
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ej. 555-123-4567"
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Correo Electrónico</label>
            <input 
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="carlos@gmail.com"
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Contraseña</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          {success ? (
            <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-full text-center font-black text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>¡CUENTA CREADA! ENTRANDO A VAMO...</span>
            </div>
          ) : (
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0056d2] hover:bg-[#0040a1] disabled:bg-[#0056d2]/70 text-white py-3.5 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>CREANDO CUENTA...</span>
                </>
              ) : (
                <>
                  <span>CREAR MI CUENTA GRATIS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {/* Opción de Modo Invitado */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGuestAccess}
              className="w-full bg-[#f6f3f2] hover:bg-[#eae6e5] text-[#424654] py-3 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#0056d2]" />
              <span>Continuar como Invitado (Sin registro ⚡)</span>
            </button>
          </div>
        </form>
      </main>

      <footer className="text-center text-xs font-semibold text-[#737785]">
        VAMO Logística Vecinal &bull; 2026
      </footer>
    </div>
  )
}

