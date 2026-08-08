'use client'

import React, { useState } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Search, SlidersHorizontal, Utensils, Pill, Wrench, Heart, Clock, Star, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function CustomerRadarPage() {
  const [selectedStore, setSelectedStore] = useState({
    id: 1,
    name: 'La Fonda Doña Rosa',
    category: 'Comida Local',
    time: '15-20 min',
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format&fit=crop'
  })

  return (
    <CustomerLayout>
      <div className="relative w-full h-[80vh] md:h-[85vh] rounded-[32px] overflow-hidden border border-[#e5e2e1] shadow-xl flex flex-col">
        
        {/* Fondo de Mapa Urbano Ilustrado 1:1 de Stitch */}
        <div 
          className="absolute inset-0 bg-cover bg-center w-full h-full z-0 opacity-90" 
          style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBWHhEVZJ_J3JrqkOo5Drb7Gcg79xFoAEZvmieCn7x4vM_lhSmAANxVuCntjQvFqJ_cE_ZSmjcwF2ZtMRCgnX-8cJbxRr_erV3aVr4rERvo_yqvXFat1Fy5PFPufnMkE2r_hDIhIQbDiRSv0CmfmV34bEdRbWnApdY_-2_7z-G444M-7o2nJckA1F5GXsdJe4AUqWDzJSr-SVzSFyntImVHJdAEUamWsiI0Ym7x6T6leD74hTK77nn4')` }}
        />

        {/* Buscador Superior y Filtros Flotantes */}
        <div className="absolute top-0 inset-x-0 z-20 pt-6 px-4 md:px-8 flex flex-col gap-3 bg-gradient-to-b from-[#fcf9f8]/90 via-[#fcf9f8]/50 to-transparent pb-8">
          
          <div className="w-full bg-white rounded-full h-14 flex items-center px-5 shadow-lg border border-[#e5e2e1] max-w-xl mx-auto">
            <Search className="w-5 h-5 text-[#737785] mr-3" />
            <input 
              type="text" 
              placeholder="¿Qué se te antoja hoy?"
              className="w-full bg-transparent text-sm font-extrabold outline-none text-[#1c1b1b]"
            />
            <button className="w-10 h-10 bg-[#0056d2] text-white rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all ml-2 flex-shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Chips de Categorías */}
          <div className="w-full overflow-x-auto hide-scrollbar flex gap-2 justify-start md:justify-center max-w-xl mx-auto">
            <button className="h-11 px-5 rounded-full bg-[#fddf33] text-[#726200] flex items-center gap-2 font-extrabold text-xs shadow-sm hover:opacity-90 transition-all flex-shrink-0">
              <Utensils className="w-4 h-4" /> Comida
            </button>
            <button className="h-11 px-5 rounded-full bg-white text-[#424654] flex items-center gap-2 font-extrabold text-xs shadow-sm hover:bg-[#f6f3f2] transition-all flex-shrink-0 border border-[#e5e2e1]">
              <Pill className="w-4 h-4 text-[#0056d2]" /> Farmacia
            </button>
            <button className="h-11 px-5 rounded-full bg-white text-[#424654] flex items-center gap-2 font-extrabold text-xs shadow-sm hover:bg-[#f6f3f2] transition-all flex-shrink-0 border border-[#e5e2e1]">
              <Wrench className="w-4 h-4 text-[#726200]" /> Refacciones
            </button>
          </div>

        </div>

        {/* Pines / Marcadores de Ubicación Flotantes sobre el Mapa */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          
          {/* Pin 1: La Fonda (Seleccionado Animado) */}
          <div 
            onClick={() => setSelectedStore({ id: 1, name: 'La Fonda Doña Rosa', category: 'Comida Local', time: '15-20 min', rating: '4.8 ★', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format&fit=crop' })}
            className="absolute top-[42%] left-[45%] md:left-[48%] pointer-events-auto transform -translate-x-1/2 cursor-pointer group"
          >
            <div className="w-14 h-14 bg-[#0056d2] text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white relative z-10 animate-bounce">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="w-4 h-4 bg-[#0056d2] transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 z-0 rounded-sm" />
          </div>

          {/* Pin 2: Farmacia */}
          <div 
            onClick={() => setSelectedStore({ id: 2, name: 'Farmacia del Pueblo', category: 'Salud', time: '10-15 min', rating: '4.9 ★', image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=500&auto=format&fit=crop' })}
            className="absolute top-[30%] left-[25%] pointer-events-auto transform hover:scale-110 transition-transform cursor-pointer"
          >
            <div className="w-12 h-12 bg-white text-[#0056d2] rounded-full shadow-lg flex items-center justify-center border-2 border-[#0056d2] relative z-10">
              <Pill className="w-5 h-5" />
            </div>
          </div>

          {/* Pin 3: Tacos */}
          <div 
            onClick={() => setSelectedStore({ id: 3, name: 'Taquería El Pastor', category: 'Tacos', time: '12-18 min', rating: '5.0 ★', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format&fit=crop' })}
            className="absolute top-[60%] left-[70%] pointer-events-auto transform hover:scale-110 transition-transform cursor-pointer"
          >
            <div className="w-12 h-12 bg-white text-[#726200] rounded-full shadow-lg flex items-center justify-center border-2 border-[#fddf33] relative z-10">
              <Utensils className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Tarjeta Flotante Inferior de Comercio Seleccionado (1:1 Stitch) */}
        <div className="absolute bottom-6 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-30 w-full max-w-md">
          <div className="bg-white rounded-[32px] p-5 shadow-2xl border border-[#e5e2e1] flex flex-col gap-4">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#e5e2e1] bg-[#f0eded]">
                <img src={selectedStore.image} alt={selectedStore.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 flex flex-col">
                <h3 className="text-base font-extrabold text-[#1c1b1b] leading-tight mb-1">{selectedStore.name}</h3>
                
                <div className="flex items-center gap-2 text-xs font-bold text-[#737785]">
                  <span className="flex items-center gap-1 text-[#0056d2]">
                    <Clock className="w-3.5 h-3.5" /> {selectedStore.time}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 text-[#726200]">
                    <Star className="w-3.5 h-3.5 text-[#fddf33] fill-[#fddf33]" /> {selectedStore.rating}
                  </span>
                </div>

                <span className="bg-[#f0eded] text-[#424654] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase w-fit mt-1.5">
                  {selectedStore.category}
                </span>
              </div>

              <button className="w-10 h-10 rounded-full bg-[#f6f3f2] hover:bg-[#e5e2e1] flex items-center justify-center text-[#1c1b1b] flex-shrink-0">
                <Heart className="w-5 h-5 text-[#ba1a1a]" />
              </button>
            </div>

            <Link 
              href={`/customer/store/${selectedStore.id}`}
              className="w-full h-13 bg-[#0040a1] hover:bg-[#0056d2] text-white rounded-full font-black text-sm flex items-center justify-center shadow-md active:scale-95 transition-all py-3.5"
            >
              Ver Menú &amp; Productos
            </Link>

          </div>
        </div>

      </div>
    </CustomerLayout>
  )
}
