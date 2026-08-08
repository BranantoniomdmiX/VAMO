'use client'

import React, { useState } from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { PlusCircle, Building2, MapPin, CheckCircle2 } from 'lucide-react'

export default function AdminNewFleetPage() {
  const [fleetName, setFleetName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [created, setCreated] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCreated(true)
    setTimeout(() => {
      setCreated(false)
      setFleetName('')
      setOwnerName('')
      setCity('')
      setEmail('')
    }, 2500)
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="new-fleet" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Alta de Nueva Flota / Tenant SaaS</h1>
            <p className="text-xs text-[#737785] font-semibold">Registro e inicie de operaciones para una nueva ciudad o cliente</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Nombre de la Flotilla / Empresa</label>
              <input 
                type="text"
                value={fleetName}
                onChange={e => setFleetName(e.target.value)}
                placeholder="Ej. VAMO Motomandados Toluca"
                required
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Nombre del Dueño</label>
                <input 
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="Ej. Roberto Martínez"
                  required
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Ciudad de Operación</label>
                <input 
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Ej. Toluca, Estado de México"
                  required
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Correo Electrónico Corporativo</label>
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contacto@famotoluca.com"
                required
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              />
            </div>

            {created ? (
              <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-full text-center font-extrabold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>¡NUEVA FLOTA REGISTRADA Y TENANT SAAS CREADO CON ÉXITO!</span>
              </div>
            ) : (
              <button 
                type="submit"
                className="w-full bg-[#1c1b1b] hover:bg-black text-[#c3f400] py-4 rounded-full font-black text-xs shadow-md active:scale-95 transition-all"
              >
                REGISTRAR TENANT Y CREAR INSTANCIA
              </button>
            )}

          </form>
        </main>
      </div>
    </div>
  )
}
