'use client'

import React, { useState, useEffect } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { 
  User, 
  Bike, 
  Phone, 
  ShieldCheck, 
  Award, 
  Star, 
  FileText, 
  Settings, 
  Volume2, 
  Package, 
  LogOut, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PayoutService } from '@/lib/services/payoutService'
import { CancellationService } from '@/lib/services/cancellationService'

export default function DriverProfilePage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [driverData, setDriverData] = useState({
    name: 'Conductor Registrado',
    phone: 'Sin teléfono registrado',
    email: '',
    motorcycle: 'Motocicleta Estándar',
    plates: 'S/P',
    level: 'NIVEL PLATA',
    rating: '5.0 ★',
    totalTrips: 0,
    baseFleet: 'Plaza VAMO Oficial',
    status: 'Activo / Certificado',
    referralCode: 'VAMO-MOTO-01',
    referredCount: 0,
    referralEarnings: 0
  })

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('CAMBIO_TRABAJO')

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [heavyCargoEnabled, setHeavyCargoEnabled] = useState(true)
  const [autoAccept, setAutoAccept] = useState(false)

  // Estados Bancarios M16 (CLABE & Dispersión SPEI)
  const [clabeInput, setClabeInput] = useState('')
  const [detectedBank, setDetectedBank] = useState('')
  const [beneficiaryInput, setBeneficiaryInput] = useState('')
  const [payoutFreq, setPayoutFreq] = useState<'DAILY' | 'WEEKLY' | 'MANUAL'>('DAILY')
  const [isBankSaved, setIsBankSaved] = useState(false)
  const [bankSavedSuccess, setBankSavedSuccess] = useState<string | null>(null)
  const [driverUserId, setDriverUserId] = useState<string>('driver')

  useEffect(() => {
    async function loadDriverRealProfile() {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const uId = user.id
          setDriverUserId(uId)
          const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Conductor VAMO'
          const userPhone = user.user_metadata?.phone || user.phone || 'Teléfono no especificado'
          const userEmail = user.email || ''

          // 1. Consultar registro del chofer en tabla 'drivers' o 'profiles'
          const { data: driverRow } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', uId)
            .maybeSingle()

          // 2. Conteo de viajes completados reales
          const { count: completedTrips } = await supabase
            .from('service_orders')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', uId)
            .eq('status', 'DELIVERED')

          const cleanName = userName.replace(/\s*\(.*?\)\s*/g, '').trim() || 'Conductor VAMO'
          const realLevel = (completedTrips || 0) >= 30 ? 'NIVEL ORO' : (completedTrips || 0) > 0 ? 'NIVEL ACTIVO' : 'NIVEL INICIAL'
          const cleanCode = `MOTO-${cleanName.slice(0, 4).toUpperCase()}-${uId.slice(0, 3).toUpperCase()}`

          setDriverData({
            name: cleanName,
            phone: driverRow?.phone || userPhone,
            email: userEmail,
            motorcycle: driverRow?.vehicle_model || driverRow?.vehicle_type || 'Motocicleta Registrada',
            plates: driverRow?.vehicle_plates || 'S/P (Pendiente)',
            level: realLevel,
            rating: '5.0 ★',
            totalTrips: completedTrips || 0,
            baseFleet: driverRow?.franchise_name || 'Base Operativa Local',
            status: driverRow?.status === 'BLOCKED' ? 'Suspendido' : 'Activo / Certificado',
            referralCode: cleanCode,
            referredCount: 0,
            referralEarnings: 0
          })

          // 3. Consultar cuenta bancaria real
          const bankData = await PayoutService.getBankAccount(uId)
          if (bankData && bankData.clabeNumber) {
            setClabeInput(bankData.clabeNumber)
            setDetectedBank(bankData.bankName)
            setBeneficiaryInput(bankData.beneficiaryName)
            setPayoutFreq(bankData.payoutFrequency)
            setIsBankSaved(true)
          } else {
            setBeneficiaryInput(userName.toUpperCase())
            setIsBankSaved(false)
          }
        }
      } catch (err) {
        console.warn('Error cargando perfil real de chofer:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDriverRealProfile()
  }, [])

  const handleClabeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s+/g, '')
    setClabeInput(val)
    if (val.length >= 3) {
      const check = PayoutService.validateClabe(val)
      setDetectedBank(check.bankName || '')
    } else {
      setDetectedBank('')
    }
  }

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clabeInput || clabeInput.length < 18) {
      alert('Por favor ingresa una CLABE interbancaria válida de 18 dígitos.')
      return
    }

    const result = await PayoutService.saveBankAccount({
      userId: driverUserId,
      role: 'driver',
      bankName: detectedBank || 'Banco Mexicano',
      clabeNumber: clabeInput,
      beneficiaryName: beneficiaryInput,
      payoutFrequency: payoutFreq
    })

    if (result.success) {
      setIsBankSaved(true)
      setBankSavedSuccess(`¡Cuenta de ${detectedBank} (${payoutFreq === 'DAILY' ? 'Corte Diario' : 'Corte Semanal'}) guardada con éxito!`)
      setTimeout(() => setBankSavedSuccess(null), 4000)
    } else {
      alert(result.message)
    }
  }

  if (isLoading) {
    return (
      <MobileDriverLayout>
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#0056d2]" />
          <span className="text-xs font-black uppercase tracking-wider">Cargando Perfil del Conductor...</span>
        </div>
      </MobileDriverLayout>
    )
  }

  return (
    <MobileDriverLayout>
      <div className="p-5 space-y-6 pb-6">
        
        {/* Header Perfil */}
        <header className="text-center pt-2 space-y-1">
          <span className="bg-[#0056d2] text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
            PERFIL DEL CONDUCTOR
          </span>
          <h1 className="text-xl font-extrabold text-slate-900">Mi Cuenta Socio VAMO</h1>
        </header>

        {/* Tarjeta de Identidad & Nivel */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200 shadow-xs space-y-4 text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-full h-full rounded-full bg-[#0040a1] text-[#c3f400] flex items-center justify-center text-3xl font-black border-4 border-[#0056d2] shadow-md">
              🛵
            </div>
            <span className="absolute bottom-0 right-0 bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#161e00] shadow-xs">
              {driverData.rating}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">{driverData.name}</h2>
            <p className="text-xs font-bold text-slate-500">{driverData.phone} &bull; {driverData.baseFleet}</p>
          </div>

          <div className="flex justify-center gap-2">
            <span className="bg-[#0040a1] text-white text-xs font-black px-3 py-1 rounded-full uppercase">
              {driverData.level}
            </span>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
              {driverData.status}
            </span>
          </div>
        </div>

        {/* MÓDULO LLAVE DE RECOMENDACIÓN & BONOS POR LOCALES AFILIADOS */}
        <div className="bg-[#161e00] text-white p-5 rounded-[28px] border border-[#c3f400]/40 shadow-md space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full uppercase">
              PROGRAMA DE RECOMENDACIÓN
            </span>
            <span className="text-xs font-black text-[#c3f400]">+$150 MXN / LOCAL</span>
          </div>

          <div>
            <h3 className="text-sm font-black text-white">Tu Llave de Recomendación de Locales</h3>
            <p className="text-[11px] text-slate-300 font-semibold mt-0.5">
              Recomienda taquerías, farmacias o comercios. Cuando se afilien con tu código, ganas <strong className="text-[#c3f400]">$150 MXN en efectivo + 50 Puntos VAMO</strong>.
            </p>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-300 block uppercase">CÓDIGO EXCLUSIVO:</span>
              <strong className="font-mono text-base font-black text-[#c3f400]">{driverData.referralCode}</strong>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(driverData.referralCode)
                alert(`¡Código ${driverData.referralCode} copiado! Compártelo con el dueño del negocio.`)
              }}
              className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] text-xs font-black px-3.5 py-2 rounded-full active:scale-95 transition-transform cursor-pointer"
            >
              Copiar Código 📋
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold pt-1">
            <div className="bg-white/5 p-2 rounded-xl border border-white/10">
              <span className="text-[#c3f400] text-base font-black block">{driverData.referredCount} Locales</span>
              <span className="text-[10px] text-slate-300">Afiliados por ti</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/10">
              <span className="text-[#c3f400] text-base font-black block">${Number(driverData.referralEarnings).toFixed(2)} MXN</span>
              <span className="text-[10px] text-slate-300">Ganados en Bonos</span>
            </div>
          </div>
        </div>

        {/* Datos del Vehículo */}
        <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Bike className="w-4 h-4 text-[#0056d2]" />
            <span>Vehículo Registrado</span>
          </h3>

          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Motocicleta:</span>
            <span className="text-slate-900">{driverData.motorcycle}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Placas de Circulación:</span>
            <span className="text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded-md">{driverData.plates}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Estado de Operación:</span>
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {driverData.status}
            </span>
          </div>
        </div>

        {/* MÓDULO DATOS BANCARIOS CLABE & DISPERSIÓN SPEI (M16) */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0056d2] text-white flex items-center justify-center font-black text-xs">
                🏦
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase">Cuenta Bancaria para Depósitos SPEI</h3>
                <span className="text-[10px] text-slate-500 font-semibold">Tus ganancias de fletes con tarjeta</span>
              </div>
            </div>
            {isBankSaved && (
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verificada
              </span>
            )}
          </div>

          {bankSavedSuccess && (
            <div className="bg-emerald-100 text-emerald-900 p-3 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-300 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{bankSavedSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveBank} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase">CLABE Interbancaria (18 Dígitos)</label>
              <input
                type="text"
                maxLength={18}
                value={clabeInput}
                onChange={handleClabeChange}
                placeholder="Ingresa los 18 dígitos de tu CLABE"
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-xl p-3 text-xs font-mono font-bold outline-none"
              />
              {detectedBank && (
                <span className="text-[10px] font-black text-[#0056d2] block mt-0.5">
                  🏦 Banco Detectado: {detectedBank}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase">Nombre Completo del Titular</label>
              <input
                type="text"
                value={beneficiaryInput}
                onChange={e => setBeneficiaryInput(e.target.value)}
                placeholder="Nombre del Titular de la Cuenta"
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-xl p-3 text-xs font-bold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase">Frecuencia de Dispersión SPEI (Conekta)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutFreq('DAILY')}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    payoutFreq === 'DAILY' 
                      ? 'bg-[#0056d2] text-white border-[#0056d2] shadow-sm' 
                      : 'bg-[#f6f3f2] text-slate-700 border-[#e5e2e1] hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black block">⚡ Corte Diario</span>
                  <span className="text-[10px] opacity-80 font-semibold block mt-0.5">Cada noche 23:00 hrs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutFreq('WEEKLY')}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    payoutFreq === 'WEEKLY' 
                      ? 'bg-[#0056d2] text-white border-[#0056d2] shadow-sm' 
                      : 'bg-[#f6f3f2] text-slate-700 border-[#e5e2e1] hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black block">📅 Corte Semanal</span>
                  <span className="text-[10px] opacity-80 font-semibold block mt-0.5">Lunes 08:00 AM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutFreq('MANUAL')}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    payoutFreq === 'MANUAL' 
                      ? 'bg-[#0056d2] text-white border-[#0056d2] shadow-sm' 
                      : 'bg-[#f6f3f2] text-slate-700 border-[#e5e2e1] hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black block">🚀 Retiro Inmediato</span>
                  <span className="text-[10px] opacity-80 font-semibold block mt-0.5">1-Tap en &lt; 5 min</span>
                </button>
              </div>
            </div>

            {/* Cuota Semanal & Beneficios Exclusivos VAMO */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5 text-left border border-slate-800 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full uppercase">
                  MEMBRESÍA SEMANAL VAMO
                </span>
                <strong className="text-sm font-black text-[#c3f400]">$100.00 MXN / sem</strong>
              </div>

              <div className="space-y-1 text-[11px] text-slate-300 font-semibold leading-relaxed">
                <p className="font-bold text-white">✨ Tus Beneficios al ser Conductor Activo VAMO:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li><strong>100% de tus ganancias son tuyas:</strong> Cero comisiones por viaje completado.</li>
                  <li><strong>Telemetría GPS en tiempo real:</strong> Rutas inteligentes OSRM y alerta de 50 metros.</li>
                  <li><strong>Soporte operativo de Base:</strong> Asistencia en ruta, comandas locales y clientes por app.</li>
                </ul>
              </div>

              <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800">
                <span>💡 <strong>Métodos de Pago:</strong> Se descuenta automáticamente de tu saldo digital en el corte de los lunes o puedes pagarlo <strong>en Efectivo directamente en la Base Operativa</strong>.</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3.5 rounded-full font-black text-xs shadow-sm active:scale-95 transition-all cursor-pointer mt-1"
            >
              GUARDAR PREFERENCIAS DE DISPERSIÓN SPEI
            </button>
          </form>
        </div>

        {/* Documentación & Validación Oficial */}
        <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-xs space-y-2.5">
          <h3 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-[#0056d2]" />
            <span>Documentación & Seguros</span>
          </h3>

          {[
            { label: 'Licencia de Conducir Tipo Moto', status: 'Vigente' },
            { label: 'Tarjeta de Circulación', status: 'Verificada' },
            { label: 'Póliza de Seguro de Cobertura Amplia', status: 'Activa' }
          ].map((doc, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs py-1">
              <span className="text-slate-700 font-medium">{doc.label}</span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                ✓ {doc.status}
              </span>
            </div>
          ))}
        </div>

        {/* Preferencias de Trabajo en Ruta */}
        <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Settings className="w-4 h-4 text-[#0056d2]" />
            <span>Ajustes de Ruta</span>
          </h3>

          {/* Sonido de Alertas */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">Alertas Sonoras (TTS / Chime)</span>
              <span className="text-[10px] text-slate-500 font-medium">Anunciar pedidos en altavoz</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors ${soundEnabled ? 'bg-[#0056d2]' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-xs transition-all duration-200 ${soundEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {/* Pedidos con Carga Pesada */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">Parrilla para Carga / Ferretería</span>
              <span className="text-[10px] text-slate-500 font-medium">Recibir encargos de hasta 20kg</span>
            </div>
            <button
              onClick={() => setHeavyCargoEnabled(!heavyCargoEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors ${heavyCargoEnabled ? 'bg-[#0056d2]' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-xs transition-all duration-200 ${heavyCargoEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* SECCIÓN CAMBIAR DE ROL / HERRAMIENTAS (MODO CLIENTE & DUEÑO DE FLOTA) */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-[#737785] uppercase tracking-wider px-2 block">
            CAMBIAR DE ROL OPERATIVO
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/customer/home"
              onClick={() => {
                try { localStorage.setItem('vamo_active_role', 'customer') } catch {}
              }}
              className="bg-white p-3.5 rounded-2xl border border-blue-200 hover:border-[#0056d2] shadow-xs flex flex-col items-center text-center gap-1.5 group active:scale-95 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0056d2] text-white flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                👤
              </div>
              <div>
                <strong className="text-xs font-black text-[#1c1b1b] block">Modo Cliente</strong>
                <span className="text-[9px] text-[#737785] font-semibold">Pedir y Comprar</span>
              </div>
            </Link>

            <Link
              href="/owner/dashboard"
              onClick={() => {
                try { localStorage.setItem('vamo_active_role', 'fleet_owner') } catch {}
              }}
              className="bg-white p-3.5 rounded-2xl border border-amber-200 hover:border-amber-500 shadow-xs flex flex-col items-center text-center gap-1.5 group active:scale-95 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                👑
              </div>
              <div>
                <strong className="text-xs font-black text-[#1c1b1b] block">Dueño de Flota</strong>
                <span className="text-[9px] text-[#737785] font-semibold">Mis Motos & Finanzas</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Botón Cerrar Sesión & Botón Darse de Baja */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem('vamo_active_role')
                localStorage.removeItem('vamo_user_session')
              } catch {}
              window.location.href = '/customer/home'
            }}
            className="w-full bg-[#f0eded] hover:bg-[#e5e2e1] text-slate-800 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="w-full text-rose-600 hover:text-rose-700 py-2.5 text-xs font-black text-center transition-colors cursor-pointer hover:underline"
          >
            ⚠️ Darse de Baja como Conductor VAMO
          </button>
        </div>

        {/* Modal de Cancelación Definitiva Conductor */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div 
              role="dialog"
              aria-modal="true"
              aria-labelledby="driver-cancel-title"
              className="bg-white rounded-[32px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#e5e2e1] animate-fade-in text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black mx-auto text-xl">
                🛵
              </div>

              <div className="text-center space-y-1">
                <h3 id="driver-cancel-title" className="text-base font-black text-slate-900">¿Deseas darte de baja como repartidor?</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Se cancelará tu membresía de conductor, se apagará tu señal satelital y se liberará tu plaza en la Base Operativa.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Motivo de la Baja</label>
                <select
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl p-3 text-xs font-bold outline-none"
                >
                  <option value="CAMBIO_TRABAJO">Conseguí otro trabajo / actividad</option>
                  <option value="VENTA_MOTO">Ya no cuento con motocicleta</option>
                  <option value="CAMBIO_CIUDAD">Cambio de residencia</option>
                  <option value="OTRO">Otro motivo personal</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-full text-xs font-black cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await CancellationService.cancelAccount({
                      userId: driverUserId,
                      role: 'driver',
                      reason: cancelReason,
                      codBalance: 0
                    })
                    if (res.success) {
                      alert('Tu baja como conductor ha sido procesada exitosamente.')
                      window.location.href = '/customer/home'
                    } else {
                      alert(res.message)
                    }
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-full text-xs font-black shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  CONFIRMAR BAJA
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MobileDriverLayout>
  )
}
