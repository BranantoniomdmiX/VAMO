'use client'

import React, { useState, useEffect } from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import VamoMapLibre, { MapWaypoint } from '@/components/map/VamoMapLibre'
import { 
  Building2, 
  MapPin, 
  Bike, 
  Store, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  Layers, 
  ExternalLink,
  Navigation,
  Compass,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface PlazaLocation {
  id: string
  code: string
  name: string
  owner: string
  city: string
  address: string
  phone: string
  lat: number
  lng: number
  activeBikes: number
  activeMerchants: number
  status: 'ACTIVE' | 'PENDING' | 'EXPANDING'
}

// Coordenadas oficiales de referencia para ciudades clave
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'celaya': { lat: 20.5218, lng: -100.8142 },
  'queretaro': { lat: 20.5888, lng: -100.3899 },
  'irapuato': { lat: 20.6736, lng: -101.3563 },
  'leon': { lat: 21.1221, lng: -101.6826 },
  'san miguel de allende': { lat: 20.9144, lng: -100.7452 },
  'salamanca': { lat: 20.5724, lng: -101.1963 },
  'toluca': { lat: 19.2826, lng: -99.6557 },
  'cdmx': { lat: 19.4326, lng: -99.1332 },
  'guadalajara': { lat: 20.6597, lng: -103.3496 },
  'monterrey': { lat: 25.6866, lng: -100.3161 },
  'puebla': { lat: 19.0414, lng: -98.2063 }
}

function getCoordsForCity(cityName: string, idx: number): { lat: number; lng: number } {
  const clean = cityName.toLowerCase().trim()
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (clean.includes(key)) {
      // Pequeño desplazamiento si hay múltiples bases en la misma ciudad
      return {
        lat: coords.lat + (idx * 0.005),
        lng: coords.lng + (idx * 0.005)
      }
    }
  }
  // Coordenada centro de México por defecto (Querétaro/Bajío)
  return {
    lat: 20.5218 + (idx * 0.02),
    lng: -100.8142 + (idx * 0.02)
  }
}

