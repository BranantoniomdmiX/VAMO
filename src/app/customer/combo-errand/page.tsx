'use client'

import React, { useState } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { ShoppingBag, Pill, Store, Navigation, MapPin, Plus, Trash2, Bike, ArrowRight, Loader2, Sparkles, CheckCircle2, ShieldCheck, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createServiceFromBase } from '@/lib/services/serviceActions'

interface ComboStoreItem {
  id: string
  category: 'restaurant' | 'pharmacy' | 'convenience' | 'hardware' | 'other'
  storeName: string
  itemsDescription: string
  estimatedAmount: number
}

const PRESET_STORES = [
  { name: 'Taquería El Pastor', category: 'restaurant' as const, defaultItem: '2 Órdenes de tacos al pastor con salsa', amount: 140 },
  { name: 'Farmacia Guadalajara', category: 'pharmacy' as const, defaultItem: '1 Jarabe para la tos + Paracetamol 500mg', amount: 110 },
  { name: 'Tienda OXXO Centro', category: 'convenience' as const, defaultItem: '1 Refresco 2L + Botana', amount: 65 },
  { name: 'Ferretería La Tuerca', category: 'hardware' as const, defaultItem: '1 Cinta de aislar + Clavos 2 pulgadas', amount: 80 }
]

export default function CustomerComboErrandPage() {
  const [items, setItems] = useState<ComboStoreItem[]>([
    { id: '1', category: 'restaurant', storeName: 'Taquería El Pastor', itemsDescription: '2 Órdenes de tacos al pastor con salsa', estimatedAmount: 140 },
    { id: '2', category: 'pharmacy', storeName: 'Farmacia Guadalajara', itemsDescription: '1 Jarabe para la tos + Paracetamol', estimatedAmount: 110 }
  ])
  const [deliveryAddress, setDeliveryAddress] = useState('Av. Hidalgo #104, Col. Centro')
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estimatedFreight, setEstimatedFreight] = useState<number>(75)
  const router = useRouter()

  const handleAddItem = () => {
    if (items.length >= 3) return
    setItems([
      ...items,
      { id: Date.now().toString(), category: 'convenience', storeName: '', itemsDescription: '', estimatedAmount: 50 }
    ])
  }

  const handleSelectPreset = (id: string, preset: typeof PRESET_STORES[0]) => {
    setItems(items.map(it => it.id === id ? {
      ...it,
      storeName: preset.name,
      category: preset.category,
      itemsDescription: preset.defaultItem,
      estimatedAmount: preset.amount
    } : it))
  }

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return
    setItems(items.filter(item => item.id !== id))
  }

  const handleUpdateItem = (id: string, field: keyof ComboStoreItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const productsTotal = items.reduce((acc, it) => acc + (Number(it.estimatedAmount) || 0), 0)
  const grandTotal = productsTotal + estimatedFreight

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    setIsCalculating(true)
    setTimeout(() => {
      // Tarifa Combinada: Base $45 + $15 por comercio adicional (Ahorra fletes separados de $45 c/u)
      const baseFee = 45
      const extraStoreFee = (items.length - 1) * 15
      setEstimatedFreight(baseFee + extraStoreFee)
      setIsCalculating(false)
    }, 400)
  }

  const handleCreateComboOrder = async () => {
    setIsSubmitting(true)
    const storesSummary = items.map((it, idx) => `[Comercio #${idx+1}: ${it.storeName || 'Tienda'} - ${it.itemsDescription} ($${it.estimatedAmount})]`).join(' + ')
    
    const result = await createServiceFromBase({
      tenantId: '00000000-0000-0000-0000-000000000001',
      customerName: 'Cliente Web VAMO',
      phone: '5551234567',
      originAddress: `ENCARGO COMBINADO (${items.length} Locales): ${storesSummary}`,
      destinationAddress: deliveryAddress || 'Av. Hidalgo #104, Centro',
      totalPrice: grandTotal,
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
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#161e00] text-[#c3f400] px-4 py-1.5 rounded-full text-xs font-black shadow-xs">
            <Sparkles className="w-4 h-4" />
            <span>ENCARGO MULTITIENDA EN 1 SOLO VIAJE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Encargo Combinado Multitienda</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            Pide de 2 comercios distintos en 1 solo proceso de pago y recíbelo en 1 sola moto optimizada.
          </p>
        </header>

        {/* Itinerario Visual de Paradas de la Moto */}
        <div className="bg-white p-4 sm:p-5 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-3">
          <span className="text-[11px] font-black uppercase text-[#0056d2] tracking-wider block">
            🗺️ RUTA OPTIMIZADA DE LA MOTO ({items.length + 1} PARADAS)
          </span>

          <div className="flex flex-col sm:flex-row items-center gap-2 text-xs font-bold">
            {items.map((it, idx) => (
              <React.Fragment key={it.id}>
                <div className="bg-slate-100 text-slate-900 px-3 py-2 rounded-xl flex items-center gap-2 w-full sm:w-auto border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-[#0056d2] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                    {idx + 1}
                  </span>
                  <span className="truncate">{it.storeName || `Comercio #${idx+1}`}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />
              </React.Fragment>
            ))}

            <div className="bg-[#0040a1] text-white px-3 py-2 rounded-xl flex items-center gap-2 w-full sm:w-auto border border-blue-800">
              <span className="w-5 h-5 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center text-[10px] font-black shrink-0">
                🏁
              </span>
              <span className="truncate">Tu Domicilio</span>
            </div>
          </div>
        </div>

        {/* Formulario de Locales y Productos */}
        <form onSubmit={handleCalculate} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-5">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Establecimientos & Artículos ({items.length})
            </h3>
            {items.length < 3 && (
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-black text-[#0056d2] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agregar Comercio
              </button>
            )}
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="bg-slate-50 p-4 sm:p-5 rounded-[24px] border border-slate-200 space-y-3 relative group animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-[#0056d2] uppercase flex items-center gap-1.5">
                  {item.category === 'restaurant' ? <ShoppingBag className="w-4 h-4 text-[#0056d2]" /> : <Pill className="w-4 h-4 text-[#0056d2]" />}
                  Comercio #{idx + 1}
                </span>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Botones de Selección Rápida */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                {PRESET_STORES.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleSelectPreset(item.id, preset)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all border ${
                      item.storeName === preset.name
                        ? 'bg-[#0056d2] text-white border-[#0056d2]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre del Local</label>
                  <input
                    type="text"
                    value={item.storeName}
                    onChange={e => handleUpdateItem(item.id, 'storeName', e.target.value)}
                    placeholder="Ej. Farmacia del Ahorro, Tacos..."
                    required
                    className="w-full bg-white border border-slate-200 focus:border-[#0056d2] rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Costo Estimado</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      value={item.estimatedAmount}
                      onChange={e => handleUpdateItem(item.id, 'estimatedAmount', Number(e.target.value))}
                      min={10}
                      required
                      className="w-full bg-white border border-slate-200 focus:border-[#0056d2] rounded-xl pl-6 pr-3 py-2 text-xs font-black text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">¿Qué pedimos aquí?</label>
                <input
                  type="text"
                  value={item.itemsDescription}
                  onChange={e => handleUpdateItem(item.id, 'itemsDescription', e.target.value)}
                  placeholder="Ej. 1 Jarabe Vick + 1 Tempra 500mg"
                  required
                  className="w-full bg-white border border-slate-200 focus:border-[#0056d2] rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
              </div>
            </div>
          ))}

          {/* Domicilio de Destino */}
          <div className="space-y-1 pt-2">
            <label className="text-xs font-extrabold text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-[#0056d2]" /> Dirección de Entrega Final (Tu Domicilio)
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="Ej. Av. Hidalgo #104, Centro"
              required
              className="w-full bg-white border border-slate-200 focus:border-[#0056d2] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isCalculating}
            className="w-full bg-[#0056d2] hover:bg-[#0040a1] disabled:bg-[#0056d2]/70 text-white py-3.5 rounded-full font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#c3f400]" />
                <span>OPTIMIZANDO RUTA MULTITIENDA...</span>
              </>
            ) : (
              <span>RECALCULAR FLETE COMBINADO ({items.length} LOCALES) ⚡</span>
            )}
          </button>
        </form>

        {/* Tarjeta de Resumen y Checkout Unificado */}
        <div className="bg-[#0040a1] text-white p-6 sm:p-8 rounded-[32px] border border-blue-800 shadow-lg space-y-4 animate-fade-in">
          <div className="space-y-2 border-b border-blue-800 pb-4 text-xs font-bold">
            <div className="flex justify-between text-blue-200">
              <span>Artículos de los {items.length} Comercios:</span>
              <span className="text-white font-black">${productsTotal.toFixed(2)} MXN</span>
            </div>
            <div className="flex justify-between text-[#c3f400]">
              <span>Flete Optimizado VAMO (1 sola moto):</span>
              <span className="font-black">${estimatedFreight.toFixed(2)} MXN</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-1">
            <div>
              <span className="text-[10px] font-black text-blue-200 uppercase block">TOTAL GENERAL A PAGAR</span>
              <p className="text-4xl font-black text-[#c3f400]">${grandTotal.toFixed(2)} MXN</p>
            </div>

            <button
              onClick={handleCreateComboOrder}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-8 py-4 rounded-full font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Bike className="w-5 h-5" />
              <span>{isSubmitting ? 'SOLICITANDO...' : 'PAGAR Y PEDIR EN 1 SOLO CLIC ⚡'}</span>
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
