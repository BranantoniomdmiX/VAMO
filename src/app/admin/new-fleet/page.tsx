'use client'

import React, { useState } from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { PlusCircle, Building2, MapPin, CheckCircle2, ArrowRight, Sparkles, DollarSign, Users, Store, Bike, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { 
  VamoPageHeader, 
  VamoButton, 
  VamoInput, 
  VamoStatusBadge,
  VamoCard
} from '@/components/ui'

export default function AdminNewFleetPage() {
  const router = useRouter()
  const [fleetName, setFleetName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [planType, setPlanType] = useState<'TERRITORIAL_PARTNER' | 'INDEPENDENT_FLEET' | 'HYBRID_PLAZA'>('TERRITORIAL_PARTNER')
  
  // Matriz Dinámica y Personalizable de Cuotas
  const [streetFoodMonthly, setStreetFoodMonthly] = useState<number>(100) // Puestos / Taquerías
  const [localStoreMonthly, setLocalStoreMonthly] = useState<number>(300) // Carnicerías / Ferreterías
  const [restaurantMonthly, setRestaurantMonthly] = useState<number>(600) // Restaurantes KDS
  const [driverWeekly, setDriverWeekly] = useState<number>(100)           // Motociclistas / semana
  const [splitPercentPartner, setSplitPercentPartner] = useState<number>(50) // % Socio (50 por defecto)

  const [created, setCreated] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')

  const splitPercentMaster = 100 - splitPercentPartner

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fleetName || !ownerName || !city || !email) return

    const randomId = Date.now()
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const fleetCode = `VAMO-${city.substring(0, 3).toUpperCase()}-${randomDigits}`
    setGeneratedCode(fleetCode)

    const newFleet = {
      id: randomId,
      code: fleetCode,
      type: planType,
      name: fleetName.trim(),
      owner: ownerName.trim(),
      city: city.trim(),
      address: address.trim() || `Base Operativa ${city.trim()}`,
      email: email.trim(),
      phone: phone.trim(),
      riders: 0,
      merchants: 0,
      planName: planType === 'TERRITORIAL_PARTNER'
        ? `Socio Territorial ($0 Setup + Split ${splitPercentPartner}/${splitPercentMaster})`
        : planType === 'INDEPENDENT_FLEET'
        ? `Flotilla Independiente ($${driverWeekly}/sem por moto)`
        : 'Plaza Híbrida Multi-Zona',
      entryFee: 0, // $0 COSTO DE ENTRADA VIRAL
      rates: {
        streetFoodMonthly,
        localStoreMonthly,
        restaurantMonthly,
        driverWeekly,
        splitPartner: splitPercentPartner,
        splitMaster: splitPercentMaster
      },
      driverWeeklyFee: driverWeekly,
      restaurantMonthlyFee: restaurantMonthly,
      splitRatio: `${splitPercentPartner}/${splitPercentMaster}`,
      billingCycle: 'SEMANAL / MENSUAL',
      status: 'active',
      createdAt: new Date().toISOString()
    }

    try {
      const existing = localStorage.getItem('vamo_fleets')
      const fleetsList = existing ? JSON.parse(existing) : []
      fleetsList.unshift(newFleet)
      localStorage.setItem('vamo_fleets', JSON.stringify(fleetsList))

      // Guardar también el código de plaza en la lista de códigos de unión
      const existingCodes = localStorage.getItem('vamo_fleet_codes')
      const codesList = existingCodes ? JSON.parse(existingCodes) : []
      codesList.push({
        code: fleetCode,
        fleetName: fleetName.trim(),
        ownerName: ownerName.trim(),
        city: city.trim(),
        createdAt: new Date().toISOString()
      })
      localStorage.setItem('vamo_fleet_codes', JSON.stringify(codesList))
    } catch (err) {
      console.error(err)
    }

    setCreated(true)
    setTimeout(() => {
      router.push('/admin/fleets')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="new-fleet" />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
          <VamoPageHeader
            title="Alta de Nuevo Socio Comercial / Plaza"
            description="Habilita un nuevo territorio o flota de motos bajo el modelo de Renta SaaS y Split 50/50"
            badge={
              <VamoStatusBadge 
                status="DISPONIBLE" 
                label="$0 SETUP • EXPANSIÓN VIRAL" 
                size="sm" 
              />
            }
            breadcrumbs={[
              { label: 'Superadmin', href: '/admin/dashboard' },
              { label: 'Socios Comerciales', href: '/admin/fleets' },
              { label: 'Nueva Plaza' }
            ]}
          />
          
          {/* Banner de Filosofía: Los Millones están en los Centavos */}
          <div className="bg-[#161e00] text-white p-5 sm:p-6 rounded-3xl border border-[#c3f400]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c3f400]" />
                <span className="text-xs font-black text-[#c3f400] uppercase tracking-wider">
                  MODELO VIRAL DE EXPANSIÓN NACIONAL
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Cero Barrera de Entrada ($0 de Alta) & Micro-Cuotas Masivas
              </h3>
              <p className="text-xs text-slate-300 font-medium max-w-xl">
                El Socio Comercial opera el territorio, coordina a los choferes y afilia locales. El sistema divide automáticamente el <strong>50% para el Socio</strong> y el <strong>50% para VAMO Master (Branmix)</strong>.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-5">
            
            {/* Datos de la Plaza y Titular */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <VamoInput
                label="Nombre de la Plaza / Flotilla *"
                leftIcon={<Building2 className="w-4 h-4" />}
                required
                value={fleetName}
                onChange={(e) => setFleetName(e.target.value)}
                placeholder="Ej. VAMO Celaya / Flota Bajío"
              />

              <VamoInput
                label="Nombre del Socio Comercial *"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
            </div>

            {/* Ciudad y Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <VamoInput
                label="Ciudad / Municipio *"
                leftIcon={<MapPin className="w-4 h-4" />}
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Celaya, GTO"
              />

              <VamoInput
                label="Correo Electrónico *"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="socio@ejemplo.com"
              />

              <VamoInput
                label="Teléfono WhatsApp"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10 dígitos"
              />
            </div>

            {/* Selector de Modalidad Operativa */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Modalidad de Comercialización</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPlanType('TERRITORIAL_PARTNER')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    planType === 'TERRITORIAL_PARTNER'
                      ? 'bg-[#0040a1] text-white border-[#0040a1] shadow-sm'
                      : 'bg-[#fcf9f8] text-[#1c1b1b] border-[#e5e2e1] hover:border-[#0040a1]'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider block text-[#c3f400]">Recomendado</span>
                  <h4 className="text-xs font-black mt-0.5">Socio Territorial 50/50</h4>
                  <p className="text-[11px] opacity-80 mt-1">$0 Alta • Split de todas las cuotas y viajes de la plaza</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType('INDEPENDENT_FLEET')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    planType === 'INDEPENDENT_FLEET'
                      ? 'bg-[#0040a1] text-white border-[#0040a1] shadow-sm'
                      : 'bg-[#fcf9f8] text-[#1c1b1b] border-[#e5e2e1] hover:border-[#0040a1]'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider block text-[#c3f400]">Por Motos</span>
                  <h4 className="text-xs font-black mt-0.5">Flotilla Independiente</h4>
                  <p className="text-[11px] opacity-80 mt-1">$100 MXN/sem por moto activa ($50 Socio / $50 VAMO)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType('HYBRID_PLAZA')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    planType === 'HYBRID_PLAZA'
                      ? 'bg-[#0040a1] text-white border-[#0040a1] shadow-sm'
                      : 'bg-[#fcf9f8] text-[#1c1b1b] border-[#e5e2e1] hover:border-[#0040a1]'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider block text-[#c3f400]">Multi-Zona</span>
                  <h4 className="text-xs font-black mt-0.5">Plaza Híbrida</h4>
                  <p className="text-[11px] opacity-80 mt-1">Gestión de múltiples bases y cobertura extendida</p>
                </button>
              </div>
            </div>

            {/* Desglose de Tarifas de la Plaza (La Matriz Dinámica por Rubro) */}
            <div className="bg-[#fcf9f8] p-5 rounded-2xl border border-[#e5e2e1] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#e5e2e1] pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0040a1]" />
                  <h4 className="text-xs font-black text-[#1c1b1b] uppercase">Matriz de Cuotas Dinámicas & Split Regulable</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Split Configurado:</span>
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {splitPercentPartner}% Socio / {splitPercentMaster}% Branmix
                  </span>
                </div>
              </div>

              {/* Control Deslizador de Split */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-800">Reparto de Comisión / Split de Utilidades:</span>
                  <span className="font-mono font-black text-[#0056d2]">{splitPercentPartner}% para Socio • {splitPercentMaster}% para VAMO</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={70}
                  step={5}
                  value={splitPercentPartner}
                  onChange={(e) => setSplitPercentPartner(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0056d2]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>30% Socio / 70% VAMO</span>
                  <span>50% / 50% (Estándar)</span>
                  <span>70% Socio / 30% VAMO</span>
                </div>
              </div>

              {/* 4 Tarjetas con Inputs Numéricos Editables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                
                {/* 1. Micro-Puestos / Taquerías */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[#726200]">
                    <div className="flex items-center gap-1">
                      <span>🌮</span>
                      <strong className="text-[11px]">Puestos / Taquerías</strong>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={streetFoodMonthly}
                      onChange={(e) => setStreetFoodMonthly(Number(e.target.value))}
                      className="w-full pl-6 pr-12 py-1.5 bg-[#fcf9f8] border border-slate-200 rounded-lg font-black text-sm text-[#1c1b1b] focus:outline-hidden focus:border-[#0056d2]"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">MXN/mes</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    ${((streetFoodMonthly * splitPercentPartner) / 100).toFixed(0)} Socio • ${((streetFoodMonthly * splitPercentMaster) / 100).toFixed(0)} VAMO
                  </span>
                </div>

                {/* 2. Locales / Carnicerías / Ferreterías */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-blue-700">
                    <div className="flex items-center gap-1">
                      <span>🏬</span>
                      <strong className="text-[11px]">Locales / Ferreterías</strong>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={localStoreMonthly}
                      onChange={(e) => setLocalStoreMonthly(Number(e.target.value))}
                      className="w-full pl-6 pr-12 py-1.5 bg-[#fcf9f8] border border-slate-200 rounded-lg font-black text-sm text-[#1c1b1b] focus:outline-hidden focus:border-[#0056d2]"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">MXN/mes</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    ${((localStoreMonthly * splitPercentPartner) / 100).toFixed(0)} Socio • ${((localStoreMonthly * splitPercentMaster) / 100).toFixed(0)} VAMO
                  </span>
                </div>

                {/* 3. Restaurantes KDS */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-1">
                      <span>👨‍🍳</span>
                      <strong className="text-[11px]">Restaurantes KDS</strong>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={restaurantMonthly}
                      onChange={(e) => setRestaurantMonthly(Number(e.target.value))}
                      className="w-full pl-6 pr-12 py-1.5 bg-[#fcf9f8] border border-slate-200 rounded-lg font-black text-sm text-[#1c1b1b] focus:outline-hidden focus:border-[#0056d2]"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">MXN/mes</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    ${((restaurantMonthly * splitPercentPartner) / 100).toFixed(0)} Socio • ${((restaurantMonthly * splitPercentMaster) / 100).toFixed(0)} VAMO
                  </span>
                </div>

                {/* 4. Repartidores / Motos por Semana */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-indigo-700">
                    <div className="flex items-center gap-1">
                      <span>🛵</span>
                      <strong className="text-[11px]">Motociclista Activo</strong>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={driverWeekly}
                      onChange={(e) => setDriverWeekly(Number(e.target.value))}
                      className="w-full pl-6 pr-12 py-1.5 bg-[#fcf9f8] border border-slate-200 rounded-lg font-black text-sm text-[#1c1b1b] focus:outline-hidden focus:border-[#0056d2]"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">MXN/sem</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    ${((driverWeekly * splitPercentPartner) / 100).toFixed(0)} Socio • ${((driverWeekly * splitPercentMaster) / 100).toFixed(0)} VAMO
                  </span>
                </div>

              </div>
            </div>

            {/* Mensaje de Éxito */}
            {created && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-800 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-black text-sm">¡Plaza Creada Exitosamente!</p>
                  <p>Código Territorial Generado: <strong>{generatedCode}</strong>. Redirigiendo al listado...</p>
                </div>
              </div>
            )}

              {/* Botón de Guardado */}
            <VamoButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={created}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Habilitar Plaza y Generar Código de Territorio
            </VamoButton>

          </form>

        </main>
      </div>
    </div>
  )
}
