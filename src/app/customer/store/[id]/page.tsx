'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { 
  Store, 
  MapPin, 
  Clock, 
  Star, 
  ArrowLeft, 
  FileText, 
  ShoppingBag, 
  Bike, 
  Check, 
  Phone, 
  Plus, 
  Minus, 
  ExternalLink, 
  ShieldCheck,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface QuickItem {
  id: string
  name: string
  category: string
  price: number
  inStock: boolean
  unit?: string
}

export default function CustomerStoreDetailPage() {
  const params = useParams()
  const router = useRouter()
  const storeId = params?.id as string
  const supabase = createClient()

  const [storeData, setStoreData] = useState({
    id: storeId || '1',
    name: 'Comercio Afiliado VAMO',
    category: 'Comercio Local',
    address: 'Ubicación registrada',
    rating: '5.0 ★ (NUEVO)',
    time: '10-15 min',
    phone: '',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop',
    catalogPdfUrl: ''
  })

  const [products, setProducts] = useState<QuickItem[]>([])
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStore() {
      setIsLoading(true)

      // 1. Buscar en Supabase
      try {
        const { data: dbMerchant } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', storeId)
          .maybeSingle()

        if (dbMerchant) {
          setStoreData({
            id: dbMerchant.id,
            name: dbMerchant.name,
            category: dbMerchant.category || 'Comercio Local',
            address: dbMerchant.address || 'Ubicación registrada',
            rating: '5.0 ★',
            time: '10-15 min',
            phone: dbMerchant.phone || '',
            image: dbMerchant.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop',
            catalogPdfUrl: ''
          })
        }
      } catch (e) {}

      // 2. Buscar en almacenamiento local si fue registrado en esta sesión
      try {
        const localList = localStorage.getItem('vamo_registered_merchants')
        if (localList) {
          const parsed = JSON.parse(localList)
          const found = parsed.find((m: any) => String(m.id) === String(storeId) || m.storeName === storeId)
          if (found) {
            setStoreData({
              id: found.id,
              name: found.storeName || found.name,
              category: found.category || 'Comercio Local',
              address: found.address || 'Ubicación registrada',
              rating: found.rating || '5.0 ★ (NUEVO)',
              time: found.prepTime || '10-15 min',
              phone: found.phone || '',
              image: found.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop',
              catalogPdfUrl: found.catalogPdfUrl || ''
            })
          }
        }

        const storedQuickList = localStorage.getItem('vamo_quick_product_list')
        if (storedQuickList) {
          setProducts(JSON.parse(storedQuickList))
        } else {
          setProducts([])
        }
      } catch (e) {
        console.error(e)
      }

      setIsLoading(false)
    }

    loadStore()
  }, [storeId])

  const handleAddToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => {
      const next = { ...prev }
      if (next[id] > 1) {
        next[id] -= 1
      } else {
        delete next[id]
      }
      return next
    })
  }

  const totalCartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalCartPrice = Object.entries(cart).reduce((total, [id, qty]) => {
    const item = products.find(p => p.id === id)
    return total + (item ? item.price * qty : 0)
  }, 0)

  const handleCheckoutOrder = () => {
    if (totalCartCount === 0) return
    const orderItems = Object.entries(cart).map(([id, qty]) => {
      const item = products.find(p => p.id === id)
      return `${qty}x ${item?.name}`
    }).join(', ')

    router.push(`/customer/quote?mode=direct&origin=${encodeURIComponent(storeData.address)}&items=${encodeURIComponent(orderItems)}&total=${totalCartPrice}`)
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        
        {/* Botón Volver */}
        <Link 
          href="/customer/radar"
          className="inline-flex items-center gap-2 text-xs font-black text-[#0056d2] bg-white px-4 py-2 rounded-full border border-[#e5e2e1] shadow-xs hover:bg-[#f0eded] active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Radar de Comercios</span>
        </Link>

        {/* Portada & Datos del Local */}
        <div className="bg-white rounded-[32px] overflow-hidden border border-[#e5e2e1] shadow-sm">
          <div className="relative h-48 sm:h-64 w-full bg-slate-900">
            <img 
              src={storeData.image} 
              alt={storeData.name} 
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
              <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider self-start">
                {storeData.category}
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white">{storeData.name}</h1>
              <p className="text-xs sm:text-sm text-slate-200 font-semibold flex items-center gap-3">
                <span>📍 {storeData.address}</span>
                <span>⏱️ {storeData.time}</span>
                <span className="text-yellow-300 font-black">★ {storeData.rating}</span>
              </p>
            </div>
          </div>

          {/* Barra de Acciones del Local: Catálogo PDF + Teléfono */}
          <div className="p-4 sm:p-6 bg-[#fcf9f8] border-t border-[#e5e2e1] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-[#1c1b1b]">
              <ShieldCheck className="w-4 h-4 text-[#0056d2]" />
              <span>Precios directos de mostrador (0% comisiones)</span>
            </div>

            <div className="flex items-center gap-2">
              {storeData.catalogPdfUrl && (
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-4 py-2.5 rounded-full text-xs font-black flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#c3f400]" />
                  <span>📄 Ver Menú / Catálogo Completo</span>
                </button>
              )}

              {storeData.phone && (
                <a
                  href={`tel:${storeData.phone}`}
                  className="bg-white border border-[#e5e2e1] hover:bg-slate-50 text-[#1c1b1b] px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Llamar al Local</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Productos del Local */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#e5e2e1] shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xl font-black text-[#1c1b1b]">Productos & Catálogo Digital</h2>
              <p className="text-xs text-[#737785] font-semibold">Selecciona lo que deseas y un motomandado VAMO te lo lleva</p>
            </div>
            <span className="text-xs font-black bg-[#f0eded] text-slate-700 px-3 py-1 rounded-full">
              {products.length} Productos
            </span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0056d2] flex items-center justify-center mx-auto">
                <Package className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <strong className="text-sm font-black text-slate-900 block">Catálogo en Proceso de Carga</strong>
                <p className="text-xs font-medium text-slate-500">
                  Este comercio aún no ha subido productos a su lista rápida. Puedes pedir lo que necesites como un mandado express.
                </p>
              </div>
              <Link
                href={`/customer/quote?mode=direct&origin=${encodeURIComponent(storeData.address)}`}
                className="inline-flex items-center gap-2 bg-[#0056d2] text-white px-5 py-3 rounded-full text-xs font-black shadow-md active:scale-95 transition-all"
              >
                <Bike className="w-4 h-4 text-[#c3f400]" />
                <span>Pedir Mandado Express a este Local</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(prod => {
                const qtyInCart = cart[prod.id] || 0
                return (
                  <div 
                    key={prod.id}
                    className="bg-[#fcf9f8] p-4 rounded-2xl border border-[#e5e2e1] flex items-center justify-between gap-3 hover:border-[#0056d2] transition-all"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-[10px] font-black text-[#0056d2] uppercase">{prod.category}</span>
                      <h3 className="text-sm font-black text-[#1c1b1b] truncate">{prod.name}</h3>
                      <p className="text-xs font-black text-[#0056d2]">
                        ${prod.price.toFixed(2)} MXN <span className="text-[10px] text-slate-400 font-normal">/ {prod.unit || 'pza'}</span>
                      </p>
                    </div>

                    <div className="shrink-0">
                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-2 bg-[#0056d2] text-white rounded-full px-2 py-1 shadow-sm">
                          <button 
                            onClick={() => handleRemoveFromCart(prod.id)}
                            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs font-black active:scale-90"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black px-1">{qtyInCart}</span>
                          <button 
                            onClick={() => handleAddToCart(prod.id)}
                            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs font-black active:scale-90"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(prod.id)}
                          className="bg-white hover:bg-[#0056d2] hover:text-white text-[#0056d2] border-2 border-[#0056d2] px-3.5 py-1.5 rounded-full text-xs font-black active:scale-95 transition-all flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal / Visor de Menú / Catálogo PDF o Flyer */}
        {showPdfModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-fade-in border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Menú / Catálogo Digital: {storeData.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Visualiza todos los platillos, refacciones o precios del local</p>
                </div>
                <button 
                  onClick={() => setShowPdfModal(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 p-2 rounded-full"
                >
                  ✕
                </button>
              </div>

              {/* Visor Iframe / Imagen */}
              <div className="max-h-[65vh] h-[450px] overflow-auto rounded-2xl border border-slate-200 bg-slate-900 flex items-center justify-center">
                {storeData.catalogPdfUrl.endsWith('.pdf') ? (
                  <iframe 
                    src={storeData.catalogPdfUrl} 
                    className="w-full h-full rounded-2xl"
                    title="Catálogo PDF"
                  />
                ) : (
                  <img 
                    src={storeData.catalogPdfUrl} 
                    alt="Catálogo / Menú Flyer" 
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <a
                  href={storeData.catalogPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#0056d2] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir en Pestaña Completa / Descargar PDF</span>
                </a>

                <button
                  onClick={() => setShowPdfModal(false)}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-xs font-black active:scale-95"
                >
                  Cerrar Visor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra Flotante Inferior de Carrito */}
        {totalCartCount > 0 && (
          <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40 animate-slide-up">
            <div className="bg-[#161e00] text-white p-4 rounded-[28px] border-2 border-[#c3f400] shadow-2xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-[#c3f400] uppercase block">
                  {totalCartCount} {totalCartCount === 1 ? 'PRODUCTO' : 'PRODUCTOS'}
                </span>
                <span className="text-xl font-black text-white">
                  ${totalCartPrice.toFixed(2)} MXN
                </span>
              </div>

              <button
                onClick={handleCheckoutOrder}
                className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-6 py-3 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Bike className="w-4 h-4" />
                <span>PEDIR CON MOTO VAMO ⚡</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  )
}
