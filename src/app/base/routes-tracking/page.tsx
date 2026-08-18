'use client'

import React, { useState } from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { Navigation, Bike, Route, MapPin, Clock, Eye, Radio } from 'lucide-react'
import VamoMapLibre, { DriverMarkerData, MapWaypoint } from '@/components/map/VamoMapLibre'
import { gpsSocketService } from '@/lib/services/gpsSocketService'

export default function BaseRoutesTrackingPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('MOTO-01')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [liveRoute, setLiveRoute] = useState<[number, number][]>([])

  const driversList = [
    { 
      id: 'MOTO-01', 
      name: 'Carlos M. (Yamaha YBR)', 
      orderId: '#V-9042', 
      status: 'EN_RUTA',
      origin: 'Taquería El Pastor Centro',
      destination: 'Av. Tecnológico #402',
      eta: '8 min',
      lat: 20.5260, 
      lng: -100.8090, 
      startLatLng: [20.5218, -100.8142] as [number, number],
      endLatLng: [20.5260, -100.8090] as [number, number]
    },
    { 
      id: 'MOTO-02', 
      name: 'Roberto M. (Italika FT150)', 
      orderId: '#V-9040', 
      status: 'RECOGIENDO',
      origin: 'Farmacia San Gabriel',
      destination: 'Calle 5 de Mayo #45',
      eta: '4 min',
      lat: 20.5218, 
      lng: -100.8142, 
      startLatLng: [20.5180, -100.8200] as [number, number],
      endLatLng: [20.5218, -100.8142] as [number, number]
    },
    { 
      id: 'MOTO-03', 
      name: 'Ana P. (Honda Cargo)', 
      orderId: 'DESOCUPADO', 
      status: 'DISPONIBLE',
      origin: 'Base Central',
      destination: 'Zona Centro',
      eta: 'En Base',
      lat: 20.5180, 
      lng: -100.8200, 
      startLatLng: [20.5180, -100.8200] as [number, number],
      endLatLng: [20.5180, -100.8200] as [number, number]
    }
  ]

  const activeDriver = driversList.find(d => d.id === selectedDriverId) || driversList[0]

  // Cargar automáticamente la ruta por CALLES REALES usando OSRM
  React.useEffect(() => {
    let isMounted = true
    async function loadRealStreetRoute() {
      if (activeDriver.status === 'DISPONIBLE') {
        setLiveRoute([])
        return
      }
      const details = await gpsSocketService.fetchRouteDetails(activeDriver.startLatLng, activeDriver.endLatLng)
      if (isMounted && details.coordinates && details.coordinates.length > 0) {
        setLiveRoute(details.coordinates)
      }
    }
    loadRealStreetRoute()
    return () => { isMounted = false }
  }, [selectedDriverId])

  const driverMarkers: DriverMarkerData[] = driversList.map(d => ({
    id: d.id,
    name: d.name,
    lat: d.lat,
    lng: d.lng,
    status: d.status === 'DISPONIBLE' ? 'DISPONIBLE' : 'EN_SERVICIO'
  }))

  const waypoints: MapWaypoint[] = liveRoute.length > 0 ? [
    { id: 'wp-1', title: activeDriver.origin, lat: activeDriver.startLatLng[0], lng: activeDriver.startLatLng[1], type: 'ORIGIN' },
    { id: 'wp-2', title: activeDriver.destination, lat: activeDriver.endLatLng[0], lng: activeDriver.endLatLng[1], type: 'DESTINATION' }
  ] : []

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="routes-tracking" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-xs">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0040a1]">Seguimiento de Rutas en Tiempo Real</h1>
            <p className="text-xs text-slate-500 font-semibold">Trazabilidad en vivo del recorrido de cada motociclista en mapa GPS</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="bg-[#f0eded] hover:bg-[#e5e2e1] text-[#1c1b1b] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
            >
              {theme === 'dark' ? '☀️ Mapa Claro' : '🌙 Mapa Oscuro'}
            </button>

            <span className="bg-[#161e00] text-[#c3f400] px-4 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5">
              <Radio className="w-4 h-4 animate-pulse" />
              Monitoreo GPS Activo
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* BARRA DE SELECCIÓN DE MOTOCICLISTA PARA SEGUIMIENTO DE RUTA */}
          <div className="bg-white p-4 rounded-[28px] border border-[#e5e2e1] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
              <Bike className="w-4 h-4 text-[#0056d2]" />
              Selecciona Motociclista para Seguir Ruta:
            </span>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {driversList.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDriverId(d.id)}
                  className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 active:scale-95 ${
                    selectedDriverId === d.id
                      ? 'bg-[#0056d2] text-white shadow-md'
                      : 'bg-[#f0eded] text-[#737785] hover:bg-[#e5e2e1]'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${d.status === 'DISPONIBLE' ? 'bg-[#c3f400]' : 'bg-[#fddf33]'}`} />
                  <span>{d.name.split(' ')[0]} {d.name.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TARJETA DE DETALLE DE LA RUTA EN CURSO */}
          <div className="bg-[#161e00] text-white p-6 rounded-[32px] border border-[#c3f400]/40 shadow-md grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] font-black text-[#c3f400] uppercase tracking-wider block">MOTOCICLISTA EN SEGUIMIENTO</span>
              <strong className="text-base font-extrabold text-white block">{activeDriver.name}</strong>
              <span className="text-xs font-bold text-slate-300">Orden {activeDriver.orderId}</span>
            </div>

            <div>
              <span className="text-[10px] font-black text-[#c3f400] uppercase tracking-wider block">PUNTO DE ORIGEN</span>
              <p className="text-xs font-extrabold text-white flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#c3f400]" /> {activeDriver.origin}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-black text-[#c3f400] uppercase tracking-wider block">DESTINO FINAL</span>
              <p className="text-xs font-extrabold text-white flex items-center gap-1 mt-0.5">
                <Navigation className="w-3.5 h-3.5 text-[#0056d2]" /> {activeDriver.destination}
              </p>
            </div>

            <div className="flex flex-col justify-center items-start md:items-end">
              <span className="text-[10px] font-black text-[#c3f400] uppercase tracking-wider block">TIEMPO ESTIMADO LLEGADA</span>
              <span className="bg-[#c3f400] text-[#161e00] text-xs font-mono font-black px-3 py-1 rounded-full mt-1">
                ⏱️ {activeDriver.eta}
              </span>
            </div>
          </div>

          {/* MAPA VECTORIAL CON POLILÍNEA DE LA RUTA SEGUIDA */}
          <div className="h-[480px] rounded-[32px] overflow-hidden relative shadow-md border-2 border-[#e5e2e1]">
            <VamoMapLibre
              center={[activeDriver.lat, activeDriver.lng]}
              zoom={13.5}
              theme={theme}
              mode3D={false}
              drivers={driverMarkers}
              waypoints={waypoints}
              routeCoordinates={liveRoute}
              className="w-full h-full"
            />
          </div>

        </main>
      </div>
    </div>
  )
}
