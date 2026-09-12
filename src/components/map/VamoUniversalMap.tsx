'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { LatLng, LngLat } from '@/lib/services/gpsSocketService'
import { UserPositionData, MapLoadState } from './mapCommonTypes'
import { checkWebGLSupport } from './mapUtils'

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
  userPosition?: UserPositionData | null
  className?: string
  enableGeolocate?: boolean
  enableClustering?: boolean
  preferredRenderer?: 'AUTO' | 'MAPLIBRE' | 'LEAFLET'
  onToggle3D?: (is3D: boolean) => void
  onMapClick?: (coords: { lat: number; lng: number }) => void
  onStateChange?: (state: MapLoadState) => void
}

// Carga Dinámica de Leaflet (Fallback robusto y 2D ligero)
const VamoLeafletMapComponent = dynamic(
  () => import('./VamoLeafletMap'),
  { ssr: false, loading: () => <MapLoadingSkeleton /> }
)

// Carga Dinámica de MapLibre (Motor Vectorial 3D para dispositivos con WebGL)
const VamoMapLibreComponent = dynamic(
  () => import('./VamoMapLibre'),
  { ssr: false, loading: () => <MapLoadingSkeleton /> }
)

function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full min-h-[420px] bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-3 animate-pulse border border-slate-200 dark:border-slate-800">
      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
        🗺️
      </div>
      <span className="text-xs font-black text-slate-500 tracking-wider uppercase">Cargando Mapa VAMO...</span>
    </div>
  )
}

export default function VamoUniversalMap(props: VamoUniversalMapProps) {
  const { preferredRenderer = 'AUTO', mode3D = false, onStateChange } = props

  // Determinar el motor activo según capacidad real de hardware y preferencia
  const [activeEngine] = useState<'LEAFLET' | 'MAPLIBRE'>(() => {
    if (typeof window === 'undefined') return 'LEAFLET'
    const hasWebGL = checkWebGLSupport()

    if (preferredRenderer === 'MAPLIBRE') {
      return hasWebGL ? 'MAPLIBRE' : 'LEAFLET'
    }
    if (preferredRenderer === 'LEAFLET') {
      return 'LEAFLET'
    }
    // Modo AUTO
    return (mode3D && hasWebGL) ? 'MAPLIBRE' : 'LEAFLET'
  })

  if (activeEngine === 'MAPLIBRE') {
    return (
      <VamoMapLibreComponent
        center={props.center}
        zoom={props.zoom}
        theme={props.theme}
        mode3D={props.mode3D}
        pitch={props.pitch}
        bearing={props.bearing}
        drivers={props.drivers}
        waypoints={props.waypoints}
        routeCoordinates={props.routeCoordinates}
        className={props.className}
        enableGeolocate={props.enableGeolocate}
        enableClustering={props.enableClustering}
        onToggle3D={props.onToggle3D}
        onMapClick={props.onMapClick}
      />
    )
  }

  return (
    <VamoLeafletMapComponent
      center={props.center}
      zoom={props.zoom}
      theme={props.theme}
      drivers={props.drivers}
      waypoints={props.waypoints}
      routeCoordinates={props.routeCoordinates}
      heatZones={props.heatZones}
      userPosition={props.userPosition}
      className={props.className}
      enableGeolocate={props.enableGeolocate}
      enableClustering={props.enableClustering}
      onMapClick={props.onMapClick}
      onStateChange={onStateChange}
    />
  )
}
