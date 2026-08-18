'use client'

import React, { useState, useEffect } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Search, Tag, Utensils, Pill, Wrench, Heart, Clock, Star, MapPin, X, Percent, Store, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import VamoMapLibre from '@/components/map/VamoMapLibre'

export default function CustomerRadarPage() {
  const [activeModal, setActiveModal] = useState<'NONE' | 'PROMOS' | 'CATEGORIES'>('NONE')
  const [selectedTab, setSelectedTab] = useState<'STORES' | 'PROMOS'>('STORES')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [selectedStore, setSelectedStore] = useState({
    id: 1,
    name: 'La Fonda Doña Rosa',
    category: 'Comida Local',
    time: '15-20 min',
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format&fit=crop'
  })

  interface PromoItem {
    id: string
    title: string
    store: string
    storeId: number
    discount: string
    code: string
    badge: string
    image: string
    description: string
    validUntil: string
  }

  const [customPromos, setCustomPromos] = useState<PromoItem[]>([])
  const [customMerchantStore, setCustomMerchantStore] = useState<any | null>(null)

  useEffect(() => {
    try {
      const storedPromos = localStorage.getItem('vamo_merchant_custom_promos')
      if (storedPromos) {
        setCustomPromos(JSON.parse(storedPromos))
      }
      const storedProfile = localStorage.getItem('vamo_merchant_profile')
      if (storedProfile) {
        setCustomMerchantStore(JSON.parse(storedProfile))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const promoList: PromoItem[] = [
    ...customPromos,
    { 
      id: 'p1', 
      title: '2x1 en Tortas Cubanas Especiales', 
      store: 'Tortería El Pariente', 
      storeId: 101,
      discount: '50% OFF', 
      code: 'TORTAS2X1', 
      badge: 'POPULAR',
      image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=700&auto=format&fit=crop',
      description: 'Llévate 2 Tortas Cubanas Gigantes con milanesa, pierna y queso fundido al precio de 1. ¡Incluye envío express en motomandado VAMO!',
      validUntil: 'Válido hoy hasta las 11:00 PM'
    },
    { 
      id: 'p2', 
      title: 'Envío Gratis en Medicamentos & Botiquín', 
      store: 'Farmacia San Gabriel', 
      storeId: 301,
      discount: 'ENVÍO $0', 
      code: 'SALUDVAMO', 
      badge: 'HOY',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700&auto=format&fit=crop',
      description: 'Flete gratis en la entrega de medicamentos con receta, analgésicos y artículos de cuidado personal. Llega en 10-15 minutos a tu domicilio.',
      validUntil: 'Disponible todo el día'
    },
    { 
      id: 'p3', 
      title: '15% Desc. en Herramientas y Materiales', 
      store: 'Ferretería La Central', 
      storeId: 201,
      discount: '15% OFF', 
      code: 'FERRE15', 
      badge: 'EXCLUSIVO',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=700&auto=format&fit=crop',
      description: 'Descuento directo en taladros, juegos de llaves, pintura y plomería. Reparto de materiales livianos directo a tu obra o casa.',
      validUntil: 'Válido este fin de semana'
    },
    { 
      id: 'p4', 
      title: 'Orden de Tacos al Pastor + Boing Gratis', 
      store: 'Taquería El Pastor', 
      storeId: 102,
      discount: 'BEBIDA $0', 
      code: 'TACOBOING', 
      badge: 'COMBO',
      image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=700&auto=format&fit=crop',
      description: 'En la compra de 5 tacos al pastor con piña y cilantro, te regalamos un refresco Boing de 500ml helado.',
      validUntil: 'Oferta nocturna'
    }
  ]

  const [selectedPromo, setSelectedPromo] = useState<PromoItem | null>(null)

  // Lista de Categorías y Comercios Afiliados con Coordenadas GPS
  const categoriesData = [
    {
      category: 'Torterías & Loncherías',
      icon: Utensils,
      stores: [
        ...(customMerchantStore ? [{
          id: 999,
          name: customMerchantStore.storeName || 'Mi Negocio VAMO',
          address: customMerchantStore.address || 'Centro',
          rating: '5.0 ★ (NUEVO)',
          time: customMerchantStore.prepTime || '10 min',
          lat: customMerchantStore.lat || 20.5230,
          lng: customMerchantStore.lng || -100.8120
        }] : []),
        { id: 101, name: 'Tortería El Pariente', address: 'Calle 5 de Mayo #12', rating: '4.9 ★', time: '12 min', lat: 20.5230, lng: -100.8120 },
        { id: 102, name: 'Tortas Ahogadas El Güero', address: 'Av. Tecnológico #88', rating: '4.7 ★', time: '15 min', lat: 20.5255, lng: -100.8160 }
      ]
    },
    {
      category: 'Ferreterías & Materiales',
      icon: Wrench,
      stores: [
        { id: 201, name: 'Ferretería La Central', address: 'Blvd. López Mateos #45', rating: '4.8 ★', time: '20 min', lat: 20.5210, lng: -100.8240 },
        { id: 202, name: 'El Clavo de Oro', address: 'Calle Zaragoza #102', rating: '4.6 ★', time: '18 min', lat: 20.5190, lng: -100.8110 }
      ]
    },
    {
      category: 'Farmacias & Salud',
      icon: Pill,
      stores: [
        { id: 301, name: 'Farmacia San Gabriel', address: 'Zona Centro #5', rating: '5.0 ★', time: '10 min', lat: 20.5280, lng: -100.8200 },
        { id: 302, name: 'Farmacia del Pueblo', address: 'Av. México #304', rating: '4.8 ★', time: '12 min', lat: 20.5165, lng: -100.8080 }
      ]
    }
  ]

  const activeWaypoints = categoriesData.flatMap(cat =>
    cat.stores
      .filter(st => searchQuery === '' || st.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.category.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(st => ({
        id: String(st.id),
        title: st.name,
        lat: st.lat,
        lng: st.lng,
        type: 'ORIGIN' as const
      }))
  )

  return (
    <CustomerLayout>
      <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[650px]">
        
        {/* COLUMNA IZQUIERDA EN PC / TABLETAS: PANEL DE BÚSQUEDA & COMERCIOS */}
        <aside className="hidden lg:flex flex-col w-96 bg-white rounded-[32px] p-5 border border-[#e5e2e1] shadow-xl h-[680px] space-y-4">

          {/* Pestañas Superiores de Cambio de Tab en PC */}
          <div className="flex gap-2 p-1 bg-[#f0eded] rounded-full shrink-0">
            <button
              onClick={() => setSelectedTab('STORES')}
              className={`flex-1 py-2 rounded-full text-xs font-black transition-all ${
                selectedTab === 'STORES' ? 'bg-[#0056d2] text-white shadow-md' : 'text-[#737785] hover:text-[#1c1b1b]'
              }`}
            >
              🏬 Comercios ({activeWaypoints.length})
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

          {/* Buscador Integrado en Panel PC */}
          <div className="bg-[#fcf9f8] px-4 py-2.5 rounded-full flex items-center gap-2 border border-[#e5e2e1] shrink-0">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por tortas, ferretería, farmacia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-extrabold outline-none text-[#1c1b1b] w-full"
            />
          </div>

          {/* CONTENIDO DEL PANEL LATERAL PC: LISTA DE COMERCIOS O PROMOS */}
          {selectedTab === 'PROMOS' ? (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <h4 className="text-xs font-black text-[#161e00] uppercase tracking-wider block">Promociones Activas (Haz clic para ver foto)</h4>
              {promoList.map(promo => (
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
              ))}
            </div>
          ) : (
            <div className="space-y-5 flex-1 overflow-y-auto pr-1">
              {categoriesData
                .filter(c => searchQuery === '' || c.category.toLowerCase().includes(searchQuery.toLowerCase()) || c.stores.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5">
                      <cat.icon className="w-4 h-4 text-[#0056d2]" />
                      {cat.category}
                    </h4>

                    <div className="space-y-2">
                      {cat.stores
                        .filter(st => searchQuery === '' || st.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.category.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(st => (
                          <div
                            key={st.id}
                            onClick={() => setSelectedStore({
                              id: st.id,
                              name: st.name,
                              category: cat.category,
                              time: st.time,
                              rating: st.rating,
                              image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format&fit=crop'
                            })}
                            className="bg-[#fcf9f8] p-3.5 rounded-2xl border border-[#e5e2e1] flex justify-between items-center hover:bg-[#0056d2]/10 transition-all cursor-pointer group"
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
                ))}
            </div>
          )}

        </aside>

        {/* COLUMNA DERECHA EN PC / CENTRAL: MAPA VECTORIAL PANORÁMICO */}
        <div className="relative flex-1 h-[520px] lg:h-[680px] rounded-[32px] overflow-hidden border border-[#e5e2e1] shadow-xl">
          
          {/* BARRA SUPERIOR MÓVIL EXCLUSIVA (Solo Celular) */}
          <div className="lg:hidden absolute top-3 inset-x-3 z-30 flex gap-2 justify-center pointer-events-auto">
            <button
              type="button"
              onClick={() => setActiveModal('PROMOS')}
              className="bg-[#161e00] text-[#c3f400] px-3.5 py-2 rounded-full font-black text-[11px] shadow-lg border border-[#c3f400]/40 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#c3f400]" />
              <span>Promos 🏷️</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('CATEGORIES')}
              className="bg-[#0056d2] text-white px-3.5 py-2 rounded-full font-black text-[11px] shadow-lg border border-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-[#c3f400]" />
              <span>Comercios 🏬</span>
            </button>
          </div>

          {/* Mapa Vectorial VamoMapLibre con Marcadores Filtrados Dinámicamente */}
          <VamoMapLibre
            center={[20.5218, -100.8142]}
            zoom={14}
            theme="light"
            mode3D={false}
            waypoints={activeWaypoints}
            className="w-full h-full"
          />

          {/* Tarjeta Flotante Inferior de Comercio Seleccionado (Móvil y PC) */}
          <div className="absolute bottom-4 inset-x-4 max-w-md mx-auto z-20 pointer-events-auto animate-fade-in">
            <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-3.5 shadow-2xl border border-[#e5e2e1] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img src={selectedStore.image} alt={selectedStore.name} className="w-11 h-11 rounded-2xl object-cover border border-[#e5e2e1] shrink-0 shadow-xs" />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-[#1c1b1b] truncate">{selectedStore.name}</h3>
                  <span className="text-[11px] font-extrabold text-[#0056d2] block">⏱️ {selectedStore.time} &bull; {selectedStore.rating}</span>
                </div>
              </div>

              <Link 
                href={`/customer/store/${selectedStore.id}`}
                className="bg-[#0056d2] hover:bg-[#0040a1] text-white rounded-full font-black text-xs px-4 py-2.5 shrink-0 shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ver Productos & Catálogo 🛍️</span>
              </Link>
            </div>
          </div>

        </div>

        {/* MODAL DESLIZANTE DE PROMOCIONES EN MÓVIL */}
        {activeModal === 'PROMOS' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#161e00] text-[#c3f400] flex items-center justify-center font-black">
                    🏷️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1c1b1b]">Promociones Exclusivas VAMO</h3>
                    <p className="text-xs font-semibold text-[#737785]">Ofertas y cupones directo a tu domicilio</p>
                  </div>
                </div>

                <button onClick={() => setActiveModal('NONE')} className="p-2 rounded-full bg-[#f0eded] text-[#1c1b1b]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {promoList.map(promo => (
                  <div 
                    key={promo.id} 
                    onClick={() => { setActiveModal('NONE'); setSelectedPromo(promo); }}
                    className="bg-[#fcf9f8] p-4 rounded-2xl border border-[#e5e2e1] flex justify-between items-center shadow-sm hover:border-[#0056d2] transition-all cursor-pointer group"
                  >
                    <div>
                      <span className="bg-[#c3f400] text-[#161e00] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                        {promo.badge}
                      </span>
                      <strong className="text-sm font-extrabold text-[#1c1b1b] group-hover:text-[#0056d2] transition-colors block mt-1">{promo.title}</strong>
                      <span className="text-xs font-bold text-[#0056d2]">{promo.store}</span>
                    </div>

                    <div className="text-right">
                      <span className="bg-[#0056d2] text-white text-xs font-mono font-black px-3 py-1.5 rounded-xl block">
                        {promo.discount}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">Ver Foto 📸</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL DESLIZANTE DE BÚSQUEDA DE COMERCIOS POR CATEGORÍA EN MÓVIL */}
        {activeModal === 'CATEGORIES' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-black">
                    🏬
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1c1b1b]">Directorio de Comercios en Lista</h3>
                    <p className="text-xs font-semibold text-[#737785]">Encuentra torterías, ferreterías, farmacias y más</p>
                  </div>
                </div>

                <button onClick={() => setActiveModal('NONE')} className="p-2 rounded-full bg-[#f0eded] text-[#1c1b1b]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Buscador de Categoría */}
              <div className="bg-[#f0eded] px-4 py-2.5 rounded-full flex items-center gap-2 border border-slate-200">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ej. Torterías, Ferreterías, Farmacias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs font-extrabold outline-none text-[#1c1b1b] w-full"
                />
              </div>

              <div className="space-y-4">
                {categoriesData
                  .filter(c => searchQuery === '' || c.category.toLowerCase().includes(searchQuery.toLowerCase()) || c.stores.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map((cat, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-1.5">
                        <cat.icon className="w-4 h-4 text-[#0056d2]" />
                        {cat.category}
                      </h4>

                      <div className="space-y-2">
                        {cat.stores
                          .filter(st => searchQuery === '' || st.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.category.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(st => (
                            <Link
                              key={st.id}
                              href={`/customer/store/${st.id}`}
                              className="bg-[#fcf9f8] p-3.5 rounded-2xl border border-[#e5e2e1] flex justify-between items-center hover:bg-[#e5e2e1]/40 transition-colors"
                            >
                              <div>
                                <strong className="text-xs font-extrabold text-[#1c1b1b] block">{st.name}</strong>
                                <span className="text-[10px] font-bold text-slate-500">{st.address}</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-[#726200] bg-[#fddf33]/30 px-2 py-0.5 rounded-full">
                                  {st.rating}
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              </div>
                            </Link>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL FLOTANTE DE DETALLE DE PROMOCIÓN CON FOTOGRAFÍA EN ALTA RESOLUCIÓN */}
        {selectedPromo && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl border border-[#e5e2e1] space-y-0 relative animate-in zoom-in-95 duration-200">
              
              {/* Imagen de Impacto de la Promoción */}
              <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                <img 
                  src={selectedPromo.image} 
                  alt={selectedPromo.title}
                  className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                
                {/* Botón Cerrar X */}
                <button 
                  onClick={() => setSelectedPromo(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Badges Flotantes sobre Foto */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-3 py-1 rounded-full uppercase shadow-md">
                    {selectedPromo.badge}
                  </span>
                  <span className="bg-[#0056d2] text-white text-xs font-mono font-black px-3 py-1 rounded-full shadow-md">
                    {selectedPromo.discount}
                  </span>
                </div>

                {/* Título en Footer de Foto */}
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="text-[10px] font-extrabold uppercase text-[#c3f400] tracking-wider block">{selectedPromo.store}</span>
                  <h3 className="text-lg font-black leading-snug">{selectedPromo.title}</h3>
                </div>
              </div>

              {/* Cuerpo del Modal */}
              <div className="p-6 space-y-4">
                <p className="text-xs sm:text-sm font-semibold text-[#424654] leading-relaxed">
                  {selectedPromo.description}
                </p>

                {/* Código de Cupón Exclusivo */}
                <div className="bg-[#f0eded] p-3.5 rounded-2xl border border-dashed border-[#0056d2]/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#737785] uppercase block">CÓDIGO DE DESCUENTO VAMO</span>
                    <strong className="text-sm font-mono font-black text-[#0056d2] tracking-wider">{selectedPromo.code}</strong>
                  </div>
                  <span className="text-[10px] font-bold text-[#161e00] bg-[#c3f400] px-2.5 py-1 rounded-full">
                    {selectedPromo.validUntil}
                  </span>
                </div>

                {/* Botón Principal de Reclamar Promo */}
                <Link
                  href={`/customer/store/${selectedPromo.storeId}`}
                  onClick={() => setSelectedPromo(null)}
                  className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-full font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-center"
                >
                  <Tag className="w-4 h-4 text-[#c3f400]" />
                  <span>APLICAR PROMO Y RECLAMAR PEDIDO 🚀</span>
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  )
}
