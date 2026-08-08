'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

interface DriverLocation {
  id: string
  name: string
  lat: number
  lng: number
  status: 'DISPONIBLE' | 'EN_SERVICIO' | 'PAUSA' | 'OFFLINE'
}

interface VamoMapProps {
  center?: [number, number]
  zoom?: number
  drivers?: DriverLocation[]
}

export default function VamoMap({
  center = [20.5218, -100.8142], // Coordenadas Celaya / Guanajuato por defecto
  zoom = 13,
  drivers = []
}: VamoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    // Inicializar mapa de Leaflet
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false
    })

    // Añadir capa OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | VAMO GIS'
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    leafletMap.current = map

    return () => {
      map.remove()
      leafletMap.current = null
    }
  }, [center, zoom])

  // Actualizar marcadores de motociclistas
  useEffect(() => {
    if (!leafletMap.current) return

    // Limpiar marcadores antiguos no presentes
    Object.keys(markersRef.current).forEach(id => {
      if (!drivers.find(d => d.id === id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    drivers.forEach(driver => {
      const color = driver.status === 'DISPONIBLE' ? '#10B981' : driver.status === 'EN_SERVICIO' ? '#3B82F6' : '#6B7280'
      
      const customIcon = L.divIcon({
        className: 'custom-driver-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 11px;
          ">
            🏍️
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })

      if (markersRef.current[driver.id]) {
        markersRef.current[driver.id].setLatLng([driver.lat, driver.lng])
      } else {
        const marker = L.marker([driver.lat, driver.lng], { icon: customIcon })
          .addTo(leafletMap.current!)
          .bindPopup(`<strong>${driver.name}</strong><br/>Estado: ${driver.status}`)
        
        markersRef.current[driver.id] = marker
      }
    })
  }, [drivers])

  return (
    <div className="w-full h-full min-h-[350px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner relative z-0">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
