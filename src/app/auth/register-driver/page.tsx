'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bike, Camera, CheckCircle2, Building2, UserCheck, ShieldCheck, Lock, Mail, Loader2, AlertCircle, QrCode, FileText, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterDriverPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [license, setLicense] = useState('')
  const [registrationMode, setRegistrationMode] = useState<'independent' | 'fleet'>('fleet')
  const [fleetCode, setFleetCode] = useState('')
  const [licensePhotoUrl, setLicensePhotoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [statusNote, setStatusNote] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      let franchiseId: string | null = null
      let baseId: string | null = null

      // 1. Si eligió Flota / Socio Operador, validar código
      if (registrationMode === 'fleet') {
        if (!fleetCode.trim()) {
          setErrorMessage('Por favor introduce el código proporcionado por tu Socio Operador.')
          setIsLoading(false)
          return
        }

        const { data: codeData, error: codeErr } = await supabase
          .from('franchise_join_codes')
          .select('*')
          .eq('code', fleetCode.trim().toUpperCase())
          .eq('is_active', true)
          .maybeSingle()

        if (codeErr || !codeData) {
          setErrorMessage('El código de flota no es válido o ha expirado. Verifica con tu Socio Operador.')
          setIsLoading(false)
          return
        }

        franchiseId = codeData.franchise_id
        baseId = codeData.base_id
      }

      // 2. Crear usuario en Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone.trim(),
            role: 'driver',
            registration_mode: registrationMode,
          }
        }
      })

      if (authErr) {
        setErrorMessage(authErr.message)
        setIsLoading(false)
        return
      }

      const userId = authData.user?.id

      if (userId) {
        // 3. Crear o actualizar perfil en user_profiles
        try {
          await supabase.from('user_profiles').upsert({
            id: userId,
            full_name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            primary_role: 'driver',
            franchise_id: franchiseId,
            base_id: baseId,
          })
        } catch (e) {
          console.warn('⚠️ [Profile error]:', e)
        }

        // 4. Registrar en tabla riders
        const riderCode = `R-${Math.floor(1000 + Math.random() * 9000)}`
        const isIndependent = registrationMode === 'independent'

        try {
          await supabase.from('riders').upsert({
            id: userId,
            rider_code: riderCode,
            vehicle_plate: license.trim(),
            status: isIndependent ? 'offline' : 'disponible',
            kyc_status: isIndependent ? 'PENDING' : 'APPROVED',
          })
        } catch (e) {
          console.warn('⚠️ [Rider entry note]:', e)
        }
      }

      setSuccess(true)
      if (registrationMode === 'independent') {
        setStatusNote('Tu solicitud ha sido enviada al Superadministrador Branmix para validación de documentos.')
        setTimeout(() => router.push('/driver/home'), 2500)
      } else {
        setStatusNote('¡Alta vinculada con éxito a tu Flotilla! Entrando a la consola...')
        setTimeout(() => router.push('/driver/home'), 1200)
      }
    } catch (err: any) {
      console.error('🚨 [Register Driver Error]:', err)
      setErrorMessage('Ocurrió un error al procesar el registro de conductor.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] font-sans flex flex-col justify-between p-4 sm:p-8 selection:bg-[#0056d2] selection:text-white">
      <header className="max-w-md mx-auto w-full flex justify-between items-center">
        <Link href="/auth/login" className="flex items-center gap-2 bg-white border border-[#e5e2e1] px-4 py-2 rounded-full text-xs font-bold text-[#0056d2] w-fit shadow-sm hover:bg-[#f0eded]">
          <ArrowLeft className="w-4 h-4" /> Volver a Login
        </Link>
        <span className="text-xs font-extrabold text-[#737785]">RIDER PARTNER</span>
      </header>

      <main className="max-w-md mx-auto w-full my-auto space-y-5">
        <div className="text-center space-y-1">
          <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase">
            ÚNETE COMO MOTOCICLISTA
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c1b1b] tracking-tight">Alta de Conductor / Rider</h1>
          <p className="text-xs sm:text-sm font-semibold text-[#737785]">Genera ingresos repartiendo con la red logística VAMO</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

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
                <span>Socio Operador / Flota 🏢</span>
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

          {registrationMode === 'fleet' ? (
            <div className="space-y-2 bg-[#0056d2]/5 p-3.5 rounded-2xl border border-[#0056d2]/20 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#0056d2]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Vinculación con Socio Operador</span>
              </div>
              <p className="text-[11px] text-[#737785] font-medium">
                Introduce el código alfanumérico o escanea el QR generado por tu Socio Operador:
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={fleetCode}
                  onChange={e => setFleetCode(e.target.value.toUpperCase())}
                  placeholder="Ej. VAMO-CEL-001"
                  required
                  className="w-full bg-white border border-[#0056d2]/30 focus:border-[#0056d2] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0056d2] uppercase tracking-wider outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 bg-[#c3f400]/10 p-3.5 rounded-2xl border border-[#c3f400]/30 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#161e00]">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Revisión de Documentación</span>
              </div>
              <p className="text-[11px] text-[#737785] font-medium">
                Tu solicitud será enviada a la bandeja del Superadministrador Branmix para aprobación.
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
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Teléfono WhatsApp</label>
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
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Correo Electrónico</label>
            <input 
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="carlos.rider@gmail.com"
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

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Placas o Licencia de Conducir</label>
            <input 
              type="text"
              value={license}
              onChange={e => setLicense(e.target.value)}
              placeholder="Ej. LIC-8942-MX / PLACA-77B"
              required
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          {success ? (
            <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-2xl text-center font-bold text-xs space-y-1 animate-bounce">
              <div className="flex items-center justify-center gap-1.5 font-black">
                <CheckCircle2 className="w-5 h-5" />
                <span>¡ALTA COMPLETADA!</span>
              </div>
              <p className="text-[11px] font-semibold">{statusNote}</p>
            </div>
          ) : (
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#c3f400] hover:bg-[#abd600] disabled:bg-[#c3f400]/70 text-[#161e00] py-3.5 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#161e00]" />
                  <span>PROCESANDO ALTA...</span>
                </>
              ) : (
                <>
                  <span>COMPLETAR ALTA E INGRESAR DIRECTO 🏍️</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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

