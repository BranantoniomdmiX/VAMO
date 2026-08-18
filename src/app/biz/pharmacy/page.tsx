'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { 
  Pill, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Bike, 
  Clock, 
  DollarSign, 
  Eye, 
  ShieldCheck, 
  AlertTriangle,
  Send,
  Plus,
  Search,
  Sparkles
} from 'lucide-react'

interface PrescriptionOrder {
  id: string
  folio: string
  clientName: string
  clientPhone: string
  prescriptionImgUrl: string
  medications: { name: string; price: number; type: 'PATENTE' | 'GENÉRICO' }[]
  totalPrice: number
  isColdChain: boolean // Requiere hielera / frío
  status: 'REVISIÓN_RECETA' | 'COTIZADA_AL_CLIENTE' | 'SURTIENDO' | 'LISTO_DESPACHO'
  time: string
}

export default function BizPharmacyPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [orders, setOrders] = useState<PrescriptionOrder[]>([
    {
      id: '1',
      folio: '#MED-9021',
      clientName: 'Dra. Elena Vázquez',
      clientPhone: '4612345678',
      prescriptionImgUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700&auto=format&fit=crop',
      medications: [
        { name: 'Amoxicilina / Ác. Clavulánico 500mg', price: 145.00, type: 'GENÉRICO' },
        { name: 'Paracetamol 500mg (Caja 20 tabs)', price: 35.00, type: 'GENÉRICO' }
      ],
      totalPrice: 180.00,
      isColdChain: false,
      status: 'REVISIÓN_RECETA',
      time: 'Hace 2 min'
    },
    {
      id: '2',
      folio: '#MED-9018',
      clientName: 'Roberto M.',
      clientPhone: '4619871234',
      prescriptionImgUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&auto=format&fit=crop',
      medications: [
        { name: 'Insulina Glargina 100 UI/ml (Frío)', price: 620.00, type: 'PATENTE' },
        { name: 'Jeringas para Insulina (Paquete 10)', price: 45.00, type: 'GENÉRICO' }
      ],
      totalPrice: 665.00,
      isColdChain: true,
      status: 'SURTIENDO',
      time: 'Hace 8 min'
    }
  ])

  const handleApprovePrescription = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'SURTIENDO' } : o))
  }

  const handleMarkReady = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'LISTO_DESPACHO' } : o))
  }

  const handleDispatchOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id))
    alert('¡Pedido entregado al repartidor VAMO con éxito!')
  }

  return (
    <div className="min-h-screen bg-[#f0fdf4] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-emerald-600 selection:text-white">
      <SidebarBiz activeTab="kds" />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-8 py-6 md:py-10 max-w-6xl mx-auto w-full space-y-8">
          
          {/* Header de Farmacia & Salud */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[32px] border border-emerald-200 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-700 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                  MODO FARMACIA & SALUD
                </span>
                <span className="text-xs font-bold text-emerald-800">• Entrega Express de Botiquín</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
                Tablero de Surtido de Recetas & Botiquín
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                Valida recetas médicas en foto, cotiza fórmulas y despacha con código de seguridad
              </p>
            </div>

            <Link
              href="/biz"
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
            >
              ← Volver al Centro
            </Link>
          </div>

          {/* Tablero de Recetas & Pedidos Activos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map(order => (
              <div 
                key={order.id}
                className="bg-white rounded-[32px] border-2 border-emerald-100 p-6 space-y-5 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Folio y Estado */}
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div>
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                        {order.folio}
                      </span>
                      <h3 className="text-lg font-black text-slate-900">{order.clientName}</h3>
                      <p className="text-xs text-slate-500 font-semibold">📞 {order.clientPhone} • {order.time}</p>
                    </div>

                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                      order.status === 'REVISIÓN_RECETA' 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        : order.status === 'SURTIENDO'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {order.status === 'REVISIÓN_RECETA' ? '🔍 Validar Receta' : order.status === 'SURTIENDO' ? '💊 Surtiendo' : '✅ Listo en Bolsa'}
                    </span>
                  </div>

                  {/* Foto de la Receta Médica */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black text-slate-600 uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" /> Foto de la Receta del Cliente:
                    </span>
                    <div 
                      onClick={() => setSelectedImage(order.prescriptionImgUrl)}
                      className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group shadow-inner"
                    >
                      <img 
                        src={order.prescriptionImgUrl} 
                        alt="Receta Médica" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-black gap-1">
                        <Eye className="w-4 h-4" /> Clic para Ampliar Receta
                      </div>
                    </div>
                  </div>

                  {/* Medicamentos Solicitados */}
                  <div className="space-y-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <span className="text-[11px] font-black text-emerald-900 uppercase block">
                      Medicamentos a Surtir:
                    </span>
                    <ul className="space-y-1.5 text-xs font-bold text-slate-800">
                      {order.medications.map((m, idx) => (
                        <li key={idx} className="flex justify-between items-center border-b border-emerald-100/60 pb-1">
                          <span>{m.name} <span className="text-[10px] text-emerald-700">({m.type})</span></span>
                          <span className="font-black text-slate-900">${m.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>

                    {order.isColdChain && (
                      <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl text-[11px] font-black text-blue-900 flex items-center gap-1.5 mt-2">
                        <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>¡Requiere Cadena de Frío! Entregar con gel refrigerante.</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center text-sm font-black text-slate-900">
                    <span>Total a Cobrar:</span>
                    <span className="text-xl text-emerald-700">${order.totalPrice.toFixed(2)} MXN</span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="pt-4 space-y-2">
                  {order.status === 'REVISIÓN_RECETA' && (
                    <button
                      onClick={() => handleApprovePrescription(order.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-full font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>APROBAR RECETA Y COMENZAR SURTIDO</span>
                    </button>
                  )}

                  {order.status === 'SURTIENDO' && (
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-full font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Bike className="w-4 h-4 text-[#c3f400]" />
                      <span>MEDICAMENTOS EN BOLSA SELLADA (LISTO)</span>
                    </button>
                  )}

                  {order.status === 'LISTO_DESPACHO' && (
                    <button
                      onClick={() => handleDispatchOrder(order.id)}
                      className="w-full bg-slate-900 hover:bg-black text-[#c3f400] py-3.5 rounded-full font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>ENTREGAR A MOTO VAMO Y REGISTRAR COBRO</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Modal de Zoom de Receta */}
          {selectedImage && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fade-in border border-slate-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black text-slate-900">Visor de Receta Médica del Cliente</h3>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 underline"
                  >
                    Cerrar (ESC)
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200">
                  <img src={selectedImage} alt="Receta Ampliada" className="w-full h-auto object-contain" />
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="w-full bg-slate-900 text-white py-3 rounded-full font-black text-xs active:scale-95"
                >
                  Entendido / Volver al Tablero
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
