'use client'

import React, { useState, useEffect } from 'react'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { Plus, Edit, Sparkles, PackageCheck, AlertTriangle, ShoppingBag, Truck, CheckCircle2, X, Tag, Image, Clock, Check } from 'lucide-react'
import { publishMerchantPromotion } from '@/lib/services/promotionService'
import { SupabaseImageUploader } from '@/components/ui/SupabaseImageUploader'

export default function BizCatalogPage() {
  const [filter, setFilter] = useState<'quick_list' | 'all' | 'promos' | 'out_of_stock' | 'b2b_supplies'>('quick_list')
  const [b2bCategory, setB2bCategory] = useState<string>('TODOS')
  const [b2bCartItems, setB2bCartItems] = useState<{ id: number; title: string; price: number; qty: number }[]>([])
  const [selectedB2bItem, setSelectedB2bItem] = useState<any | null>(null)
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false)

  // ESTADO DE LA LISTA RÁPIDA DE PRODUCTOS (TOP 20 A 50 SIN FOTOS OBLIGATORIAS)
  interface QuickProduct {
    id: string
    name: string
    category: string
    price: number
    inStock: boolean
    unit?: string
  }

  const [quickProducts, setQuickProducts] = useState<QuickProduct[]>([
    { id: '1', name: 'Torta Cubana Gigante', category: 'Especialidades', price: 95.00, inStock: true, unit: 'pza' },
    { id: '2', name: 'Torta de Pierna Adobada', category: 'Clásicas', price: 75.00, inStock: true, unit: 'pza' },
    { id: '3', name: 'Refresco Coca-Cola 600ml', category: 'Bebidas', price: 25.00, inStock: true, unit: 'botella' },
    { id: '4', name: 'Agua Fresca de Horchata 1L', category: 'Bebidas', price: 35.00, inStock: true, unit: 'litro' },
    { id: '5', name: 'Orden de Papas a la Francesa', category: 'Complementos', price: 45.00, inStock: true, unit: 'orden' }
  ])

  const [newQuickName, setNewQuickName] = useState('')
  const [newQuickCategory, setNewQuickCategory] = useState('General')
  const [newQuickPrice, setNewQuickPrice] = useState('')
  const [newQuickUnit, setNewQuickUnit] = useState('pza')
  const [showAddQuickModal, setShowAddQuickModal] = useState(false)
  const [catalogPdfUrl, setCatalogPdfUrl] = useState('')

  useEffect(() => {
    try {
      const storedList = localStorage.getItem('vamo_quick_product_list')
      if (storedList) {
        setQuickProducts(JSON.parse(storedList))
      }
      const storedProfile = localStorage.getItem('vamo_merchant_profile')
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile)
        if (parsed.catalogPdfUrl) setCatalogPdfUrl(parsed.catalogPdfUrl)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const saveQuickProducts = (list: QuickProduct[]) => {
    setQuickProducts(list)
    try {
      localStorage.setItem('vamo_quick_product_list', JSON.stringify(list))
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddQuickProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuickName.trim() || !newQuickPrice) return

    if (quickProducts.length >= 50) {
      alert('Has alcanzado el límite de 50 productos en tu lista rápida.')
      return
    }

    const newItem: QuickProduct = {
      id: Date.now().toString(),
      name: newQuickName.trim(),
      category: newQuickCategory.trim() || 'General',
      price: parseFloat(newQuickPrice) || 0,
      inStock: true,
      unit: newQuickUnit.trim() || 'pza'
    }

    const updated = [newItem, ...quickProducts]
    saveQuickProducts(updated)

    setNewQuickName('')
    setNewQuickPrice('')
    setShowAddQuickModal(false)
  }

  const handleToggleStock = (id: string) => {
    const updated = quickProducts.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p)
    saveQuickProducts(updated)
  }

  const handleDeleteQuickProduct = (id: string) => {
    const updated = quickProducts.filter(p => p.id !== id)
    saveQuickProducts(updated)
  }

  // ESTADOS DEL CREADOR DE PROMOCIONES DE COMERCIO
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoTitle, setPromoTitle] = useState('')
  const [promoStoreName, setPromoStoreName] = useState('Mi Local Afiliado VAMO')
  const [promoCategory, setPromoCategory] = useState('Comida / Restaurante')
  const [promoDiscount, setPromoDiscount] = useState('50% OFF')
  const [promoCode, setPromoCode] = useState('PROMOVAMO')
  const [promoBadge, setPromoBadge] = useState('POPULAR')
  const [promoImage, setPromoImage] = useState('https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=700&auto=format&fit=crop')
  const [promoDescription, setPromoDescription] = useState('')
  const [promoValidUntil, setPromoValidUntil] = useState('Válido hoy hasta las 11:00 PM')
  const [publishedSuccess, setPublishedSuccess] = useState(false)

  const handlePublishPromo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoTitle || !promoDescription) return

    await publishMerchantPromotion({
      store_name: promoStoreName,
      category: promoCategory,
      title: promoTitle,
      image_url: promoImage || 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=700&auto=format&fit=crop',
      discount_badge: promoDiscount,
      code: promoCode,
      description: promoDescription,
      valid_until: promoValidUntil,
      badge_type: promoBadge
    })

    setPublishedSuccess(true)
    setTimeout(() => {
      setPublishedSuccess(false)
      setShowPromoModal(false)
      setPromoTitle('')
      setPromoDescription('')
    }, 1200)
  }

  const products = [
    {
      id: 1,
      title: 'Tomates Orgánicos',
      price: '$45.00 / kg',
      stock: '42 kg disponibles',
      status: 'in_stock',
      statusLabel: 'En Stock',
      badgeBg: 'bg-[#ffe245] text-[#211b00]',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB92KI3FeUznRHkPvheAjOk3b8QJwUNRd4lstSUVlfw7-FBuk9Tl0LiGSro2DzOKVUXrNV5wDlekWZXjwrD9gFBkmUJP2UCAEB8V2vDJ8KUK6gMMWgBLGdF8ktVRPJkorNW66qe4zzsGGZM_AvfrHFCksUXWVv1RLZFhOBd3SKCAMhxWFZY7Ns6u44tInLWD_lrLU4JRvKhUUpZewB-E2hk2ya5olUgtXz6nlvJ1Goi4hi237SLx_DI'
    },
    {
      id: 2,
      title: 'Miel de Abeja Artesanal',
      price: '$120.00 / frasco',
      stock: '5 frascos disponibles',
      status: 'low_stock',
      statusLabel: 'Poco Stock',
      badgeBg: 'bg-[#506600] text-white',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEfUIah1574VaZYM2EebgKGZ6QkpjnS71iuzNkIxht64nhGEfzcBS5p0ZPS0YIWcXx6oNQrEnUm-cFbsG9UQfTPI--TRRyBOuKu5F5x1WhDJOp1ASw_rLH7Uj7cfjuo4HClUYxpoafVUBt-1G_8QxpNeN0n34e9jYRWcEGLnKYOk7Nvt0Octj4j8EfKFsjPipP-iWSZLQiYqfLDQR_OXoInwmaUTLDH1G40o4ON37zK9fW9O3cM1lp'
    },
    {
      id: 3,
      title: 'Granola Artesanal',
      price: '$85.00 / bolsa',
      stock: '0 disponibles',
      status: 'out_of_stock',
      statusLabel: 'Agotado',
      badgeBg: 'bg-[#ffdad6] text-[#ba1a1a]',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPLrcId8qiYVNqtKOl0_ZA2dVcd3EchyzIFWBEleISIR8emU4yp2B1AiqFxI_0szHCWCittzm_ewJkvYCOQsaT7I2lEn01KrJ_Fxl010vlBG4UGGXcxLUGiw3URR0OGqABmhM4YqRccvLg5HlHlbOTF6xu3HOUyN0e8cNi6jFGXeo-hN5PHF3OMPTNKkYpmGE5-OAFHYjO72rf0qID1Dz663KKB2YbPV2gIAn6Rh9e3i2r3em5oMVY'
    }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      {/* Sidebar Responsivo */}
      <SidebarBiz activeTab="catalog" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-8 py-6 md:py-10 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0056d2] tracking-tight">
                Editor de Catálogo
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#737785] mt-1">
                Administra tus productos y promociones locales.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setShowPromoModal(true)}
                className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-5 py-3 rounded-full text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Tag className="w-5 h-5 text-[#161e00]" />
                <span>+ Crear Promoción Exclusiva</span>
              </button>

              <button 
                onClick={() => setShowAddQuickModal(true)}
                className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-3 rounded-full text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-[#0056d2]/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>+ Agregar Producto a Lista Rápida</span>
              </button>
            </div>
          </div>

          {/* Banner de Catálogo / Menú en PDF o Flyer */}
          {catalogPdfUrl && (
            <div className="bg-[#161e00] text-white p-5 rounded-[28px] border border-[#c3f400]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black shrink-0">
                  📄
                </div>
                <div>
                  <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2 py-0.5 rounded-full uppercase">
                    CATÁLOGO DIGITAL ACTIVO
                  </span>
                  <h4 className="text-sm font-black text-white mt-0.5">Menú o Catálogo Completo en PDF / Flyer</h4>
                  <p className="text-xs text-slate-300 font-semibold truncate max-w-md">{catalogPdfUrl}</p>
                </div>
              </div>

              <a
                href={catalogPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-5 py-2.5 rounded-full text-xs font-black shrink-0 shadow-sm active:scale-95 transition-all"
              >
                Ver Catálogo PDF ↗
              </a>
            </div>
          )}

          {/* Filtros Tab: Lista Rápida vs Catálogo con Foto vs Insumos B2B */}
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            <button 
              onClick={() => setFilter('quick_list')}
              className={`px-5 py-2.5 rounded-full font-black text-xs sm:text-sm whitespace-nowrap transition-all ${
                filter === 'quick_list' ? 'bg-[#0056d2] text-white shadow-sm' : 'bg-white text-[#1c1b1b] border border-[#e5e2e1]'
              }`}
            >
              📋 Lista Rápida (Top {quickProducts.length}/50)
            </button>
            <button 
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                filter === 'all' ? 'bg-[#0056d2] text-white shadow-sm' : 'bg-white text-[#1c1b1b] border border-[#e5e2e1]'
              }`}
            >
              🖼️ Productos con Foto
            </button>
            <button 
              onClick={() => setFilter('b2b_supplies')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                filter === 'b2b_supplies' ? 'bg-[#c3f400] text-[#161e00] font-black shadow-sm' : 'bg-white text-[#1c1b1b] border border-[#e5e2e1]'
              }`}
            >
              🛒 Pedidos & Insumos B2B
            </button>
            <button 
              onClick={() => setFilter('promos')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                filter === 'promos' ? 'bg-[#0056d2] text-white shadow-sm' : 'bg-white text-[#1c1b1b] border border-[#e5e2e1]'
              }`}
            >
              Promociones & Lealtad
            </button>
          </div>

          {/* VISTA 1: LISTA RÁPIDA DE PRODUCTOS (TOP 20 A 50 SIN FOTOS) */}
          {filter === 'quick_list' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full uppercase">
                      LIGERO • SIN FOTOS OBLIGATORIAS
                    </span>
                    <h3 className="text-lg font-black text-[#1c1b1b] mt-1">
                      Tus Productos Más Vendidos ({quickProducts.length} de 50)
                    </h3>
                    <p className="text-xs font-semibold text-[#737785]">
                      Esta lista se muestra en el Radar Urbano para que tus clientes pidan en segundos sin gastar datos ni sobrecargar el sistema.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddQuickModal(true)}
                    className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-4 py-2 rounded-xl text-xs font-black shrink-0 active:scale-95 transition-all"
                  >
                    + Agregar Fila Rápida
                  </button>
                </div>

                {/* Tabla de Productos Rápida */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e5e2e1] text-[#737785] font-black uppercase text-[10px]">
                        <th className="py-3 px-2">#</th>
                        <th className="py-3 px-2">Producto / Servicio</th>
                        <th className="py-3 px-2">Categoría</th>
                        <th className="py-3 px-2">Precio ($ MXN)</th>
                        <th className="py-3 px-2">Existencia</th>
                        <th className="py-3 px-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quickProducts.map((prod, idx) => (
                        <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-2 font-black text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-2 font-black text-[#1c1b1b] text-sm">{prod.name}</td>
                          <td className="py-3.5 px-2">
                            <span className="bg-[#f0eded] text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {prod.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 font-black text-[#0056d2] text-sm">
                            ${prod.price.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ {prod.unit || 'pza'}</span>
                          </td>
                          <td className="py-3.5 px-2">
                            <button
                              onClick={() => handleToggleStock(prod.id)}
                              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                                prod.inStock 
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                  : 'bg-rose-100 text-rose-900 border border-rose-300'
                              }`}
                            >
                              {prod.inStock ? '🟢 Disponible' : '🔴 Agotado'}
                            </button>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <button
                              onClick={() => handleDeleteQuickProduct(prod.id)}
                              className="text-rose-600 hover:text-rose-800 font-bold text-[11px] p-1 rounded-lg hover:bg-rose-50"
                              title="Eliminar de la lista"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* VISTA B2B: COMPRA DE INSUMOS ENTRE COMERCIOS CON REPARTO VAMO AUTOMÁTICO */}
          {filter === 'b2b_supplies' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#161e00] text-[#c3f400] p-6 rounded-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg border border-[#c3f400]/30">
                <div className="space-y-1">
                  <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    RED B2B DE INSUMOS LOCALES
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Abastecimiento Directo entre Comercios</h2>
                  <p className="text-xs font-semibold text-[#c3f400]/90">
                    Compra desechables, empaques, refacciones o medicamentos a locatarios cercanos. ¡Repartidor VAMO asignado automáticamente!
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (b2bCartItems.length === 0) {
                        alert('Selecciona al menos un insumo para realizar tu pedido express.')
                        return
                      }
                      setSelectedB2bItem({
                        title: 'Pedido B2B Multilocal Express',
                        vendor: 'Proveedores Afiliados VAMO',
                        price: b2bCartItems.reduce((acc, item) => acc + (item.price * item.qty), 0),
                        eta: '14 min',
                        items: b2bCartItems
                      })
                    }}
                    className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-6 py-3.5 rounded-full text-xs font-black shadow-md active:scale-95 transition-all whitespace-nowrap flex items-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>MI CARRITO B2B ({b2bCartItems.reduce((a, b) => a + b.qty, 0)})</span>
                  </button>
                </div>
              </div>

              {/* Selector de Categorías B2B */}
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {['TODOS', 'EMPAQUES', 'FARMACIA', 'REFACCIONES', 'INSUMOS COCINA'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setB2bCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border ${
                      b2bCategory === cat
                        ? 'bg-[#0056d2] text-white border-[#0056d2] shadow-sm'
                        : 'bg-white text-[#737785] border-[#e5e2e1] hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Catálogo B2B Filtrado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    id: 101,
                    category: 'EMPAQUES',
                    vendor: 'Empaques & Desechables Bajío',
                    dist: '1.2 km',
                    title: 'Caja 500U Vaso Térmico + Tapas 12oz',
                    desc: 'Grado alimenticio alto impacto, ideal para café y licuados.',
                    price: 340.00,
                    eta: '15 min'
                  },
                  {
                    id: 102,
                    category: 'FARMACIA',
                    vendor: 'Farmacia San José',
                    dist: '0.8 km',
                    title: 'Botiquín Primario + Alcohol 70% 1L',
                    desc: 'Sanitizante norma SSA + apósitos estériles para cocina/negocio.',
                    price: 195.00,
                    eta: '12 min'
                  },
                  {
                    id: 103,
                    category: 'REFACCIONES',
                    vendor: 'Refaccionaria El Engrane',
                    dist: '2.5 km',
                    title: 'Kit Aceite 4T 20W50 + Bujía Italika FT150',
                    desc: 'Mantenimiento preventivo express para motos de reparto.',
                    price: 280.00,
                    eta: '20 min'
                  },
                  {
                    id: 104,
                    category: 'EMPAQUES',
                    vendor: 'Bolsas & Cajas Celaya',
                    dist: '1.9 km',
                    title: 'Bolsas Kraft Biodegradables 100U',
                    desc: 'Manija reforzada para delivery de comida o abarrotes.',
                    price: 210.00,
                    eta: '18 min'
                  },
                  {
                    id: 105,
                    category: 'INSUMOS COCINA',
                    vendor: 'Distribuidora Abastos Norte',
                    dist: '3.1 km',
                    title: 'Bidón 20L Aceite Vegetal Puro',
                    desc: 'Sello de calidad gastronómica para freidoras e insumos.',
                    price: 680.00,
                    eta: '25 min'
                  }
                ]
                .filter(item => b2bCategory === 'TODOS' || item.category === b2bCategory)
                .map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-[28px] border border-[#e5e2e1] shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black bg-[#0056d2]/10 text-[#0056d2] px-2.5 py-1 rounded-full uppercase">
                          {item.vendor}
                        </span>
                        <span className="text-xs font-bold text-[#737785]">A {item.dist}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-[#1c1b1b] leading-snug">{item.title}</h3>
                      <p className="text-xs font-semibold text-[#737785] line-clamp-2">{item.desc}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <div>
                        <strong className="text-lg font-extrabold text-[#0056d2]">${item.price.toFixed(2)}</strong>
                        <span className="text-[10px] font-semibold text-[#737785] block">ETA Reparto: {item.eta}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setB2bCartItems(prev => {
                            const exists = prev.find(i => i.id === item.id)
                            if (exists) {
                              return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
                            }
                            return [...prev, { id: item.id, title: item.title, price: item.price, qty: 1 }]
                          })
                          setSelectedB2bItem({
                            title: item.title,
                            vendor: item.vendor,
                            price: item.price,
                            eta: item.eta
                          })
                        }}
                        className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-4 py-2.5 rounded-full text-xs font-extrabold active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Pedir a Local</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* MODAL / DRAWER INTERACTIVO CONFIRMACIÓN PEDIDO B2B */}
              {selectedB2bItem && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up relative">
                    <button
                      onClick={() => {
                        setSelectedB2bItem(null)
                        setIsOrderConfirmed(false)
                      }}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {!isOrderConfirmed ? (
                      <>
                        <div className="space-y-1">
                          <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                            CONFIRMACIÓN DE PEDIDO B2B
                          </span>
                          <h3 className="text-xl font-extrabold text-[#1c1b1b]">{selectedB2bItem.title}</h3>
                          <p className="text-xs font-semibold text-[#737785]">Proveedor: {selectedB2bItem.vendor}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>Subtotal Insumos:</span>
                            <span>${selectedB2bItem.price.toFixed(2)} MXN</span>
                          </div>
                          <div className="flex justify-between font-bold text-[#0056d2]">
                            <span>Envío Repartidor VAMO:</span>
                            <span>$25.00 MXN</span>
                          </div>
                          <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-base text-slate-900">
                            <span>Total a pagar:</span>
                            <span>${(selectedB2bItem.price + 25).toFixed(2)} MXN</span>
                          </div>
                        </div>

                        <div className="bg-[#f5fff6] p-3 rounded-2xl border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900 font-bold">
                          <Truck className="w-5 h-5 text-[#0056d2] shrink-0" />
                          <div>
                            <span>Tiempo de entrega estimado: <b>{selectedB2bItem.eta}</b></span>
                            <span className="block text-[10px] text-emerald-700 font-normal">Repartidor VAMO en camino tras confirmación</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsOrderConfirmed(true)}
                          className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-full text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <PackageCheck className="w-5 h-5" />
                          <span>CONFIRMAR Y ASIGNAR REPARTIDOR VAMO</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-4 space-y-4">
                        <div className="w-16 h-16 bg-[#c3f400] text-[#161e00] rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-[#1c1b1b]">¡PEDIDO B2B EN CAMINO!</h3>
                          <p className="text-xs font-bold text-[#737785]">
                            El repartidor VAMO ha sido notificado y se dirige al local proveedor para recoger tus insumos.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedB2bItem(null)
                            setIsOrderConfirmed(false)
                          }}
                          className="bg-[#161e00] text-[#c3f400] px-6 py-2.5 rounded-full text-xs font-black shadow-sm"
                        >
                          VOLVER AL CATÁLOGO
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bento Grid Layout para Productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* tarjeta Bento Grande: Promoción de Lealtad */}
            {(filter === 'all' || filter === 'promos') && (
              <div className="md:col-span-2 bg-[#fddf33] rounded-[32px] p-6 shadow-md flex flex-col sm:flex-row gap-6 items-center relative overflow-hidden group">
                <div className="w-full sm:w-1/3 h-44 rounded-2xl overflow-hidden relative flex-shrink-0">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtXD87x-K3v7iqEVXXq2w7jBP2ychf9R9fxwCZXk4FXbX2V-jkguuFfrD_FpG56SgCg-hPbn81HuwrdMakjD5JzHWTBrgMnq5gWv6vfVPUG3cXe7twrdyhc2WNZBpgD23nTo6jKqvDrXa8fYZwEpRdZNpsO9AhK42N9Mj7wGqoazW_BEsodTzC-IZC1fqnMbsIWwct3pK4v49aARZv6NNEnwxfRWhdci_Ga8RL7zgew48RjK679OeM" 
                    alt="Pan Artesanal"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#3c4d00] text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" /> Lealtad VAMO
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#726200] leading-tight">
                    10% De Descuento en Pan Temprano
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-[#726200] opacity-90">
                    Para vecinos frecuentes. Se aplica automáticamente a usuarios con 5+ pedidos este mes.
                  </p>
                  <div className="pt-2">
                    <button className="px-5 py-2.5 rounded-full bg-[#726200] text-white font-extrabold text-xs hover:bg-[#524700] active:scale-95 transition-all shadow-sm">
                      Editar Promo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tarjetas Estándar de Producto */}
            {products
              .filter(p => filter === 'all' || (filter === 'out_of_stock' && p.status === 'out_of_stock'))
              .map(p => (
                <div key={p.id} className="bg-white rounded-[32px] p-6 border border-[#e5e2e1] shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="w-full h-44 rounded-2xl overflow-hidden relative bg-[#f6f3f2]">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                      <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black shadow-sm ${p.badgeBg}`}>
                        {p.statusLabel}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#1c1b1b]">{p.title}</h3>
                      <p className="text-base font-extrabold text-[#0056d2] mt-1">{p.price}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#f0eded] flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#737785]">{p.stock}</span>
                    <button className="w-9 h-9 rounded-full bg-[#f0eded] hover:bg-[#0056d2] hover:text-white text-[#1c1b1b] flex items-center justify-center transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

            {/* Tarjeta de Acción Rápida */}
            <div 
              onClick={() => setShowAddQuickModal(true)}
              className="bg-[#f0eded] rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center text-center hover:bg-[#e5e2e1] active:scale-95 cursor-pointer transition-all duration-300 border-2 border-dashed border-[#0056d2]/30 min-h-[280px]"
            >
              <div className="w-14 h-14 rounded-full bg-[#0056d2] text-white flex items-center justify-center mb-3 shadow-md">
                <Plus className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1c1b1b]">Agregar Producto</h3>
              <p className="text-xs font-semibold text-[#737785] max-w-[200px] mt-1">
                Amplía tu catálogo con nuevos productos para tus vecinos.
              </p>
            </div>

          </div>
        </main>
      </div>

      {/* MODAL FORMULARIO: CREADOR DE PROMOCIONES DE COMERCIO (CUALQUIER TIPO DE LOCAL) */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-[#e5e2e1] relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowPromoModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                PUBLICAR OFERTA EN RADAR CLIENTE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#1c1b1b]">Crear Promoción Exclusiva</h3>
              <p className="text-xs font-semibold text-[#737785]">Configura la foto, descripción y cupón para cualquier tipo de negocio</p>
            </div>

            {publishedSuccess ? (
              <div className="bg-[#c3f400] text-[#161e00] p-6 rounded-[24px] text-center font-black text-sm space-y-2 animate-bounce">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <p>¡PROMOCIÓN PUBLICADA EN REALTIME!</p>
                <span className="text-xs font-bold block text-[#161e00]/80">Cualquier cliente ya puede verla y reclamarla en la ventana flotante.</span>
              </div>
            ) : (
              <form onSubmit={handlePublishPromo} className="space-y-4">
                
                {/* Nombre de tu Local */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Nombre de tu Negocio / Local</label>
                  <input
                    type="text"
                    value={promoStoreName}
                    onChange={e => setPromoStoreName(e.target.value)}
                    placeholder="Ej. Tortería El Pariente / Ferretería La Central"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>

                {/* Tipo / Categoría de Local */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#1c1b1b]">Categoría del Negocio</label>
                    <select
                      value={promoCategory}
                      onChange={e => setPromoCategory(e.target.value)}
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-3 py-2.5 text-xs font-bold outline-none"
                    >
                      <option value="Comida / Restaurante">Comida / Restaurante 🍕</option>
                      <option value="Farmacia & Salud">Farmacia & Salud 💊</option>
                      <option value="Ferretería & Materiales">Ferretería & Materiales 🛠️</option>
                      <option value="Abarrotes & Supermercado">Abarrotes & Supermercado 🛒</option>
                      <option value="Ropa & Calzado">Ropa & Calzado 👕</option>
                      <option value="Servicios & Refacciones">Servicios & Refacciones 🔧</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#1c1b1b]">Badge Promocional</label>
                    <select
                      value={promoBadge}
                      onChange={e => setPromoBadge(e.target.value)}
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-3 py-2.5 text-xs font-bold outline-none"
                    >
                      <option value="POPULAR">POPULAR 🔥</option>
                      <option value="HOY">HOY ⏰</option>
                      <option value="EXCLUSIVO">EXCLUSIVO ⭐</option>
                      <option value="COMBO">COMBO 🍔</option>
                      <option value="NUEVO">NUEVO 🎉</option>
                    </select>
                  </div>
                </div>

                {/* Título de la Promoción */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Título de la Promoción o Platillo/Producto</label>
                  <input
                    type="text"
                    value={promoTitle}
                    onChange={e => setPromoTitle(e.target.value)}
                    placeholder="Ej. 2x1 en Tortas Cubanas / 20% Desc. en Pinturas"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>

                {/* Fotografía HD subida directamente a Supabase Storage */}
                <SupabaseImageUploader
                  label="Fotografía HD del Producto u Oferta (Subir a Supabase Storage)"
                  currentImageUrl={promoImage}
                  onUploadSuccess={(url) => setPromoImage(url)}
                  bucketName="store-assets"
                />

                {/* Beneficio y Cupón */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#1c1b1b]">Beneficio / Etiqueta Descuento</label>
                    <input
                      type="text"
                      value={promoDiscount}
                      onChange={e => setPromoDiscount(e.target.value)}
                      placeholder="Ej. 50% OFF / ENVÍO $0 / 2X1"
                      required
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-3 py-2 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#1c1b1b]">Código de Cupón Único</label>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      placeholder="Ej. PARIENTE2X1"
                      required
                      className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-3 py-2 text-xs font-bold outline-none uppercase font-mono"
                    />
                  </div>
                </div>

                {/* Descripción y Vigencia */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Descripción Detallada / Especificaciones del Local</label>
                  <textarea
                    value={promoDescription}
                    onChange={e => setPromoDescription(e.target.value)}
                    placeholder="Describe qué incluye la oferta, especificaciones del platillo o materiales y condiciones..."
                    rows={3}
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl p-3 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Vigencia / Horario de la Oferta</label>
                  <input
                    type="text"
                    value={promoValidUntil}
                    onChange={e => setPromoValidUntil(e.target.value)}
                    placeholder="Ej. Válido hoy hasta las 11:00 PM / Válido fin de semana"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 rounded-full font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-[#c3f400]" />
                  <span>PUBLICAR PROMO EN RADAR CLIENTE 🚀</span>
                </button>

              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL FORMULARIO: AGREGAR PRODUCTO A LISTA RÁPIDA (TOP 20 A 50 SIN FOTO OBLIGATORIA) */}
      {showAddQuickModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-[#e5e2e1] relative">
            
            <button
              onClick={() => setShowAddQuickModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="bg-[#0056d2] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                CAPTURA EXPRESS • SIN FOTOS
              </span>
              <h3 className="text-xl font-black text-[#1c1b1b]">Agregar Producto a Lista Rápida</h3>
              <p className="text-xs font-semibold text-[#737785]">Agrega tus 20 a 50 productos más vendidos en segundos</p>
            </div>

            <form onSubmit={handleAddQuickProduct} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1c1b1b]">Nombre del Producto / Servicio</label>
                <input
                  type="text"
                  value={newQuickName}
                  onChange={e => setNewQuickName(e.target.value)}
                  placeholder="Ej. Torta Cubana / Paracetamol 500mg / Tornillo 1/2"
                  required
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Precio ($ MXN)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={newQuickPrice}
                    onChange={e => setNewQuickPrice(e.target.value)}
                    placeholder="Ej. 85.00"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Unidad (pza, kg, orden...)</label>
                  <input
                    type="text"
                    value={newQuickUnit}
                    onChange={e => setNewQuickUnit(e.target.value)}
                    placeholder="Ej. pza / orden / frasco"
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1c1b1b]">Categoría / Sección</label>
                <input
                  type="text"
                  value={newQuickCategory}
                  onChange={e => setNewQuickCategory(e.target.value)}
                  placeholder="Ej. Especialidades, Bebidas, Tornillería, Medicinas..."
                  className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3.5 rounded-full font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>GUARDAR EN LISTA RÁPIDA ⚡</span>
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}