export default function AdminMapPage() {
  const [plazas, setPlazas] = useState<PlazaLocation[]>([])
  const [selectedPlaza, setSelectedPlaza] = useState<PlazaLocation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5218, -100.8142])
  const [mapZoom, setMapZoom] = useState(6)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadPlazas() {
      setIsLoading(true)
      const list: PlazaLocation[] = []

      try {
        // 1. Consultar Plazas Reales en Supabase (public.franchises)
        const { data: dbFranchises, error: fError } = await supabase
          .from('franchises')
          .select(`
            id,
            name,
            slug,
            city_id,
            status,
            created_at,
            owner_id
          `)

        if (!fError && dbFranchises && dbFranchises.length > 0) {
          // Consultar conteos reales de choferes y comercios por franquicia
          for (let i = 0; i < dbFranchises.length; i++) {
            const f = dbFranchises[i]
            const coords = getCoordsForCity(f.name || 'Celaya', i)

            // Conteo real de choferes vinculados
            const { count: driverCount } = await supabase
              .from('drivers')
              .select('*', { count: 'exact', head: true })
              .eq('franchise_id', f.id)

            // Conteo real de comercios vinculados
            const { count: merchantCount } = await supabase
              .from('merchants')
              .select('*', { count: 'exact', head: true })
              .eq('franchise_id', f.id)

            list.push({
              id: f.id,
              code: f.slug?.toUpperCase() || `VAMO-${i + 1}`,
              name: f.name,
              owner: 'Socio Comercial Autorizado',
              city: f.name.replace(/Plaza|Flota/gi, '').trim() || 'Bajío',
              address: 'Base Operativa Registrada',
              phone: '4611234567',
              lat: coords.lat,
              lng: coords.lng,
              activeBikes: driverCount || 0,
              activeMerchants: merchantCount || 0,
              status: f.status === 'active' ? 'ACTIVE' : 'PENDING'
            })
          }
        }
      } catch (err) {
        console.warn('Error al consultar franchises en Supabase:', err)
      }

      // 2. Si hay solicitudes aprobadas o guardadas localmente, agregarlas
      try {
        const stored = localStorage.getItem('vamo_fleets')
        if (stored) {
          const parsed = JSON.parse(stored)
          parsed.forEach((f: any, idx: number) => {
            if (!list.some(item => item.code === f.code)) {
              const coords = getCoordsForCity(f.city || f.name || 'Celaya', list.length + idx)
              list.push({
                id: `plz-${f.id || idx}`,
                code: f.code || `VAMO-${idx + 1}`,
                name: f.name || `Plaza ${f.city}`,
                owner: f.owner || 'Socio Comercial',
                city: f.city || 'Territorio Bajío',
                address: f.address || f.baseAddress || `Base Operativa ${f.city || ''}`,
                phone: f.phone || '',
                lat: coords.lat,
                lng: coords.lng,
                activeBikes: Number(f.riders) || Number(f.estimatedBikes) || 0,
                activeMerchants: Number(f.merchants) || 0,
                status: 'ACTIVE'
              })
            }
          })
        }
      } catch (e) {}

      setPlazas(list)
      if (list.length > 0) {
        setSelectedPlaza(list[0])
        setMapCenter([list[0].lat, list[0].lng])
      }
      setIsLoading(false)
    }

    loadPlazas()
  }, [])

  // Waypoints para el Mapa MapLibre
  const mapWaypoints: MapWaypoint[] = plazas.map(p => ({
    id: p.id,
    title: p.name,
    lat: p.lat,
    lng: p.lng,
    type: 'ORIGIN'
  }))

  const handleSelectPlaza = (plaza: PlazaLocation) => {
    setSelectedPlaza(plaza)
    setMapCenter([plaza.lat, plaza.lng])
    setMapZoom(13)
  }

  const filteredPlazas = plazas.filter(p =>
    searchQuery === '' ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalBikes = plazas.reduce((acc, p) => acc + p.activeBikes, 0)
  const totalMerchants = plazas.reduce((acc, p) => acc + p.activeMerchants, 0)

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="map" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header Superior */}
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs shrink-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-[#1c1b1b]">Mapa Nacional de Socios Comerciales & Plazas</h1>
              <span className="bg-[#161e00] text-[#c3f400] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                {plazas.length} {plazas.length === 1 ? 'Plaza Activa' : 'Plazas Activas'}
              </span>
            </div>
            <p className="text-xs text-[#737785] font-semibold">
              Supervisión geoespacial de bases operativas, cobertura y flotillas en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/new-fleet"
              className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>+ Nueva Plaza</span>
            </Link>
          </div>
        </header>

        {/* Layout Dividido: Lista Lateral (4 Cols) + Mapa Interactivo (8 Cols) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Panel Izquierdo: Directorio de Plazas & Estadísticas (4 Cols) */}
          <div className="lg:col-span-4 bg-white border-r border-[#e5e2e1] flex flex-col h-full overflow-hidden">
            
            {/* Métricas Rápidas */}
            <div className="p-4 border-b border-[#e5e2e1] bg-[#fcf9f8] grid grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Flota Total</span>
                <span className="text-lg font-black text-[#0056d2] flex items-center gap-1">
                  <Bike className="w-4 h-4" /> {totalBikes} Motos
                </span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Comercios</span>
                <span className="text-lg font-black text-emerald-600 flex items-center gap-1">
                  <Store className="w-4 h-4" /> {totalMerchants} Locales
                </span>
              </div>
            </div>

            {/* Buscador de Plazas */}
            <div className="p-3 border-b border-[#e5e2e1]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por ciudad, plaza o socio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl text-xs font-medium focus:border-[#0056d2] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Lista de Plazas con Scroll */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredPlazas.length > 0 ? (
                filteredPlazas.map((plaza) => (
                  <div
                    key={plaza.id}
                    onClick={() => handleSelectPlaza(plaza)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedPlaza?.id === plaza.id
                        ? 'bg-blue-50/70 border-[#0056d2] shadow-sm'
                        : 'bg-white border-[#e5e2e1] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#0056d2] bg-blue-100/70 px-2 py-0.5 rounded-md">
                          {plaza.code}
                        </span>
                        <h3 className="text-sm font-black text-[#1c1b1b] mt-1">{plaza.name}</h3>
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{plaza.city}</span>
                        </p>
                      </div>

                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Activa
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-[#0056d2]" />
                        <strong>{plaza.activeBikes}</strong> motos
                      </span>
                      <span className="flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-emerald-600" />
                        <strong>{plaza.activeMerchants}</strong> locales
                      </span>
                      {plaza.phone ? (
                        <a
                          href={`https://wa.me/52${plaza.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#0056d2] hover:underline font-bold text-[11px] flex items-center gap-0.5"
                        >
                          <Phone className="w-3 h-3" /> Contactar
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Base Master</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No hay plazas dadas de alta aún.</p>
                  <p className="text-[11px] text-slate-400">
                    Da de alta tu primera plaza territorial con el botón superior "+ Nueva Plaza" o aprueba una solicitud desde la bandeja.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Panel Derecho: Mapa Interactivo MapLibre GL JS (8 Cols) */}
          <div className="lg:col-span-8 relative h-full bg-slate-100">
            
            {/* Mapa MapLibre */}
            <VamoMapLibre
              center={mapCenter}
              zoom={mapZoom}
              theme={theme}
              waypoints={mapWaypoints}
              className="w-full h-full"
            />

            {/* Tarjeta Flotante con Detalle de la Plaza Seleccionada */}
            {selectedPlaza && (
              <div className="absolute bottom-6 left-6 right-6 lg:right-auto lg:w-96 bg-white/95 backdrop-blur-md p-5 rounded-[28px] border border-[#e5e2e1] shadow-2xl space-y-3 z-20 animate-fadeIn">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-[#0056d2] bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
                      Plaza Seleccionada
                    </span>
                    <h3 className="text-base font-black text-[#1c1b1b] mt-1">{selectedPlaza.name}</h3>
                    <p className="text-xs font-bold text-slate-500">{selectedPlaza.city}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPlaza(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#fcf9f8] p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Titular:</span>
                    <span className="font-extrabold text-slate-800">{selectedPlaza.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Dirección Base:</span>
                    <span className="font-extrabold text-slate-800 truncate max-w-[200px]">{selectedPlaza.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Coordenadas GPS:</span>
                    <span className="font-mono text-[11px] text-[#0056d2] font-bold">
                      {selectedPlaza.lat.toFixed(4)}, {selectedPlaza.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`https://wa.me/52${selectedPlaza.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#161e00] hover:bg-black text-[#c3f400] py-2.5 rounded-xl font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" /> WhatsApp Base
                  </a>
                  <Link
                    href="/admin/control-tower"
                    className="bg-[#0056d2] hover:bg-[#0040a1] text-white py-2.5 rounded-xl font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <span>Radar SLA ⚡</span>
                  </Link>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}
