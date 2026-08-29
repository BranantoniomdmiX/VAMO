'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Store, CheckCircle2, Building2, ShieldCheck, 
  Lock, Mail, Phone, User, MapPin, Loader2, AlertCircle, 
  Sparkles, QrCode, ArrowRight, Utensils, Pill, Wrench, ShoppingBag,
  FileText, PenTool
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LegalAgreementModal } from '@/components/legal/LegalAgreementModal'

export default function RegisterBizPage() {
  const router = useRouter()
  const supabase = createClient()

  // Datos del contacto / cuenta
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  // Datos del comercio
  const [storeName, setStoreName] = useState('')
  const [category, setCategory] = useState('Restaurante / Comida')
  const [address, setAddress] = useState('')

  // Modalidad de afiliación (con código de Socio Operador o Directo)
  const [affiliationMode, setAffiliationMode] = useState<'independent' | 'fleet'>('independent')
  const [fleetCode, setFleetCode] = useState('')

  // Estados de proceso
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [kdsToken, setKdsToken] = useState<string>('')

  // Estado del Contrato Legal NOM-151
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [signedContract, setSignedContract] = useState<{
    contractId: string
    signedName: string
    signedDate: string
    digitalHash: string
  } | null>(null)

  const categories = [
    { label: '👨‍🍳 Restaurante / Cocina Formal (Comandas KDS)', id: 'kds', icon: Utensils },
    { label: '🌮 Puesto Callejero / Taquería (Modo Rápido 2 Botones)', id: 'simple', icon: Utensils },
    { label: '💊 Farmacia / Salud / Recetas Médicas', id: 'pharmacy', icon: Pill },
    { label: '🔧 Ferretería / Refaccionaria / Carga Pesada', id: 'hardware', icon: Wrench },
    { label: '🛒 Abarrotes / Tienda / Comercio General', id: 'catalog', icon: ShoppingBag }
  ]

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ownerName || !email || !password || !phone || !storeName || !address) {
      setErrorMessage('Por favor completa todos los campos requeridos.')
      return
    }
    if (!signedContract) {
      setShowLegalModal(true)
      return
    }
    executeRegistration()
  }

  const executeRegistration = async (contractData = signedContract) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      let franchiseId: string | null = null
      let baseId: string | null = null

      // 1. Validar código de flota si seleccionó afiliarse con un Socio Operador
      if (affiliationMode === 'fleet') {
        if (!fleetCode.trim()) {
          setErrorMessage('Introduce el código proporcionado por tu Socio Operador.')
          setIsLoading(false)
          return
        }

        let codeValid = false

        // 1. Check Supabase
        try {
          const { data: codeData, error: codeErr } = await supabase
            .from('franchise_join_codes')
            .select('*')
            .eq('code', fleetCode.trim().toUpperCase())
            .eq('is_active', true)
            .maybeSingle()

          if (!codeErr && codeData) {
            codeValid = true
            franchiseId = codeData.franchise_id
            baseId = codeData.base_id
          }
        } catch (e) {}

        // 2. Check local fleet codes
        if (!codeValid) {
          try {
            const localFleetCodes = JSON.parse(localStorage.getItem('vamo_fleet_codes') || '[]')
            const matchFleet = localFleetCodes.find((c: any) => c.code === fleetCode.trim().toUpperCase())
            if (matchFleet) {
              codeValid = true
              franchiseId = matchFleet.fleetName || 'Plaza Territorial'
            }
          } catch (e) {}
        }

        if (!codeValid) {
          setErrorMessage('El código de Socio Operador no es válido o ha expirado.')
          setIsLoading(false)
          return
        }
      }

      // 2. Generar Token / PIN KDS de 6 dígitos para la pantalla de cocina
      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString()
      setKdsToken(generatedPin)

      // 3. Crear usuario en Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: ownerName.trim(),
            phone: phone.trim(),
            role: 'merchant_user',
            store_name: storeName.trim(),
            category: category,
            kds_pin: generatedPin
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
        // 4. Guardar perfil en user_profiles
        try {
          await supabase.from('user_profiles').upsert({
            id: userId,
            full_name: ownerName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            primary_role: 'merchant_user',
            franchise_id: franchiseId,
            base_id: baseId
          })
        } catch (e) {
          console.warn('Error guardando perfil:', e)
        }

        // 5. Guardar registro en tabla merchants si existe
        try {
          const slug = storeName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(100 + Math.random() * 900)
          await supabase.from('merchants').insert({
            name: storeName.trim(),
            slug: slug,
            category: category.toUpperCase(),
            phone: phone.trim(),
            address: address.trim(),
            owner_user_id: userId,
            is_open: true
          })
        } catch (e) {
          console.warn('Error guardando merchant en BD:', e)
        }
      }

      // 6. Persistir en localStorage para experiencia local y sincronización inmediata
      const merchantProfile = {
        id: Date.now(),
        storeName: storeName.trim(),
        name: storeName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        category: category,
        address: address.trim(),
        isOpen: true,
        kdsPin: generatedPin,
        franchiseId: franchiseId,
        lat: 20.5230 + (Math.random() - 0.5) * 0.01,
        lng: -100.8142 + (Math.random() - 0.5) * 0.01,
        rating: '5.0 ★ (NUEVO)',
        prepTime: '10-15 min'
      }
      localStorage.setItem('vamo_merchant_profile', JSON.stringify(merchantProfile))

      try {
        const allMerchants = JSON.parse(localStorage.getItem('vamo_registered_merchants') || '[]')
        allMerchants.unshift(merchantProfile)
        localStorage.setItem('vamo_registered_merchants', JSON.stringify(allMerchants))
      } catch (e) {}

      setIsLoading(false)
      setSuccess(true)

      // Redirigir al Hub Comercial después de mostrar el PIN KDS
      setTimeout(() => {
        router.push('/biz')
      }, 2500)

    } catch (err) {
      console.error('Error en registro:', err)
      setErrorMessage('Ocurrió un error inesperado al procesar el registro.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] font-sans flex flex-col justify-between p-4 sm:p-8 selection:bg-[#0056d2] selection:text-white">
      {/* Header */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between">
        <Link href="/auth/login" className="flex items-center gap-2 bg-white border border-[#e5e2e1] px-4 py-2 rounded-full text-xs font-bold text-[#0056d2] hover:bg-slate-50 transition-all shadow-xs">
          <ArrowLeft className="w-4 h-4" /> Volver a Iniciar Sesión
        </Link>
        <div className="flex items-center gap-2">
          <span className="bg-[#0056d2] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            PORTAL COMERCIOS
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full my-6 space-y-6">
        
        {/* Banner de Bienvenida */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#0056d2]/10 border border-[#0056d2]/20 rounded-3xl flex items-center justify-center mx-auto text-[#0056d2] shadow-xs">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Afiliar mi Local a VAMO
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-md mx-auto">
            Vende más con <strong>0% comisiones</strong> y despacha con la red de motomandados más rápida de tu ciudad.
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-6">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center py-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">¡Registro Exitoso!</h2>
                <p className="text-xs font-semibold text-slate-500">
                  Tu comercio <strong>{storeName}</strong> ya está listo para operar.
                </p>
              </div>

              {/* PIN KDS de Cocina */}
              <div className="bg-[#f6f3f2] border-2 border-[#0056d2]/30 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  TU PIN DE CONSOLA DE COCINA (KDS)
                </span>
                <p className="text-3xl font-black text-[#0056d2] tracking-widest font-mono">
                  {kdsToken}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  Usa este PIN o escanea el QR en cualquier tablet o celular para abrir tu pantalla de comandas sin contraseña.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#0056d2] pt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Abriendo tu Centro de Comercio VAMO...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePreSubmit} className="space-y-5">
              
              {/* Modalidad de Afiliación (Tabs) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wide block">
                  Modalidad de Afiliación
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#f6f3f2] p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setAffiliationMode('independent')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      affiliationMode === 'independent'
                        ? 'bg-white text-[#0056d2] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Directo / Independiente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAffiliationMode('fleet')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      affiliationMode === 'fleet'
                        ? 'bg-[#0056d2] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Con Socio Operador</span>
                  </button>
                </div>
              </div>

              {/* Si seleccionó con Socio Operador */}
              {affiliationMode === 'fleet' && (
                <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-2xl space-y-2 animate-fade-in">
                  <label className="text-xs font-black text-[#0056d2] uppercase tracking-wide flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" /> Código de Socio Operador / Flota
                  </label>
                  <input
                    type="text"
                    value={fleetCode}
                    onChange={e => setFleetCode(e.target.value.toUpperCase())}
                    placeholder="Ej. FLOTA-QRO-92"
                    required={affiliationMode === 'fleet'}
                    className="w-full bg-white border border-blue-300 focus:border-[#0056d2] rounded-xl px-4 py-2.5 text-sm font-black tracking-widest outline-none uppercase"
                  />
                  <p className="text-[11px] font-semibold text-blue-800">
                    Tu negocio quedará enlazado a la base operativa y a la flotilla de motos de tu zona.
                  </p>
                </div>
              )}

              {/* Sección 1: Datos del Negocio */}
              <div className="border-t border-[#f0eded] pt-4 space-y-4">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  1. Información del Establecimiento
                </span>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 uppercase">Nombre Comercial del Local</label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input 
                      type="text"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      placeholder="Ej. Taquería Los Compadres"
                      required
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 uppercase">Giro / Categoría</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.label} value={cat.label}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 uppercase">Dirección Física del Local</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input 
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Ej. Av. Hidalgo #104, Col. Centro"
                      required
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Datos de la Cuenta de Acceso */}
              <div className="border-t border-[#f0eded] pt-4 space-y-4">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  2. Cuenta de Acceso y Contacto
                </span>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 uppercase">Nombre del Encargado / Dueño</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input 
                      type="text"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      placeholder="Ej. Roberto Gómez"
                      required
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 uppercase">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input 
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="contacto@local.com"
                        required
                        className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 uppercase">Teléfono / WhatsApp</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input 
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Ej. 5551234567"
                        required
                        className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 uppercase">Contraseña de Acceso</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input 
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque de Conformidad Contractual NOM-151 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#0056d2]" />
                    Convenio Comercial NOM-151
                  </span>
                  {signedContract ? (
                    <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> FIRMADO
                    </span>
                  ) : (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                      PENDIENTE DE FIRMA
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 font-medium">
                  {signedContract ? (
                    <span>✓ Folio certificado: <strong className="font-mono text-[#0056d2]">{signedContract.contractId}</strong> (0% comisión sobre ventas garantizado).</span>
                  ) : (
                    <span>Al afiliarte, firmarás el acuerdo de <strong>0% comisión sobre tus platillos</strong> y membresía de visibilidad en Radar.</span>
                  )}
                </p>

                {!signedContract && (
                  <button
                    type="button"
                    onClick={() => setShowLegalModal(true)}
                    className="w-full bg-white border border-[#0056d2] text-[#0056d2] hover:bg-blue-50 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Leer y Firmar Convenio Comercial</span>
                  </button>
                )}
              </div>

              {/* Botón de Envío */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-4 rounded-full font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AFILIANDO COMERCIO...</span>
                  </>
                ) : (
                  <>
                    <span>AFILIAR MI NEGOCIO Y ABRIR HUB VAMO</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>0% comisiones por venta directa &bull; Tus datos y ventas están 100% protegidos</span>
              </div>

            </form>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs font-semibold text-slate-400">
        VAMO Store Partner &bull; Sistema Operativo SaaS para Motomandados &bull; 2026
      </footer>

      {/* Modal de Firma de Contrato Digital NOM-151 */}
      <LegalAgreementModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        agreementType="MERCHANT"
        userName={ownerName || 'Titular de Comercio'}
        bizName={storeName || 'Establecimiento Comercial'}
        onAcceptAndSign={(contractData) => {
          setSignedContract(contractData)
          setShowLegalModal(false)
          executeRegistration(contractData)
        }}
      />
    </div>
  )
}
