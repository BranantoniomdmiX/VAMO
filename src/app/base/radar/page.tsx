'use client'

import React, { useState, useEffect } from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { VamoPageHeader } from '@/components/ui/VamoPageHeader'
import { Bike, Battery, Navigation } from 'lucide-react'
import VamoUniversalMap, { DriverMarkerData } from '@/components/map/VamoUniversalMap'
import { gpsSocketService } from '@/lib/services/gpsSocketService'

export default function BaseRadarPage() {
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light')

  const [driversList, setDriversList] = useState([
    { id: 'MOTO-14', name: 'Carlos M. (Rider #14)', status: 'busy', statusLabel: 'En Viaje (#V-9042)', lat: 20.5260, lng: -100.8090, heading: 45, battery: '85%', speed: '32 km/h' },
    { id: 'MOTO-08', name: 'Roberto M. (Rider #08)', status: 'available', statusLabel: 'Disponible en Base', lat: 20.5218, lng: -100.8142, heading: 0, battery: '92%', speed: '0 km/h' },
    { id: 'MOTO-21', name: 'Ana P. (Rider #21)', status: 'busy', statusLabel: 'En Viaje (#V-9040)', lat: 20.5180, lng: -100.8200, heading: 180, battery: '64%', speed: '28 km/h' }
  ])

  useEffect(() => {
    const unsub = gpsSocketService.subscribeLivePositions((payload) => {
      setDriversList(prev => prev.map(d => {
        if (d.id === payload.driverId || d.name.includes(payload.driverId)) {
          return {
            ...d,
            lat: payload.lat,
            lng: payload.lng,
            heading: payload.heading,
            speed: `${payload.speed} km/h`
          }
        }
        return d
      }))
    })
    return () => unsub()
  }, [])

  const driverMarkers: DriverMarkerData[] = driversList.map(d => ({
    id: d.id,
    name: d.name,
    lat: d.lat,
    lng: d.lng,
    heading: d.heading,
    status: d.status === 'available' ? 'DISPONIBLE' : 'EN_SERVICIO'
  }))

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="radar" />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 md:px-8 pt-6 pb-2">
          <VamoPageHeader
            title="Radar Operativo en Tiempo Real"
            description="Monitor GPS vectorial con telemetría de batería y velocidad de choferes"
            badge={
              <span className="bg-[#c3f400] text-[#161e00] px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#161e00] animate-pulse" />
                12 Motos Conectadas
              </span>
            }
            secondaryActions={
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                <button
                  onClick={() => setMapTheme('light')}
                  aria-pressed={mapTheme === 'light'}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                    mapTheme === 'light' ? 'bg-[#0040a1] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ☀️ Día
                </button>
                <button
                  onClick={() => setMapTheme('dark')}
                  aria-pressed={mapTheme === 'dark'}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                    mapTheme === 'dark' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌙 Noche
                </button>
              </div>
            }
          />
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Mapa GPS Interactivo Universal (MapLibre + Leaflet Fail-Safe) */}
          <div className="h-[420px] rounded-[32px] overflow-hidden relative shadow-md border-2 border-[#e5e2e1]">
            <VamoUniversalMap
              center={[20.5218, -100.8142]}
              zoom={14}
              theme={mapTheme}
              mode3D={true}
              drivers={driverMarkers}
              className="w-full h-full"
            />
          </div>

          {/* Estado de Repartidores en Vivo */}
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#1c1b1b] flex items-center gap-2">
              <Bike className="w-5 h-5 text-[#0056d2]" />
              <span>Telemetría de la Flota en Campo</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {driversList.map(d => (
                <div key={d.id} className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-center">
                    <strong className="text-base font-extrabold text-[#1c1b1b]">{d.name}</strong>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      d.status === 'available' ? 'bg-[#c3f400] text-[#161e00]' : 'bg-[#0056d2] text-white'
                    }`}>
                      {d.statusLabel}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold text-[#737785] pt-2 border-t border-[#f0eded]">
                    <span className="flex items-center gap-1 font-bold text-[#1c1b1b]">
                      <Battery className="w-3.5 h-3.5 text-[#0056d2]" /> {d.battery}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#161e00] bg-[#c3f400]/20 px-2 py-0.5 rounded-full">
                      <Navigation className="w-3 h-3 text-[#161e00]" /> {d.speed}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
