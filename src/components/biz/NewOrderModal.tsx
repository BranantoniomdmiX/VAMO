'use client'

import React, { useState } from 'react'
import { X, ShoppingBag, Bike, Store, Plus, Minus, CheckCircle2, DollarSign, Send, User, MapPin, Phone } from 'lucide-react'

interface NewOrderModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ProductItem {
  id: string
  name: string
  price: number
  quantity: number
}

export function NewOrderModal({ isOpen, onClose }: NewOrderModalProps) {
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP' | 'DINE_IN'>('DELIVERY')
  const [customerName, setCustomerName] = useState('Cliente Mostrador')
  const [customerPhone, setCustomerPhone] = useState('4611234567')
  const [customerAddress, setCustomerAddress] = useState('Calle Hidalgo #45, Centro')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH')
  const [orderSuccess, setOrderSuccess] = useState(false)

  const [catalog, setCatalog] = useState<ProductItem[]>([
    { id: '1', name: 'Taco Gobernador de Camarón', price: 65.00, quantity: 2 },
    { id: '2', name: 'Agua de Horchata Literaria 1L', price: 55.00, quantity: 1 },
    { id: '3', name: 'Empanada de Carne Receta Secreta', price: 45.00, quantity: 0 },
    { id: '4', name: 'Pizza Muzzarella Artesanal Grande', price: 180.00, quantity: 0 },
    { id: '5', name: 'Combo Familiar VAMO Especial', price: 320.00, quantity: 0 }
  ])

  if (!isOpen) return null

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCatalog(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const selectedItems = catalog.filter(i => i.quantity > 0)
  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedItems.length === 0) {
      alert('Por favor selecciona al menos 1 producto para la orden.')
      return
    }

    const orderCode = `#${Math.floor(1000 + Math.random() * 9000)}`
    const itemsFormatted = selectedItems.map(i => `${i.quantity}x ${i.name}`)

    const newOrderData = {
      orderCode,
      customer: customerName,
      phone: customerPhone,
      address: deliveryType === 'DELIVERY' ? customerAddress : 'Mostrador / Mesa',
      items: itemsFormatted,
      totalPrice,
      deliveryType,
      paymentMethod,
      timestamp: Date.now()
    }

    // 1. Transmitir en Tiempo Real a la Pantalla de Cocina KDS
    try {
      localStorage.setItem('vamo_last_approved_kds_order', JSON.stringify(newOrderData))
    } catch (err) {
      console.error(err)
    }

    setOrderSuccess(true)
    setTimeout(() => {
      setOrderSuccess(false)
      onClose()
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header Modal POS */}
        <div className="bg-[#0056d2] text-white p-5 sm:p-6 flex justify-between items-center">
          <div>
            <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              TERMINAL POS VAMO
            </span>
            <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#c3f400]" />
              Registrar Nuevo Pedido Manual
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {orderSuccess ? (
          <div className="p-10 text-center space-y-3 my-auto">
            <div className="w-16 h-16 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-[#1c1b1b]">¡PEDIDO REGISTRADO Y TRANSMITIDO!</h3>
            <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
              {deliveryType === 'DELIVERY' 
                ? 'La comanda se envió a la Pantalla de Cocina y se solicitó un Repartidor VAMO para el domicilio.'
                : 'La comanda se envió a la Pantalla de Cocina para entrega en mostrador.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* 1. SELECTOR DE TIPO DE ENTREGA */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#0056d2] uppercase tracking-wider block">
                1. Selección del Tipo de Servicio
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType('DELIVERY')}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    deliveryType === 'DELIVERY'
                      ? 'bg-[#0056d2] text-white border-[#0056d2] shadow-md'
                      : 'bg-[#f6f3f2] text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Bike className="w-5 h-5 text-[#c3f400]" />
                  <span>🛵 Domicilio VAMO</span>
                  <span className="text-[9px] font-semibold opacity-80">(Cocina + Moto)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('PICKUP')}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    deliveryType === 'PICKUP'
                      ? 'bg-[#0056d2] text-white border-[#0056d2] shadow-md'
                      : 'bg-[#f6f3f2] text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5 text-[#c3f400]" />
                  <span>🛍️ Para Llevar</span>
                  <span className="text-[9px] font-semibold opacity-80">(Solo Cocina)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('DINE_IN')}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    deliveryType === 'DINE_IN'
                      ? 'bg-[#0056d2] text-white border-[#0056d2] shadow-md'
                      : 'bg-[#f6f3f2] text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Store className="w-5 h-5 text-[#c3f400]" />
                  <span>🍽️ En Mesa</span>
                  <span className="text-[9px] font-semibold opacity-80">(Solo Cocina)</span>
                </button>
              </div>
            </div>

            {/* 2. SELECCIÓN DE PRODUCTOS DEL CATÁLOGO */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#0056d2] uppercase tracking-wider block">
                2. Selección de Productos del Menú
              </label>

              <div className="space-y-2 bg-[#fcf9f8] p-3 rounded-2xl border border-slate-200 max-h-52 overflow-y-auto">
                {catalog.map(product => (
                  <div key={product.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center gap-2">
                    <div>
                      <strong className="text-xs font-extrabold text-[#1c1b1b] block">{product.name}</strong>
                      <span className="text-xs font-black text-[#0056d2]">${product.price.toFixed(2)} MXN</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-black text-sm">{product.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(product.id, 1)}
                        className="w-7 h-7 rounded-lg bg-[#0056d2] text-white font-bold flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. DATOS DEL CLIENTE Y COBRO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1c1b1b]">Nombre del Cliente</label>
                <div className="flex items-center bg-[#f6f3f2] border border-slate-200 rounded-xl px-3 py-2">
                  <User className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    required
                    className="w-full bg-transparent text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1c1b1b]">Teléfono WhatsApp</label>
                <div className="flex items-center bg-[#f6f3f2] border border-slate-200 rounded-xl px-3 py-2">
                  <Phone className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    required
                    className="w-full bg-transparent text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {deliveryType === 'DELIVERY' && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#1c1b1b]">Dirección de Entrega (Para Repartidor VAMO)</label>
                  <div className="flex items-center bg-[#f6f3f2] border border-slate-200 rounded-xl px-3 py-2">
                    <MapPin className="w-4 h-4 text-[#0056d2] mr-2" />
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      required
                      placeholder="Calle, número, colonia y referencia..."
                      className="w-full bg-transparent text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN PRINCIPAL DE TRANSMISIÓN */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center bg-[#161e00] text-[#c3f400] p-4 rounded-2xl">
                <span className="text-xs font-black uppercase">TOTAL DE LA ORDEN:</span>
                <span className="text-2xl font-black text-white">${totalPrice.toFixed(2)} MXN</span>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-4 rounded-full font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-5 h-5 text-[#c3f400]" />
                <span>🚀 REGISTRAR & TRANSMITIR EN VIVO A COCINA</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  )
}
