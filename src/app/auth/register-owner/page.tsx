'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Building2, ShieldCheck, 
  Lock, Mail, Phone, User, MapPin, Loader2, AlertCircle, 
  Sparkles, ArrowRight, FileText, CheckCircle2, Bike, DollarSign,
  TrendingUp, Users, Smartphone, Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LegalAgreementModal } from '@/components/legal/LegalAgreementModal'

export default function RegisterOwnerPage() {
  const router = useRouter()
  const supabase = createClient()

  // Datos del contacto / cuenta
  const [contactName, setContactName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [baseAddress, setBaseAddress] = useState('')
  const [estimatedBikes, setEstimatedBikes] = useState<number>(5)
  const [inePhotoUrl, setInePhotoUrl] = useState<string | null>(null)

  // Estados de proceso
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Estado del Contrato Legal NOM-151
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [signedContract, setSignedContract] = useState<{
    contractId: string
    signedName: string
    signedDate: string
    digitalHash: string
  } | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('La foto de la INE no debe superar los 5MB.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setInePhotoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName || !companyName || !email || !password || !phone || !city || !baseAddress) {
      setErrorMessage('Por favor completa todos los campos requeridos, incluyendo la dirección de tu base.')
      return
    }
    if (estimatedBikes < 5) {
      setErrorMessage('El requisito mínimo para habilitar una plaza comercial es de 5 motocicletas activas.')
      return
    }
    if (!inePhotoUrl) {
      setErrorMessage('Por favor adjunta la fotografía de tu Identificación Oficial (INE) para validar tu solicitud.')
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
      // 1. Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: contactName.trim(),
            company_name: companyName.trim(),
            role: 'fleet_owner',
            phone: phone.trim(),
            city: city.trim(),
            base_address: baseAddress.trim(),
            estimated_bikes: estimatedBikes,
            has_ine: !!inePhotoUrl,
            contract_id: contractData?.contractId,
            contract_hash: contractData?.digitalHash,
            signed_at: contractData?.signedDate
          }
        }
      })

      // 2. Registrar en tabla de solicitudes de socios comerciales
      const partnerRequest = {
        id: authData?.user?.id || `req_partner_${Date.now()}`,
        user_id: authData?.user?.id || null,
        company_name: companyName.trim(),
        contact_name: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        base_address: baseAddress.trim(),
        estimated_bikes: Number(estimatedBikes) || 5,
        ine_url: inePhotoUrl || null,
        status: 'PENDING',
        contract_hash: contractData?.digitalHash || 'HASH_LOCAL_VALID',
        created_at: new Date().toISOString()
      }

      try {
        await supabase
          .from('franchise_partner_requests')
          .insert(partnerRequest)
      } catch (e) {
        console.warn('Fallback a almacenamiento local de solicitudes')
      }

      // Guardar también en localStorage para consistencia del Superadmin en modo demo/offline
      try {
        const existing = JSON.parse(localStorage.getItem('vamo_fleet_requests') || '[]')
        existing.unshift(partnerRequest)
        localStorage.setItem('vamo_fleet_requests', JSON.stringify(existing))
      } catch (e) {}

      setSuccess(true)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al enviar la solicitud de socio comercial.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Barra de Navegación Superior */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 mb-4">
        <Link 
          href="/customer/home" 
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0040a1] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </Link>
        <span className="text-xs font-black bg-[#0040a1] text-white px-3 py-1 rounded-full uppercase tracking-wider">
          Socio Comercial VAMO
        </span>
      </div>

      {/* Contenedor Principal */}
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Columna Izquierda: Condiciones Comerciales & Requisito Mínimo 5 Motos (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-[#c3f400] text-[#161e00] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Renta de Software SaaS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1c1b1b] leading-tight">
              Opera tu propia Flota de Motos con VAMO
            </h1>
            <p className="text-sm font-semibold text-[#424654]">
              Renta la tecnología VAMO para despachar a tus propios repartidores y ganar el 50% de las comisiones de tu zona.
            </p>
          </div>

          {/* Tarjeta de Requisitos Clave: Mínimo 5 Motos + INE */}
          <div className="bg-[#161e00] text-white p-5 rounded-3xl border border-[#c3f400]/40 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#c3f400]">
                REQUISITOS OBLIGATORIOS
              </span>
              <span className="text-xl">🛵</span>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black shrink-0 text-xs mt-0.5">
                  5+
                </div>
                <div>
                  <h4 className="font-extrabold text-white">Mínimo 5 Motociclistas</h4>
                  <p className="text-slate-300 font-normal">Debes contar con un equipo base de al menos 5 repartidores listos para operar tu plaza.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black shrink-0 text-xs mt-0.5">
                  🪪
                </div>
                <div>
                  <h4 className="font-extrabold text-white">Identificación Oficial (INE)</h4>
                  <p className="text-slate-300 font-normal">Adjunta tu credencial de elector vigente para la verificación y firma digital del contrato.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Beneficios Transparentes */}
          <div className="bg-[#0040a1] text-white p-5 rounded-3xl shadow-lg border border-blue-900 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#c3f400]">
              Condiciones del Modelo de Negocio
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-[#c3f400] font-black">✓</span>
                <p className="text-blue-100"><strong>$0 Costo de Alta:</strong> Sin cuotas iniciales de franquicia.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#c3f400] font-black">✓</span>
                <p className="text-blue-100"><strong>50% Split de Ganancias:</strong> Ganas el 50% de las comisiones cobradas en tu plaza.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#c3f400] font-black">✓</span>
                <p className="text-blue-100"><strong>Micro-cuota de $100/sem:</strong> Por cada moto activa en tu sistema.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#c3f400] font-black">✓</span>
                <p className="text-blue-100"><strong>Consola de Despacho:</strong> Generador de llaves para tus choferes y radar en vivo.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario Ultra Simple (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm">
          
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-[#e6f4ea] text-[#1e8e3e] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-[#1c1b1b]">¡Solicitud de Flota Enviada!</h2>
              <p className="text-sm font-medium text-[#424654] max-w-md mx-auto">
                Hemos recibido tu postulación con <strong>{estimatedBikes} motociclistas</strong> y tu INE. Nuestro equipo master revisará tu solicitud de inmediato.
              </p>

              <div className="bg-[#fcf9f8] p-4 rounded-2xl border border-[#e5e2e1] text-xs text-left max-w-md mx-auto space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Titular:</span>
                  <span className="font-extrabold text-slate-800">{contactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Ciudad:</span>
                  <span className="font-extrabold text-slate-800">{city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Flota Base:</span>
                  <span className="font-extrabold text-[#0040a1]">{estimatedBikes} Motocicletas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">INE / Identificación:</span>
                  <span className="font-extrabold text-emerald-600">Adjunta y Validada</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/customer/home"
                  className="bg-[#0040a1] text-white px-6 py-3 rounded-full text-xs font-bold shadow-md hover:bg-[#003080] transition-all"
                >
                  Regresar al Inicio 🏠
                </Link>
                <a
                  href="/downloads/VAMO_Socio_Comercial.apk"
                  download
                  className="bg-[#c3f400] text-[#161e00] px-6 py-3 rounded-full text-xs font-black shadow-xs hover:bg-[#abd600] transition-all flex items-center justify-center gap-1.5"
                >
                  Descargar APK Socio ⬇
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePreSubmit} className="space-y-4">
              
              <div className="border-b border-[#e5e2e1] pb-3 mb-2">
                <h2 className="text-lg font-black text-[#1c1b1b]">Formulario de Solicitud de Plaza</h2>
                <p className="text-xs text-[#737785] font-semibold">Completa los datos para habilitar tu flota en la plataforma</p>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Nombre de Flota y Titular */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Nombre de tu Empresa / Flota *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. MotoEnvíos Celaya"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl text-xs font-medium focus:border-[#0040a1] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Nombre del Titular *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos Mendoza"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl text-xs font-medium focus:border-[#0040a1] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Correo y Contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Correo Electrónico *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl text-xs font-medium focus:border-[#0040a1] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Contraseña de Acceso *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl text-xs font-medium focus:border-[#0040a1] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp y Ciudad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Teléfono WhatsApp *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="10 dígitos"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl text-xs font-medium focus:border-[#0040a1] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Ciudad / Municipio *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Celaya, Guanajuato"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl text-xs font-medium focus:border-[#0040a1] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección de la Base Operativa / Oficina */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1c1b1b]">Dirección o Ubicación de tu Base de Operaciones *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Av. Hidalgo #142, Col. Centro, CP 38000"
                    value={baseAddress}
                    onChange={(e) => setBaseAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl text-xs font-medium focus:border-[#0040a1] focus:outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Esta ubicación se utilizará para geolocalizar tu plaza en el mapa y asignar el radio de cobertura de tus motos.
                </span>
              </div>

              {/* Selector de Tamaño de Flota (Mínimo 5 motos) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1c1b1b]">Motociclistas Listos para Operar *</label>
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Mínimo 5 requeridos
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 25, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEstimatedBikes(num)}
                      className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        estimatedBikes === num
                          ? 'bg-[#0040a1] text-white border-[#0040a1] shadow-xs'
                          : 'bg-[#fcf9f8] text-[#424654] border-[#e5e2e1] hover:border-[#0040a1]'
                      }`}
                    >
                      {num === 50 ? '50+ motos' : `${num} motos`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carga de Fotografía de la INE */}
              <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-[#1c1b1b] flex items-center justify-between">
                  <span>Foto de Identificación Oficial (INE / IFE) *</span>
                  {inePhotoUrl ? (
                    <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> INE Adjunta
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold text-[11px]">Requerido</span>
                  )}
                </label>
                <p className="text-[11px] text-[#424654]">
                  Sube una fotografía clara del frente de tu credencial de elector.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <label className="flex-1 bg-white hover:bg-slate-100 text-[#0040a1] border border-dashed border-[#0040a1] py-2.5 px-4 rounded-xl text-xs font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-2">
                    <span>{inePhotoUrl ? 'Cambiar Foto de INE 📸' : 'Subir Foto de INE 📸'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Estado del Contrato Legal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0040a1]" />
                    <span className="text-xs font-bold text-[#1c1b1b]">Contrato de Renta SaaS VAMO (NOM-151)</span>
                  </div>
                  {signedContract ? (
                    <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✓ Firmado
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Pendiente
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="w-full bg-white hover:bg-slate-100 text-[#0040a1] border border-[#0040a1] py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {signedContract ? 'Ver Firma Digital ✍️' : 'Revisar y Firmar Contrato Digital ✍️'}
                </button>
              </div>

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0040a1] hover:bg-[#003080] text-white py-3.5 rounded-full text-xs sm:text-sm font-black shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validando Solicitud...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Solicitud de Plaza Comercial</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </div>

      {/* Modal de Firma Legal NOM-151 */}
      <LegalAgreementModal
        isOpen={showLegalModal}
        agreementType="COMMERCIAL_PARTNER"
        userName={contactName || 'Socio Comercial'}
        bizName={companyName || 'Flota VAMO'}
        onClose={() => setShowLegalModal(false)}
        onAcceptAndSign={(contractData) => {
          setSignedContract(contractData)
          setShowLegalModal(false)
        }}
      />
    </div>
  )
}
