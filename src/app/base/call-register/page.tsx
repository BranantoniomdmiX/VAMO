'use client'

import React, { useState } from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { 
  PhoneCall, 
  MapPin, 
  Navigation, 
  DollarSign, 
  CheckCircle2, 
  History, 
  User, 
  Phone, 
  Bike, 
  Repeat, 
  Search,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react'
import { createServiceFromBase } from '@/lib/services/serviceActions'

interface PhoneOrderRecord {
  id: string
  folio: string
  customerName: string
  phone: string
  origin: string
  destination: string
  category: string
  amount: number
  driver: string
  status: 'DESPACHADO' | 'EN_CAMINO' | 'ENTREGADO'
  time: string
}

export default function BaseCallRegisterPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create')
  
  // Form State
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [category, setCategory] = useState('Comida / Restaurante')
  const [notes, setNotes] = useState('')
  const [suggestedPrice, setSuggestedPrice] = useState(45.00)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Bitácora de llamadas del turno (Carga reactiva limpia)
  const [callHistory, setCallHistory] = useState<PhoneOrderRecord[]>([])

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_call_register_history')
      if (stored) {
        setCallHistory(JSON.parse(stored))
      }
    } catch {}
  }, [])

  const [searchTerm, setSearchTerm] = useState('')

  const handleQuickCustomer = (name: string, tel: string, defaultOrigin: string, defaultDest: string) => {
    setCustomerName(name)
    setPhone(tel)
    setOrigin(defaultOrigin)
    setDestination(defaultDest)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const newFolio = `#TEL-${Math.floor(9046 + Math.random() * 50)}`
    
    // Crear servicio en backend
    await createServiceFromBase({
      tenantId: '00000000-0000-0000-0000-000000000001',
      customerName: customerName || 'Cliente Telefónico',
      phone: phone || 'Sin teléfono',
      originAddress: origin,
      destinationAddress: destination,
      totalPrice: suggestedPrice,
      serviceType: 'DIRECT'
    })

    const newRecord: PhoneOrderRecord = {
      id: Date.now().toString(),
      folio: newFolio,
      customerName,
      phone,
      origin,
      destination,
      category,
      amount: suggestedPrice,
      driver: 'Auto-despachado a flota más cercana',
      status: 'DESPACHADO',
      time: 'Justo ahora'
    }

    setCallHistory([newRecord, ...callHistory])
    setIsSubmitting(false)
    setSuccessMessage(`¡Pedido ${newFolio} creado y enviado a la Consola de Despacho!`)

    setTimeout(() => {
      setSuccessMessage(null)
      setCustomerName('')
      setPhone('')
      setOrigin('')
      setDestination('')
      setNotes('')
    }, 3500)
  }

  const handleReorder = (order: PhoneOrderRecord) => {
    setCustomerName(order.customerName)
    setPhone(order.phone)
    setOrigin(order.origin)
    setDestination(order.destination)
    setSuggestedPrice(order.amount)
    setActiveTab('create')
  }

  const filteredHistory = callHistory.filter(c => 
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.folio.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="call" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#0040a1] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                CENTRAL TELEFÓNICA VAMO
              </span>
              <span className="text-xs text-slate-400 font-bold">• Línea de Despacho 24/7</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-0.5">
              Recepción Telefónica & Despacho Manual
            </h1>
          </div>

          {/* Selector de Pestañas: [ + Capturar Pedido ] vs [ 📋 Bitácora del Turno ] */}
          <div className="flex bg-slate-100 p-1 rounded-full text-xs font-bold border border-slate-200">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'create' 
                  ? 'bg-[#0040a1] text-white shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📞 + Nueva Llamada
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-[#0040a1] text-white shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 Bitácora del Turno ({callHistory.length})
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
          
          {/* Notificación de Éxito */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-xs animate-bounce text-xs font-black">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button 
                onClick={() => setSuccessMessage(null)}
                className="text-xs text-emerald-700 underline font-bold"
              >
                Cerrar
              </button>
            </div>
          )}

          {activeTab === 'create' ? (
            /* FORMULARIO DE CAPTURA RÁPIDA */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Columna Principal: Formulario */}
              <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Datos del Pedido Telefónico
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    ⚡ Auto-Despacho Activo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Nombre del Cliente</label>
                    <input 
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Ej. Don Manuel Rodríguez"
                      required
                      className="w-full bg-white border border-slate-200 focus:border-[#0040a1] rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Teléfono de Contacto</label>
                    <input 
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ej. 461-123-4567"
                      required
                      className="w-full bg-white border border-slate-200 focus:border-[#0040a1] rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#0056d2] uppercase flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Origen (Dónde recoger)
                    </label>
                    <input 
                      type="text"
                      value={origin}
                      onChange={e => setOrigin(e.target.value)}
                      placeholder="Ej. Farmacia Guadalajara Centro"
                      required
                      className="w-full bg-white border border-slate-200 focus:border-[#0040a1] rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-amber-500" /> Destino (Dónde entregar)
                    </label>
                    <input 
                      type="text"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      placeholder="Ej. Calle Morelos #89, Centro"
                      required
                      className="w-full bg-white border border-slate-200 focus:border-[#0040a1] rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Giro / Categoría</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-[#0040a1] rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option>Comida / Restaurante</option>
                      <option>Farmacia / Urgente</option>
                      <option>Documentos / Paquetería</option>
                      <option>Ferretería / Materiales</option>
                      <option>Mandado Personal</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Tarifa Cobro al Cliente ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                      <input 
                        type="number"
                        value={suggestedPrice}
                        onChange={e => setSuggestedPrice(Number(e.target.value))}
                        min={20}
                        required
                        className="w-full bg-white border border-slate-200 focus:border-[#0040a1] rounded-xl pl-6 pr-3.5 py-2.5 text-xs font-black text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Instrucciones Adicionales para el Conductor</label>
                  <input 
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ej. Tocar el timbre blanco, pagar $120 en mostrador..."
                    className="w-full bg-white border border-slate-200 focus:border-[#0040a1] rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-4 rounded-full font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{isSubmitting ? 'ENVIANDO A CONSOLA...' : 'CREAR Y DESPACHAR A FLOTA VAMO ⚡'}</span>
                </button>
              </form>

              {/* Columna Lateral: Clientes Frecuentes 1-Tap */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-[#0040a1] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Sparkles className="w-4 h-4 text-[#0040a1]" />
                    <span>Clientes Frecuentes (1-Tap)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Toca para autocompletar al instante los datos de un cliente habitual:
                  </p>

                  <div className="space-y-2">
                    {[
                      { name: 'Don Manuel Rodríguez', phone: '461-123-4567', orig: 'Farmacia Guadalajara', dest: 'Calle Morelos #89' },
                      { name: 'Dra. Sofía Mendoza', phone: '461-555-8811', orig: 'Laboratorio San José', dest: 'Hospital General' },
                      { name: 'Lic. Fernando Soto', phone: '461-445-9988', orig: 'Notaría #4', dest: 'Banorte Plaza' }
                    ].map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickCustomer(c.name, c.phone, c.orig, c.dest)}
                        className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all group cursor-pointer"
                      >
                        <strong className="text-xs font-black text-slate-900 group-hover:text-[#0040a1] block">{c.name}</strong>
                        <span className="text-[10px] font-semibold text-slate-500 block">{c.phone}</span>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">➔ {c.dest}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resumen de Flotas */}
                <div className="bg-[#0040a1] text-white p-5 rounded-[28px] border border-blue-800 shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-xs font-black text-blue-200 uppercase">
                    <span>Motos en Turno</span>
                    <span className="bg-[#c3f400] text-[#161e00] px-2 py-0.5 rounded-full text-[10px]">12 ACTIVAS</span>
                  </div>
                  <p className="text-2xl font-black text-[#c3f400]">4 Disponibles</p>
                  <p className="text-[11px] text-blue-200 font-medium">Tiempo de respuesta promedio: 4.2 minutos.</p>
                </div>
              </div>

            </div>
          ) : (
            /* PESTAÑA: BITÁCORA DEL TURNO */
            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Bitácora de Llamadas & Pedidos del Turno</h3>
                  <p className="text-xs text-slate-500 font-medium">Registro cronológico de pedidos atendidos telefónicamente</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text"
                    placeholder="Buscar por cliente o teléfono..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs font-bold outline-none focus:bg-white focus:border-[#0040a1]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-black text-slate-900">{item.folio}</strong>
                        <span className="text-xs font-bold text-slate-700">• {item.customerName}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">{item.phone}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          item.status === 'ENTREGADO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-[#0056d2] border border-blue-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <span>{item.origin}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-slate-800 font-semibold">{item.destination}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">
                        🕒 {item.time} &bull; Conductor: <span className="text-slate-700">{item.driver}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-black text-[#0056d2] mr-2">${item.amount.toFixed(2)} MXN</span>
                      <button
                        onClick={() => handleReorder(item)}
                        className="bg-white hover:bg-blue-50 text-[#0040a1] border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title="Re-ordenar pedido idéntico"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Re-ordenar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
