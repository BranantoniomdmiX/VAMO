'use client'

import React, { useState } from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { PhoneCall, MapPin, Navigation, DollarSign, CheckCircle2 } from 'lucide-react'

export default function BaseCallRegisterPage() {
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setCustomerName('')
      setPhone('')
      setOrigin('')
      setDestination('')
      setNotes('')
    }, 2500)
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="call" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Registro Telefónico de Pedido</h1>
            <p className="text-xs text-[#737785] font-semibold">Formulario de captura rápida para llamadas a la base</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Nombre del Cliente</label>
                <input 
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Ej. Don Manuel"
                  required
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Teléfono de Contacto</label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej. 555-123-4567"
                  required
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#0056d2] uppercase flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Origen (Donde recoger)
              </label>
              <input 
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                placeholder="Ej. Farmacia del Centro"
                required
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#726200] uppercase flex items-center gap-1">
                <Navigation className="w-4 h-4 text-[#fddf33]" /> Destino (Donde entregar)
              </label>
              <input 
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="Ej. Calle Morelos #89"
                required
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#1c1b1b] uppercase">Instrucciones o Notas</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej. Comprar medicamentos y llevar recibo..."
                rows={2}
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              />
            </div>

            {success ? (
              <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-full text-center font-extrabold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>¡PEDIDO TELEFÓNICO REGISTRADO Y ENVIADO A CONSOLA!</span>
              </div>
            ) : (
              <button 
                type="submit"
                className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-4 rounded-full font-black text-xs shadow-md active:scale-95 transition-all"
              >
                REGISTRAR Y DISPARAR DESPACHO
              </button>
            )}

          </form>
        </main>
      </div>
    </div>
  )
}
