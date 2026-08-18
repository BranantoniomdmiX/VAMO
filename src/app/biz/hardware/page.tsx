'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { 
  Wrench, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Bike, 
  Clock, 
  DollarSign, 
  Truck, 
  Eye, 
  Package, 
  AlertCircle,
  Ruler
} from 'lucide-react'

interface HardwareOrder {
  id: string
  folio: string
  clientName: string
  clientPhone: string
  destinationType: 'OBRA_EN_CONSTRUCCIÓN' | 'TALLER_MECÁNICO' | 'DOMICILIO'
  partPhotoUrl: string
  items: { name: string; specs: string; price: number }[]
  totalWeightKg: number
  vehicleRequired: 'MOTO_ESTÁNDAR' | 'MOTO_CARGA_PARRILLA'
  totalPrice: number
  status: 'COTIZANDO_PIEZA' | 'EMPACANDO' | 'LISTO_PARA_CARGA'
  time: string
}

export default function BizHardwarePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [orders, setOrders] = useState<HardwareOrder[]>([
    {
      id: '1',
      folio: '#FER-1042',
      clientName: 'Ing. Fernando Tapia (Obra Norte)',
      clientPhone: '4613334455',
      destinationType: 'OBRA_EN_CONSTRUCCIÓN',
      partPhotoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=700&auto=format&fit=crop',
      items: [
        { name: 'Codo de Cobre 90°', specs: 'Diámetro 3/4 pulgada (x4 pzas)', price: 120.00 },
        { name: 'Rollo Teflón Industrial', specs: 'Grado fontanería alta presión', price: 45.00 },
        { name: 'Pegamento PVC Tangit 250ml', specs: 'Secado rápido', price: 95.00 }
      ],
      totalWeightKg: 2.5,
      vehicleRequired: 'MOTO_ESTÁNDAR',
      totalPrice: 260.00,
      status: 'COTIZANDO_PIEZA',
      time: 'Hace 3 min'
    },
    {
      id: '2',
      folio: '#FER-1039',
      clientName: 'Taller Mecánico El Pistón',
      clientPhone: '4617778899',
      destinationType: 'TALLER_MECÁNICO',
      partPhotoUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=700&auto=format&fit=crop',
      items: [
        { name: 'Aceite Sintético 5W-30 (Garrafa 5L)', specs: 'Mobil 1 Full Synthetic', price: 680.00 },
        { name: 'Juego de Bujías Iridium (4 pzas)', specs: 'NGK BKR6EIX', price: 420.00 },
        { name: 'Carbu-Kleen Limpiador', specs: 'Lata 400ml aerosol', price: 85.00 }
      ],
      totalWeightKg: 7.2,
      vehicleRequired: 'MOTO_CARGA_PARRILLA',
      totalPrice: 1185.00,
      status: 'EMPACANDO',
      time: 'Hace 12 min'
    }
  ])

  const handleApproveQuote = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'EMPACANDO' } : o))
  }

  const handleMarkReady = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'LISTO_PARA_CARGA' } : o))
  }

  const handleDispatchOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id))
    alert('¡Material entregado al conductor de carga VAMO!')
  }

  return (
    <div className="min-h-screen bg-[#fffbeb] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-amber-600 selection:text-white">
      <SidebarBiz activeTab="catalog" />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-8 py-6 md:py-10 max-w-6xl mx-auto w-full space-y-8">
          
          {/* Header de Ferretería & Refacciones */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[32px] border border-amber-200 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-800 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                  MODO FERRETERÍA & REFACCIONES
                </span>
                <span className="text-xs font-bold text-amber-900">• Despacho de Materiales a Obra</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
                Mostrador Express de Refacciones & Herramientas
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                Cotiza piezas por foto o medida y asigna motomandados con parrilla de carga
              </p>
            </div>

            <Link
              href="/biz"
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
            >
              ← Volver al Centro
            </Link>
          </div>

          {/* Grid de Pedidos de Mostrador */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map(order => (
              <div 
                key={order.id}
                className="bg-white rounded-[32px] border-2 border-amber-200 p-6 space-y-5 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Folio y Destino */}
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
                          {order.folio}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {order.destinationType}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-1">{order.clientName}</h3>
                      <p className="text-xs text-slate-500 font-semibold">📞 {order.clientPhone} • {order.time}</p>
                    </div>

                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                      order.status === 'COTIZANDO_PIEZA' 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        : order.status === 'EMPACANDO'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {order.status === 'COTIZANDO_PIEZA' ? '🔍 Cotizar Foto' : order.status === 'EMPACANDO' ? '📦 Empacando' : '🚚 Listo p/ Carga'}
                    </span>
                  </div>

                  {/* Foto de la Pieza o Muestra del Cliente */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black text-slate-600 uppercase flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-700" /> Muestra / Foto enviada por el cliente:
                    </span>
                    <div 
                      onClick={() => setSelectedImage(order.partPhotoUrl)}
                      className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group shadow-inner"
                    >
                      <img 
                        src={order.partPhotoUrl} 
                        alt="Pieza Solicitada" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-black gap-1">
                        <Eye className="w-4 h-4" /> Clic para Inspeccionar Medidas
                      </div>
                    </div>
                  </div>

                  {/* Especificación de Materiales */}
                  <div className="space-y-2 bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
                    <span className="text-[11px] font-black text-amber-950 uppercase block">
                      Materiales / Refacciones:
                    </span>
                    <ul className="space-y-2 text-xs font-bold text-slate-800">
                      {order.items.map((it, idx) => (
                        <li key={idx} className="border-b border-amber-200/60 pb-1.5 flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-slate-900">{it.name}</p>
                            <p className="text-[11px] text-slate-500">{it.specs}</p>
                          </div>
                          <span className="font-black text-slate-900 shrink-0">${it.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Capacidad de Carga Requerida */}
                    <div className="pt-2 flex items-center justify-between text-xs font-black">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Package className="w-4 h-4 text-amber-700" /> Peso: {order.totalWeightKg} kg
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-black ${
                        order.vehicleRequired === 'MOTO_CARGA_PARRILLA' 
                          ? 'bg-amber-200 text-amber-950' 
                          : 'bg-blue-100 text-blue-950'
                      }`}>
                        {order.vehicleRequired === 'MOTO_CARGA_PARRILLA' ? '🏍️ Moto con Parrilla Carga' : '🛵 Moto Estándar'}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center text-sm font-black text-slate-900">
                    <span>Total a Cobrar:</span>
                    <span className="text-xl text-amber-900">${order.totalPrice.toFixed(2)} MXN</span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="pt-4 space-y-2">
                  {order.status === 'COTIZANDO_PIEZA' && (
                    <button
                      onClick={() => handleApproveQuote(order.id)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-full font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CONFIRMAR PIEZA Y PASAR A EMPAQUE</span>
                    </button>
                  )}

                  {order.status === 'EMPACANDO' && (
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-full font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4 text-[#c3f400]" />
                      <span>MATERIAL LISTO EN MOSTRADOR</span>
                    </button>
                  )}

                  {order.status === 'LISTO_PARA_CARGA' && (
                    <button
                      onClick={() => handleDispatchOrder(order.id)}
                      className="w-full bg-slate-900 hover:bg-black text-[#c3f400] py-3.5 rounded-full font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>ENTREGAR A MOTO Y REGISTRAR COBRO</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Modal de Zoom de Imagen */}
          {selectedImage && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fade-in border border-slate-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black text-slate-900">Inspección de Muestra / Foto de Refacción</h3>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 underline"
                  >
                    Cerrar (ESC)
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200">
                  <img src={selectedImage} alt="Muestra Ampliada" className="w-full h-auto object-contain" />
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="w-full bg-slate-900 text-white py-3 rounded-full font-black text-xs active:scale-95"
                >
                  Entendido / Volver al Mostrador
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
