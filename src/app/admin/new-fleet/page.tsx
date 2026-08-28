'use client'

import React, { useState } from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { PlusCircle, Building2, MapPin, CheckCircle2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminNewFleetPage() {
  const router = useRouter()
  const [fleetName, setFleetName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [planType, setPlanType] = useState<'FRANCHISE_TERRITORIAL' | 'SAAS_FLEET' | 'SELF_DELIVERY'>('FRANCHISE_TERRITORIAL')
  const [entryFee, setEntryFee] = useState(85000)
  const [monthlySaaS, setMonthlySaaS] = useState(4000)
  const [created, setCreated] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')

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
      email: email.trim(),
      riders: 0,
      merchants: 0,
      planName: planType === 'FRANCHISE_TERRITORIAL'
        ? 'Modalidad A: Socio Comercial Territorial Exclusivo'
        : planType === 'SAAS_FLEET'
        ? 'Modalidad B: Renta SaaS Flota Externa'
        : 'Modalidad C: Módulo Self-Delivery',
      entryFee: planType === 'FRANCHISE_TERRITORIAL' ? entryFee : 0,
      monthlySaaS: monthlySaaS,
      royaltyPerTrip: planType === 'FRANCHISE_TERRITORIAL' ? 2.50 : 0,
      billingCycle: 'MENSUAL',
      totalDue: monthlySaaS,
      paymentStatus: 'PAGADO',
      status: 'active',
      createdAt: new Date().toISOString()
    }

    try {
      const existing = localStorage.getItem('vamo_fleets')
      const fleetsList = existing ? JSON.parse(existing) : []
      fleetsList.unshift(newFleet)
      localStorage.setItem('vamo_fleets', JSON.stringify(fleetsList))

      // Guardar también el código de flota en la lista de códigos disponibles
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
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Alta de Nuevo Socio Comercial / Plaza</h1>
            <p className="text-xs text-[#737785] font-semibold">Crea una nueva plaza territorial o flota y genera sus accesos</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Nombre de la Plaza / Flotilla</label>
              <input 
                type="text"
                value={fleetName}
                onChange={e => setFleetName(e.target.value)}
                placeholder="Ej. Plaza VAMO Toluca Centro"
                required
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Modalidad de Comercialización</label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value as any)}
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none cursor-pointer"
              >
                <option value="FRANCHISE_TERRITORIAL">Modalidad A: Socio Comercial Territorial Exclusivo ($85,000 setup)</option>
                <option value="SAAS_FLEET">Modalidad B: Renta SaaS Flota Externa ($200/moto)</option>
                <option value="SELF_DELIVERY">Modalidad C: Módulo Self-Delivery para Cadenas ($650/mes)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Nombre del Socio Titular</label>
                <input 
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="Ej. Ing. Roberto Martínez"
                  required
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Ciudad / Plaza</label>
                <input 
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Ej. Toluca, EdoMex"
                  required
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Correo Electrónico del Socio Comercial</label>
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="socio.toluca@vamo.lat"
                required
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              />
            </div>

            {created ? (
              <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-2xl text-center font-extrabold text-xs flex flex-col items-center justify-center gap-1 shadow-md animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>¡PLAZA CREADA CON ÉXITO!</span>
                </div>
                <p className="text-[11px] font-bold">Código de Alta Generado: <span className="font-mono text-black underline">{generatedCode}</span></p>
                <span className="text-[10px] text-slate-700">Redirigiendo a Gestión de Plazas...</span>
              </div>
            ) : (
              <button 
                type="submit"
                className="w-full bg-[#0056d2] hover:bg-[#0040A1] text-white py-4 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>CREAR INSTANCIA Y REGISTRAR SOCIO COMERCIAL</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

          </form>
        </main>
      </div>
    </div>
  )
}
