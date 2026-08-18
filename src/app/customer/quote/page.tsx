'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { MapPin, Navigation, DollarSign, Bike, ArrowRight, ShieldCheck, Check, Loader2, Plus, Trash2, Bookmark, Star, Home, Briefcase, Building, Route, Package } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { createServiceFromBase } from '@/lib/services/serviceActions'

interface SavedAddress {
  id: string
  label: string
  address: string
  icon: 'home' | 'work' | 'other'
}

const DEFAULT_SAVED_ADDRESSES: SavedAddress[] = [
  { id: '1', label: 'Casa', address: 'Av. Hidalgo #104, Centro', icon: 'home' },
  { id: '2', label: 'Oficina', address: 'Plaza Galerías Local 12, Zona Norte', icon: 'work' },
  { id: '3', label: 'Sucursal Juárez', address: 'Calle Juárez #452, Col. San José', icon: 'other' }
]

function QuoteContent() {
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'multistop' ? 'multistop' : 'direct'
  const [serviceMode, setServiceMode] = useState<'direct' | 'multistop'>(initialMode)

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [intermediateStops, setIntermediateStops] = useState<string[]>(initialMode === 'multistop' ? [''] : [])
  
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(DEFAULT_SAVED_ADDRESSES)
  const [newLabel, setNewLabel] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [targetToSave, setTargetToSave] = useState<string>('')

  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('mode') === 'multistop') {
      setServiceMode('multistop')
      if (intermediateStops.length === 0) {
        setIntermediateStops([''])
      }
    }
  }, [searchParams])

  // Cargar direcciones guardadas de localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_saved_addresses')
      if (stored) {
        setSavedAddresses(JSON.parse(stored))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Guardar nueva dirección frecuente
  const handleSaveAddress = (addressText: string) => {
    if (!addressText.trim() || !newLabel.trim()) return
    const updated = [
      ...savedAddresses,
      { id: Date.now().toString(), label: newLabel.trim(), address: addressText.trim(), icon: 'other' as const }
    ]
    setSavedAddresses(updated)
    try {
      localStorage.setItem('vamo_saved_addresses', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
    setNewLabel('')
    setShowSaveModal(false)
  }

  // Manejar paradas dinámicas
  const handleAddStop = () => {
    if (intermediateStops.length >= 4) return
    setIntermediateStops([...intermediateStops, ''])
  }

  const handleUpdateStop = (index: number, value: string) => {
    const updated = [...intermediateStops]
    updated[index] = value
    setIntermediateStops(updated)
  }

  const handleRemoveStop = (index: number) => {
    setIntermediateStops(intermediateStops.filter((_, i) => i !== index))
  }

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination) return
    setIsCalculating(true)

    setTimeout(() => {
      const stopsCount = serviceMode === 'multistop' ? intermediateStops.filter(Boolean).length : 0
      const calculatedKm = 3.5 + (stopsCount * 1.8)
      const baseFee = 35
      const stopFee = stopsCount * 15
      const total = baseFee + (calculatedKm * 8) + stopFee

      setDistanceKm(Number(calculatedKm.toFixed(1)))
      setEstimatedPrice(Math.round(total))
      setIsCalculating(false)
    }, 400)
  }

  const handleCreateOrder = async () => {
    setIsSubmitting(true)
    const validStops = serviceMode === 'multistop' ? intermediateStops.filter(Boolean) : []
    const fullRouteSummary = [origin, ...validStops, destination].join(' ➔ ')
    
    const result = await createServiceFromBase({
      tenantId: '00000000-0000-0000-0000-000000000001',
      customerName: 'Cliente Web VAMO',
      phone: '5551234567',
      originAddress: origin || 'Av. Hidalgo #104, Centro',
      destinationAddress: `${destination} (${serviceMode === 'multistop' ? 'Multi-Parada' : 'Directo'}: ${fullRouteSummary})`,
      totalPrice: estimatedPrice || 63,
      serviceType: 'DIRECT'
    })

    setIsSubmitting(false)
    if (result && result.service) {
      router.push(`/customer/tracking/${result.service.id}`)
    } else {
      router.push('/customer/tracking/demo-123')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header Cotizador */}
      <header className="text-center space-y-1">
        <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-3.5 py-1 rounded-full uppercase">
          {serviceMode === 'multistop' ? 'DILIGENCIA MULTI-PARADAS' : 'ENVÍO DIRECTO PUNTO A ➔ B'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c1b1b]">
          {serviceMode === 'multistop' ? 'Ruta de Múltiples Paradas' : 'Cotizar Envío de Paquete'}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-[#737785]">
          {serviceMode === 'multistop' 
            ? 'Pasa a recoger y entregar en varias direcciones en una sola vuelta'
            : 'Calcula tu tarifa fija transparente en segundos'}
        </p>
      </header>

      {/* Selector de Modalidad (Directo vs Multi-Paradas) */}
      <div className="flex bg-[#e5e2e1] p-1.5 rounded-full text-xs font-bold shadow-inner">
        <button
          type="button"
          onClick={() => {
            setServiceMode('direct')
            setEstimatedPrice(null)
          }}
          className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${
            serviceMode === 'direct' ? 'bg-[#0056d2] text-white shadow-sm font-black' : 'text-[#737785]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Envío Directo (A ➔ B)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setServiceMode('multistop')
            if (intermediateStops.length === 0) setIntermediateStops([''])
            setEstimatedPrice(null)
          }}
          className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${
            serviceMode === 'multistop' ? 'bg-[#161e00] text-[#c3f400] shadow-sm font-black' : 'text-[#737785]'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Multi-Paradas (+15/parada)</span>
        </button>
      </div>

      {/* Acceso Rápido a Direcciones Guardadas */}
      <div className="bg-white p-4 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-2">
        <span className="text-[11px] font-extrabold text-[#737785] uppercase tracking-wider flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-[#0056d2] fill-[#0056d2]" /> Mis Direcciones Frecuentes
        </span>
        <div className="flex flex-wrap gap-2">
          {savedAddresses.map(sa => (
            <div key={sa.id} className="flex items-center gap-1 bg-[#f6f3f2] hover:bg-[#e5e2e1] border border-[#e5e2e1] rounded-2xl px-3 py-1.5 transition-all text-xs font-extrabold text-[#1c1b1b]">
              <span>{sa.label}:</span>
              <span className="text-[#737785] font-semibold max-w-[120px] truncate">{sa.address}</span>
              <button
                type="button"
                onClick={() => setOrigin(sa.address)}
                className="ml-1 text-[10px] bg-[#0056d2] text-white px-2 py-0.5 rounded-full hover:bg-[#0040a1]"
                title="Usar como Origen"
              >
                Origen
              </button>
              <button
                type="button"
                onClick={() => setDestination(sa.address)}
                className="text-[10px] bg-[#fddf33] text-[#726200] px-2 py-0.5 rounded-full hover:bg-[#e6c91c]"
                title="Usar como Destino"
              >
                Destino
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de Cotización */}
      <form onSubmit={handleCalculate} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-5">
        
        {/* Campo 1: Origen */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-extrabold text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> 1. Punto de Origen (Recoger)
            </label>
            {origin && (
              <button
                type="button"
                onClick={() => { setTargetToSave(origin); setShowSaveModal(true) }}
                className="text-[11px] font-extrabold text-[#0056d2] hover:underline flex items-center gap-1"
              >
                <Bookmark className="w-3 h-3" /> Guardar
              </button>
            )}
          </div>
          <input 
            type="text" 
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            placeholder="Ej. Av. Hidalgo #104, Centro"
            required
            className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-colors"
          />
        </div>

        {/* Paradas Intermedias en Modo Multi-Parada */}
        {serviceMode === 'multistop' && (
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center border-b border-[#e5e2e1] pb-1.5">
              <span className="text-xs font-extrabold text-[#161e00] uppercase tracking-wider">
                Paradas Intermedias ({intermediateStops.length})
              </span>
              {intermediateStops.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="text-xs font-black text-[#0056d2] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Agregar Otra Parada
                </button>
              )}
            </div>

            {intermediateStops.map((stop, index) => (
              <div key={index} className="space-y-1.5 animate-fade-in pl-3 border-l-2 border-[#c3f400]">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-[#161e00] uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#0056d2]" /> Parada #{index + 1}
                  </label>
                  {intermediateStops.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(index)}
                      className="text-xs font-bold text-[#ba1a1a] hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Quitar
                    </button>
                  )}
                </div>
                <input 
                  type="text" 
                  value={stop}
                  onChange={e => handleUpdateStop(index, e.target.value)}
                  placeholder={`Ej. Parada #${index + 1}: Farmacia / Recoger llaves / Dejar paquete`}
                  required
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {/* Campo 2: Destino */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-extrabold text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4" /> {serviceMode === 'multistop' ? `${intermediateStops.length + 2}. Destino Final (Entregar)` : '2. Punto de Destino (Entregar)'}
            </label>
            {destination && (
              <button
                type="button"
                onClick={() => { setTargetToSave(destination); setShowSaveModal(true) }}
                className="text-[11px] font-extrabold text-[#0056d2] hover:underline flex items-center gap-1"
              >
                <Bookmark className="w-3 h-3" /> Guardar
              </button>
            )}
          </div>
          <input 
            type="text" 
            value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder="Ej. Calle Juárez #452, Col. San José"
            required
            className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isCalculating}
          className="w-full bg-[#0056d2] hover:bg-[#0040a1] disabled:bg-[#0056d2]/70 text-white py-4 rounded-full font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>CALCULANDO RUTA Y TARIFA...</span>
            </>
          ) : (
            <span>CALCULAR TARIFA FIJA TRANSPARENTE</span>
          )}
        </button>
      </form>

      {/* Tarjeta de Cotización Estimada */}
      {estimatedPrice !== null && (
        <div className="bg-[#161e00] text-white p-6 sm:p-8 rounded-[32px] border border-[#c3f400]/40 shadow-xl space-y-4 text-center animate-fade-in">
          <div>
            <span className="text-xs font-extrabold text-[#c3f400] uppercase tracking-wider block">TARIFA FIJA TRANSPARENTE</span>
            <p className="text-5xl font-black text-[#c3f400] mt-1">${estimatedPrice.toFixed(2)} MXN</p>
            <p className="text-xs font-bold text-slate-300 mt-2">
              Distancia estimada: {distanceKm} km &bull; {serviceMode === 'multistop' ? `${intermediateStops.length} Paradas intermedias` : 'Envío directo sin escalas'}
            </p>
          </div>

          <button
            onClick={handleCreateOrder}
            disabled={isSubmitting}
            className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-4 rounded-full font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Bike className="w-5 h-5" />
            <span>{isSubmitting ? 'SOLICITANDO REPARTIDOR...' : 'CONFIRMAR Y SOLICITAR MOTO VAMO'}</span>
          </button>
        </div>
      )}

      {/* Modal Guardar Dirección */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in border border-[#e5e2e1]">
            <h3 className="text-base font-extrabold text-[#1c1b1b]">Guardar en Direcciones Frecuentes</h3>
            <p className="text-xs text-[#737785] truncate">{targetToSave}</p>
            <div>
              <label className="text-[11px] font-bold text-[#737785] block mb-1">Nombre / Etiqueta (Ej. Casa, Trabajo, Taller)</label>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="Ej. Casa de Mamá"
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-xl px-3 py-2 text-xs font-bold outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSaveAddress(targetToSave)}
                className="flex-1 bg-[#0056d2] text-white py-2.5 rounded-full text-xs font-bold active:scale-95"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 bg-[#f0eded] text-[#1c1b1b] py-2.5 rounded-full text-xs font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function CustomerQuotePage() {
  return (
    <CustomerLayout>
      <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Cargando cotizador...</div>}>
        <QuoteContent />
      </Suspense>
    </CustomerLayout>
  )
}
