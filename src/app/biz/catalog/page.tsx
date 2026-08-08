'use client'

import React, { useState } from 'react'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { Plus, Edit, Sparkles, PackageCheck, AlertTriangle } from 'lucide-react'

export default function BizCatalogPage() {
  const [filter, setFilter] = useState<'all' | 'promos' | 'out_of_stock'>('all')

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

            <button className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-6 py-3 rounded-full text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#0056d2]/20 active:scale-95 transition-all">
              <Plus className="w-5 h-5" />
              <span>+ Nuevo Producto</span>
            </button>
          </div>

          {/* Filtros Tab */}
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            <button 
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                filter === 'all' ? 'bg-[#0056d2] text-white shadow-sm' : 'bg-white text-[#1c1b1b] border border-[#e5e2e1]'
              }`}
            >
              Todos los Productos
            </button>
            <button 
              onClick={() => setFilter('promos')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                filter === 'promos' ? 'bg-[#0056d2] text-white shadow-sm' : 'bg-white text-[#1c1b1b] border border-[#e5e2e1]'
              }`}
            >
              Promociones & Lealtad
            </button>
            <button 
              onClick={() => setFilter('out_of_stock')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                filter === 'out_of_stock' ? 'bg-[#0056d2] text-white shadow-sm' : 'bg-white text-[#1c1b1b] border border-[#e5e2e1]'
              }`}
            >
              Agotados
            </button>
          </div>

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
            <div className="bg-[#f0eded] rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center text-center hover:bg-[#e5e2e1] cursor-pointer transition-all duration-300 border-2 border-dashed border-[#0056d2]/30 min-h-[280px]">
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
    </div>
  )
}
