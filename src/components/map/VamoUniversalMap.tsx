'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { LatLng, LngLat } from '@/lib/services/gpsSocketService'

export interface DriverMarkerData {
  id: string
  name: string
  lat: number
  lng: number
  heading?: number
  speed?: number
  status: 'DISPONIBLE' | 'EN_SERVICIO' | 'PAUSA' | 'OFFLINE'
}

export interface MapWaypoint {
  id: string
  title: string
  lat: number
  lng: number
  type: 'ORIGIN' | 'DESTINATION'
}

export interface HeatZoneItem {
  id: string
  lat: number
  lng: number
  radiusMeters: number
  intensity: number
  name?: string
  bonusText?: string
}

export interface VamoUniversalMapProps {
  center?: LatLng
  zoom?: number
  theme?: 'light' | 'dark'
  mode3D?: boolean
  pitch?: number
  bearing?: number
  drivers?: DriverMarkerData[]
  waypoints?: MapWaypoint[]
  routeCoordinates?: LngLat[]
  heatZones?: HeatZoneItem[]
  className?: string
  enableGeolocate?: boolean
  onToggle3D?: (is3D: boolean) => void
  onMapClick?: (coords: { lat: number; lng: number }) => void
}

// Carga Dinámica Segura de Leaflet en Cliente (100% de compatibilidad garantizada)
const VamoLeafletMapComponent = dynamic(
  () => import('./VamoLeafletMap'),
  { ssr: false, loading: () => <MapLoadingSkeleton /> }
)

function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full min-h-[480px] bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-3 animate-pulse border border-slate-200 dark:border-slate-800">
      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
        🗺️
      </div>
      <span className="text-xs font-black text-slate-500 tracking-wider uppercase">Cargando Mapa VAMO...</span>
    </div>
  )
}

export default function VamoUniversalMap(props: VamoUniversalMapProps) {
  return <VamoLeafletMapComponent {...props} />
}
