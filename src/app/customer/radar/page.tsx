'use client'

import React, { useState, useEffect } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Search, Tag, Utensils, Pill, Wrench, Heart, Clock, Star, MapPin, X, Percent, Store, ChevronRight, ShoppingBag, Plus } from 'lucide-react'
import Link from 'next/link'
import VamoUniversalMap from '@/components/map/VamoUniversalMap'
import { createClient } from '@/lib/supabase/client'

export interface StoreItem {
  id: string | number
  name: string
  address: string
  rating: string
  time: string
  category: string
  lat: number
  lng: number
  image?: string
}

export interface PromoItem {
  id: string
  title: string
  store: string
  storeId: string | number
  discount: string
  code: string
  badge: string
  image: string
  description: string
  validUntil: string
}

export default function CustomerRadarPage() {
  const supabase = createClient()
  const [activeModal, setActiveModal] = useState<'NONE' | 'PROMOS' | 'CATEGORIES'>('NONE')
  const [selectedTab, setSelectedTab] = useState<'STORES' | 'PROMOS'>('STORES')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [userLocation, setUserLocation] = useState<[number, number]>([20.5218, -100.8142])
  const [hasGps, setHasGps] = useState<boolean>(false)
  const [selectedPinAddress, setSelectedPinAddress] = useState<string | null>(null)
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number } | null>(null)

  const [stores, setStores] = useState<StoreItem[]>([])
  const [promoList, setPromoList] = useState<PromoItem[]>([])
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null)
  const [selectedPromo, setSelectedPromo] = useState<PromoItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 1. Cargar Comercios Reales de Supabase + Local Storage
  useEffect(() => {
    async function loadRealData() {
      setIsLoading(true)
      const collectedStores: StoreItem[] = []

      // A. Consultar base de datos Supabase
      try {
        const { data: dbMerchants } = await supabase
          .from('merchants')
          .select('*')
          .eq('is_open', true)

        if (dbMerchants && dbMerchants.length > 0) {
          dbMerchants.forEach((m: Record<string, unknown>, idx: number) => {
            collectedStores.push({
              id: (m.id as string) || `db-${idx}`,
              name: (m.name as string) || 'Comercio Afiliado',
              address: (m.address as string) || 'Ubicación registrada',
              rating: '5.0 ★',
              time: '12-18 min',
              category: (m.category as string) || 'Comercio General',
              lat: (m.latitude as number) || (20.5218 + (Math.random() - 0.5) * 0.02),
              lng: (m.longitude as number) || (-100.8142 + (Math.random() - 0.5) * 0.02),
              image: (m.logo_url as string) || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop'
            })
          })
        }
      } catch (e) {
        console.warn('Error consultando merchants en Supabase:', e)
      }

      // B. Consultar comercios dados de alta localmente
      try {
        const localList = localStorage.getItem('vamo_registered_merchants')
        if (localList) {
          const parsed = JSON.parse(localList)
          parsed.forEach((m: Record<string, unknown>) => {
            const sName = (m.storeName || m.name || '') as string
            if (!collectedStores.some(st => st.name.toLowerCase() === sName.toLowerCase())) {
              collectedStores.push({
                id: (m.id as string | number) || Date.now(),
                name: sName || 'Mi Negocio VAMO',
                address: (m.address as string) || 'Centro',
                rating: (m.rating as string) || '5.0 ★ (NUEVO)',
                time: (m.prepTime as string) || '10-15 min',
                category: (m.category as string) || 'Restaurante / Comida',
                lat: (m.lat as number) || 20.5230,
                lng: (m.lng as number) || -100.8120,
                image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop'
              })
            }
          })
        }
      } catch (e) {
        console.error(e)
      }

      setStores(collectedStores)
      if (collectedStores.length > 0) {
        setSelectedStore(collectedStores[0])
      }

      // C. Cargar Promociones Reales
      try {
        const storedPromos = localStorage.getItem('vamo_merchant_custom_promos')
        if (storedPromos) {
          setPromoList(JSON.parse(storedPromos))
        } else {
          setPromoList([])
        }
      } catch (e) {}

      setIsLoading(false)
    }

    loadRealData()
  }, [])

  // 2. Autodetección de GPS
  useEffect(() => {
    import('@/lib/services/deviceCapabilityService').then(({ deviceCapabilityService }) => {
      deviceCapabilityService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000
      }).then(normalized => {
        const coords: [number, number] = [normalized.coords.latitude, normalized.coords.longitude]
        setUserLocation(coords)
        setHasGps(true)
        localStorage.setItem('vamo_user_gps', JSON.stringify({ lat: coords[0], lng: coords[1] }))
      }).catch(err => {
        console.warn('GPS no disponible, usando ubicación guardada:', err.message)
        const cached = localStorage.getItem('vamo_user_gps')
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            setUserLocation([parsed.lat, parsed.lng])
          } catch (e) {}
        }
      })
    })
  }, [])

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setPinnedCoords(coords)
    setSelectedPinAddress(`Ubicación seleccionada (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`)
    localStorage.setItem('vamo_selected_destination', JSON.stringify(coords))
  }

  // Agrupación dinámica de comercios según categorías reales
  const getCategoryIcon = (catName: string) => {
    const c = catName.toLowerCase()
    if (c.includes('farma') || c.includes('salud')) return Pill
    if (c.includes('ferret') || c.includes('refacc') || c.includes('material')) return Wrench
    if (c.includes('abarrot') || c.includes('tienda')) return ShoppingBag
    return Utensils
  }

  const uniqueCategories = Array.from(new Set(stores.map(s => s.category)))
  const groupedCategories = uniqueCategories.map(cat => ({
    category: cat,
    icon: getCategoryIcon(cat),
    stores: stores.filter(s => s.category === cat)
  }))

  const filteredStores = stores.filter(st =>
    searchQuery === '' ||
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeWaypoints = filteredStores.map(st => ({
    id: String(st.id),
    title: st.name,
    lat: st.lat,
    lng: st.lng,
    type: 'ORIGIN' as const
  }))

  return (
    <CustomerLayout>
      <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[650px]">
        
        {/* COLUMNA IZQUIERDA EN PC / TABLETAS: PANEL DE BÚSQUEDA & COMERCIOS */}
        <aside className="hidden lg:flex flex-col w-96 bg-white rounded-[32px] p-5 border border-[#e5e2e1] shadow-xl h-[680px] space-y-4">

          {/* Pestañas Superiores */}
          <div className="flex gap-2 p-1 bg-[#f0eded] rounded-full shrink-0">
            <button
              onClick={() => setSelectedTab('STORES')}
              className={`flex-1 py-2 rounded-full text-xs font-black transition-all ${
                selectedTab === 'STORES' ? 'bg-[#0056d2] text-white shadow-md' : 'text-[#737785] hover:text-[#1c1b1b]'
              }`}
            >
              🏬 Comercios ({filteredStores.length})
            </button>
            <button
              onClick={() => setSelectedTab('PROMOS')}
              className={`flex-1 py-2 rounded-full text-xs font-black transition-all ${
                selectedTab === 'PROMOS' ? 'bg-[#161e00] text-[#c3f400] shadow-md' : 'text-[#737785] hover:text-[#1c1b1b]'
              }`}
            >
              🏷️ Promos ({promoList.length})
            </button>
          </div>

          {/* Buscador */}
          <div className="bg-[#fcf9f8] px-4 py-2.5 rounded-full flex items-center gap-2 border border-[#e5e2e1] shrink-0">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar comercios afiliados..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-extrabold outline-none text-[#1c1b1b] w-full"
            />
          </div>

          {/* CONTENIDO DEL PANEL LATERAL */}
          {selectedTab === 'PROMOS' ? (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {promoList.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <span className="text-2xl">🏷️</span>
                  <p className="text-xs font-bold text-slate-500">No hay cupones o promociones activas en este momento.</p>
                </div>
              ) : (
                promoList.map(promo => (
                  <div 
                    key={promo.id} 
                    onClick={() => setSelectedPromo(promo)}
                    className="bg-[#fcf9f8] p-4 rounded-2xl border border-[#e5e2e1] space-y-2 shadow-sm hover:border-[#0056d2] transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="bg-[#c3f400] text-[#161e00] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                        {promo.badge}
                      </span>
                      <span className="bg-[#0056d2] text-white text-xs font-mono font-black px-2.5 py-1 rounded-lg">
                        {promo.discount}
                      </span>
                    </div>
                    <strong className="text-xs font-extrabold text-[#1c1b1b] group-hover:text-[#0056d2] transition-colors block">{promo.title}</strong>
                    <span className="text-[11px] font-bold text-[#0056d2] block">{promo.store}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-5 flex-1 overflow-y-auto pr-1">
              {stores.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056d2] flex items-center justify-center mx-auto">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <strong className="text-xs font-black text-slate-900 block">Sin Comercios Registrados</strong>
                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                      Sé el primer establecimiento en afiliarte a la red VAMO.
                    </p>
                  </div>
                  <Link
                    href="/auth/register-biz"
                    className="inline-flex items-center gap-1.5 bg-[#0056d2] text-white px-4 py-2 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Afiliar Mi Comercio</span>
                  </Link>
                </div>
              ) : (
                groupedCategories.map((catGroup, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5">
                      <catGroup.icon className="w-4 h-4 text-[#0056d2]" />
                      {catGroup.category} ({catGroup.stores.length})
                    </h4>

                    <div className="space-y-2">
                      {catGroup.stores.map(st => (
                        <div
                          key={st.id}
                          onClick={() => setSelectedStore(st)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex justify-between items-center ${
                            selectedStore?.id === st.id 
                              ? 'bg-[#0056d2]/10 border-[#0056d2] shadow-xs' 
                              : 'bg-[#fcf9f8] border-[#e5e2e1] hover:bg-[#f0eded]'
                          }`}
                        >
                          <div>
                            <strong className="text-xs font-extrabold text-[#1c1b1b] group-hover:text-[#0056d2] transition-colors block">{st.name}</strong>
                            <span className="text-[10px] font-bold text-slate-500">{st.address}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#726200] bg-[#fddf33]/30 px-2 py-0.5 rounded-full">
                              {st.rating}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </aside>

        {/* COLUMNA DERECHA: MAPA VECTORIAL PANORÁMICO (Responsive dvh/svh y Safe Viewport) */}
        <div className="relative flex-1 min-h-[480px] h-[calc(100dvh-240px)] sm:h-[calc(100vh-220px)] lg:h-[700px] w-full rounded-[32px] overflow-hidden border border-[#e5e2e1] shadow-xl bg-slate-100 flex flex-col">
          
          {/* BARRA SUPERIOR MÓVIL (Solo Celular) */}
          <div className="lg:hidden absolute top-3 inset-x-3 z-30 flex gap-2 justify-center pointer-events-auto">
            <button
              type="button"
              onClick={() => setActiveModal('PROMOS')}
              className="bg-[#161e00] text-[#c3f400] px-3.5 py-2 rounded-full font-black text-[11px] shadow-lg border border-[#c3f400]/40 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#c3f400]" />
              <span>Promos ({promoList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('CATEGORIES')}
              className="bg-[#0056d2] text-white px-3.5 py-2 rounded-full font-black text-[11px] shadow-lg border border-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-[#c3f400]" />
              <span>Comercios ({stores.length})</span>
            </button>
          </div>

          {/* Mapa Universal VamoUniversalMap (WebGL + Leaflet Fail-Safe iOS & Android) */}
          <div className="w-full h-full relative flex-1">
            <VamoUniversalMap
              center={userLocation}
              zoom={14.5}
              theme="light"
              mode3D={false}
              userPosition={hasGps ? {
                lat: userLocation[0],
                lng: userLocation[1],
                accuracyMeters: 25,
                isLowAccuracy: false
              } : null}
              waypoints={[
                ...activeWaypoints,
                ...(pinnedCoords ? [{
                  id: 'PINNED-LOCATION',
                  title: '📍 Mi Destino Seleccionado',
                  lat: pinnedCoords.lat,
                  lng: pinnedCoords.lng,
                  type: 'DESTINATION' as const
                }] : [])
              ]}
              enableGeolocate={true}
              onMapClick={handleMapClick}
              className="w-full h-full"
            />
          </div>

          {/* Banner Flotante si se selecciona un punto */}
          {selectedPinAddress && (
            <div className="absolute top-16 inset-x-4 max-w-sm mx-auto z-30 pointer-events-auto bg-[#0040A1] text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-2 border border-blue-400 animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#c3f400] shrink-0" />
                <span className="text-xs font-bold truncate">{selectedPinAddress}</span>
              </div>
              <Link
                href={`/customer/quote?destLat=${pinnedCoords?.lat}&destLng=${pinnedCoords?.lng}`}
                className="bg-[#c3f400] text-[#161e00] px-3 py-1.5 rounded-xl text-xs font-black shrink-0 hover:bg-[#abd600] active:scale-95 transition-all"
              >
                Pedir Moto Aquí ⚡
              </Link>
            </div>
          )}

          {/* Tarjeta Flotante Inferior de Comercio Seleccionado */}
          {selectedStore && (
            <div className="absolute bottom-4 inset-x-4 max-w-md mx-auto z-20 pointer-events-auto animate-fade-in">
              <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-3.5 shadow-2xl border border-[#e5e2e1] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0056d2] border border-blue-200 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-[#1c1b1b] truncate">{selectedStore.name}</h3>
                    <span className="text-[11px] font-extrabold text-[#0056d2] block">⏱️ {selectedStore.time} &bull; {selectedStore.rating}</span>
                  </div>
                </div>

                <Link 
                  href={`/customer/store/${selectedStore.id}`}
                  className="bg-[#0056d2] hover:bg-[#0040a1] text-white rounded-full font-black text-xs px-4 py-2.5 shrink-0 shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Ver Menú & Pedir 🛍️</span>
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* MODALES MÓVILES */}
        {activeModal === 'CATEGORIES' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-black">
                    🏬
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1c1b1b]">Directorio de Comercios</h3>
                    <p className="text-xs font-semibold text-[#737785]">Comercios registrados en tu zona</p>
                  </div>
                </div>

                <button onClick={() => setActiveModal('NONE')} className="p-2 rounded-full bg-[#f0eded] text-[#1c1b1b]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {stores.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs font-bold text-slate-500">No hay comercios registrados aún.</p>
                  </div>
                ) : (
                  stores.map(st => (
                    <Link
                      key={st.id}
                      href={`/customer/store/${st.id}`}
                      className="bg-[#fcf9f8] p-3.5 rounded-2xl border border-[#e5e2e1] flex justify-between items-center hover:bg-[#e5e2e1]/40 transition-colors"
                    >
                      <div>
                        <strong className="text-xs font-extrabold text-[#1c1b1b] block">{st.name}</strong>
                        <span className="text-[10px] font-bold text-slate-500">{st.address}</span>
                      </div>
                      <span className="text-xs font-bold text-[#726200] bg-[#fddf33]/30 px-2 py-0.5 rounded-full">
                        {st.rating}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  )
}
