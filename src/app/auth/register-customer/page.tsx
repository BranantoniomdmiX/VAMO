'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Phone, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RegisterCustomerPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(true)
    setTimeout(() => router.push('/customer/home'), 1500)
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] font-sans flex flex-col justify-between p-4 sm:p-8 selection:bg-[#0056d2] selection:text-white">
      <header className="max-w-md mx-auto w-full">
        <Link href="/auth/login" className="flex items-center gap-2 bg-white border border-[#e5e2e1] px-4 py-2 rounded-full text-xs font-bold text-[#0056d2] w-fit shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a Login
        </Link>
      </header>

      <main className="max-w-md mx-auto w-full my-auto space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-[#0056d2]">Registro Rápido de Cliente</h1>
          <p className="text-xs font-semibold text-[#737785]">Crea tu cuenta en menos de 1 minuto para pedir motomandados</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4">
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

          {success ? (
            <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-full text-center font-black text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>¡CUENTA CREADA! ENTRANDO A VAMO...</span>
            </div>
          ) : (
            <button 
              type="submit"
              className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-full font-black text-xs shadow-md active:scale-95 transition-all"
            >
              CREAR MI CUENTA GRATIS
            </button>
          )}
        </form>
      </main>

      <footer className="text-center text-xs font-semibold text-[#737785]">
        VAMO Logística Vecinal &bull; 2026
      </footer>
    </div>
  )
}
