'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Fingerprint, Key, CheckCircle2, AlertCircle, Loader2, ArrowRight, Store, Bike, Crown, Building2 } from 'lucide-react'
import { InviteService, OnboardingInvite } from '@/lib/services/inviteService'
import { PasskeyService } from '@/lib/services/passkeyService'
import { createClient } from '@/lib/supabase/client'

function JoinContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<OnboardingInvite | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Datos de registro
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [passkeyStatus, setPasskeyStatus] = useState<'idle' | 'registering' | 'done'>('idle')

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setErrorMsg('No se proporcionó ningún token de invitación. Solicita tu enlace de alta al Socio Comercial o Administrador.')
        setLoading(false)
        return
      }

      const res = await InviteService.validateToken(token)
      if (res.valid && res.invite) {
        setInvite(res.invite)
        if (res.invite.phoneOrEmail.includes('@')) {
          setEmail(res.invite.phoneOrEmail)
        } else {
          setPhone(res.invite.phoneOrEmail)
        }
      } else {
        setErrorMsg(res.error || 'Invitación inválida o expirada.')
      }
      setLoading(false)
    }
    checkToken()
  }, [token])

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password) {
      alert('Por favor completa todos los campos requeridos.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const supabase = createClient()
      
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role: invite?.targetRole || 'driver',
            owner_id: invite?.ownerId,
            is_verified: true,
            referred_by: token
          }
        }
      })

      if (authError && !authError.message.includes('already registered')) {
        throw authError
      }

      const userId = authData.user?.id || `usr-${Date.now()}`

      // 2. Registro Biométrico Opcional (Passkey)
      if (PasskeyService.isSupported()) {
        setPasskeyStatus('registering')
        await PasskeyService.registerPasskey({
          id: userId,
          email,
          name: fullName
        })
        setPasskeyStatus('done')
      }

      // 3. Consumir token de invitación
      await InviteService.consumeToken(token, userId)

      // 4. Guardar rol en localStorage para persistencia instantánea
      try {
        localStorage.setItem('vamo_active_role', invite?.targetRole || 'driver')
        localStorage.setItem('vamo_user_name', fullName)
      } catch {}

      setSuccess(true)

      // 5. Redireccionar al panel correspondiente
      setTimeout(() => {
        const roleRedirects: Record<string, string> = {
          owner: '/owner/dashboard',
          driver: '/driver/home',
          biz: '/biz',
          base: '/base/dispatch'
        }
        router.push(roleRedirects[invite?.targetRole || 'driver'] || '/driver/home')
      }, 2000)

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Ocurrió un error al procesar tu alta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleLabels: Record<string, { title: string; icon: any; color: string }> = {
    owner: { title: 'Socio Comercial (Plaza)', icon: Crown, color: 'bg-amber-500 text-white' },
    driver: { title: 'Conductor / Repartidor', icon: Bike, color: 'bg-[#c3f400] text-[#161e00]' },
    biz: { title: 'Comercio / Local Afiliado', icon: Store, color: 'bg-[#fddf33] text-[#726200]' },
    base: { title: 'Operador de Base', icon: Building2, color: 'bg-[#0040a1] text-white' }
  }

  const roleInfo = invite ? roleLabels[invite.targetRole] || roleLabels.driver : roleLabels.driver
  const RoleIcon = roleInfo.icon

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#0056d2]" />
        <h2 className="text-base font-black text-slate-800">Validando invitación autorizada...</h2>
        <p className="text-xs text-slate-500">Comprobando token criptográfico en el enclave VAMO.</p>
      </div>
    )
  }

  if (errorMsg && !invite) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-[32px] border border-rose-200 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black mx-auto text-2xl">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-slate-900">Acceso Operativo Restringido</h2>
          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
            {errorMsg}
          </p>
          <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 font-semibold border border-slate-200">
            🔒 El registro para Socios, Choferes y Comercios es <strong>100% privado y por invitación foliada</strong>.
          </div>
          <Link
            href="/auth/login"
            className="inline-block w-full bg-[#0056d2] text-white py-3.5 rounded-2xl font-black text-xs shadow-md hover:bg-[#0040a1] transition-all"
          >
            Ir a Inicio de Sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-lg w-full bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xl space-y-6">
        
        {/* Top Back Link */}
        <div className="flex justify-between items-center">
          <Link href="/customer/home" className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Volver a Inicio VAMO</span>
          </Link>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ONBOARDING VAMO</span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/logo-vamo.svg" alt="VAMO" className="h-10 sm:h-12 w-auto mx-auto object-contain" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase shadow-xs">
            <span className={`${roleInfo.color} px-2.5 py-0.5 rounded-full flex items-center gap-1`}>
              <RoleIcon className="w-3.5 h-3.5" />
              {roleInfo.title}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Bienvenido al Ecosistema VAMO</h1>
          <p className="text-xs text-slate-500 font-semibold">
            Completa tu registro seguro para activar tu puesto operativo y vincular tu huella / Face ID.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-300 p-6 rounded-2xl text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-black text-emerald-900">¡Alta Exitosa y Verificada!</h3>
            <p className="text-xs text-emerald-700 font-semibold">
              Tu cuenta ha sido activada y vinculada a tu plaza. Redirigiendo a tu espacio de trabajo...
            </p>
          </div>
        ) : (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">Nombre Completo o Razón Social</label>
              <input
                type="text"
                required
                placeholder="Ej. Carlos Mendoza"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#0056d2]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#0056d2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="Ej. 4611234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#0056d2]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">Contraseña de Respaldo</label>
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#0056d2]"
              />
            </div>

            {/* Aviso de Biometría */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3">
              <Fingerprint className="w-6 h-6 text-[#0056d2] shrink-0" />
              <div className="text-[11px] text-slate-700">
                <strong className="text-[#0056d2] block">Biometría Nativa (Passkeys)</strong>
                Al registrarte, tu dispositivo vinculará tu <strong>Huella / Face ID</strong> para entrar en 1-Tap.
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-4 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Configurando acceso biométrico...</span>
                </>
              ) : (
                <>
                  <span>ACTIVAR CUENTA & REGISTRAR HUELLA 👆</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056d2]" />
      </div>
    }>
      <JoinContent />
    </Suspense>
  )
}
