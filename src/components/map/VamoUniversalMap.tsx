'use client'

import React, { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { LatLng, LngLat } from '@/lib/services/gpsSocketService'
import { UserPositionData, MapLoadState, MapHealthReport, VamoUniversalEngineState } from './mapCommonTypes'
import { checkWebGLSupport } from './mapUtils'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export interface DriverMarkerData {
  id: string
  name: string
  lat: number
  lng: number
  heading?: number
  speed?: number
  status: 'DISPONIBLE' | 'EN_SERVICIO' | 'PAUSA' | 'OFFLINE'
  privacyMode?: 'exact' | 'approximate' | 'hidden'
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
  onEngineChange?: (engine: VamoUniversalEngineState) => void
}

// Carga Dinámica de Leaflet (Fallback confiable y 2D ligero)
const VamoLeafletMapComponent = dynamic(
  () => import('./VamoLeafletMap'),
  { ssr: false, loading: () => <MapLoadingSkeleton /> }
)

// Carga Dinámica de MapLibre (Motor Vectorial 3D / Enhanced)
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
      <span className="text-xs font-black text-slate-500 tracking-wider uppercase">Cargando Cartografía VAMO...</span>
    </div>
  )
}

export default function VamoUniversalMap(props: VamoUniversalMapProps) {
  const { preferredRenderer = 'AUTO', mode3D = false, onStateChange, onEngineChange } = props

  // Selección inicial de motor mutable
  const [activeEngine, setActiveEngine] = useState<VamoUniversalEngineState>(() => {
    if (typeof window === 'undefined') return 'LEAFLET'
    const hasWebGL = checkWebGLSupport()

    if (preferredRenderer === 'MAPLIBRE') {
      return hasWebGL ? 'MAPLIBRE' : 'LEAFLET'
    }
    if (preferredRenderer === 'LEAFLET') {
      return 'LEAFLET'
    }
    // AUTO: MapLibre si se solicita 3D y WebGL está soportado; Leaflet por defecto para máxima estabilidad móvil
    return (mode3D && hasWebGL) ? 'MAPLIBRE' : 'LEAFLET'
  })

  // Control para garantizar que el failover sea ONE-WAY por sesión a menos que el usuario reintente explícitamente
  const [failoverOccurred, setFailoverOccurred] = useState(false)
  const [operationalError, setOperationalError] = useState<string | null>(null)

  // Notificar al consumidor si el motor cambia
  useEffect(() => {
    if (onEngineChange) {
      onEngineChange(activeEngine)
    }
  }, [activeEngine, onEngineChange])

  // Map Runtime Supervisor: Receptor de salud de MapLibre
  const handleMapLibreHealth = useCallback((report: MapHealthReport) => {
    if (report.state === 'MAPLIBRE_FAILED') {
      console.warn(`🚨 [VamoUniversalMap] MapLibre reportó fallo crítico (${report.failureCategory || 'FATAL'}). Ejecutando failover a Leaflet.`, report.message)
      if (!failoverOccurred) {
        setFailoverOccurred(true)
        setActiveEngine('LEAFLET')
        if (onStateChange) {
          onStateChange('MAP_INITIALIZING')
        }
      }
    } else if (report.state === 'MAPLIBRE_DEGRADED') {
      console.warn('⚠️ [VamoUniversalMap] MapLibre en estado degradado pero operativo.')
    } else if (report.state === 'MAPLIBRE_READY') {
      setOperationalError(null)
      if (onStateChange) {
        onStateChange('MAP_READY')
      }
    }
  }, [failoverOccurred, onStateChange])

  // Receptor de estado de Leaflet
  const handleLeafletState = useCallback((state: MapLoadState) => {
    if (onStateChange) {
      onStateChange(state)
    }
    if (state === 'TILE_ERROR' || state === 'RENDERER_ERROR') {
      console.warn('⚠️ [VamoUniversalMap] Leaflet reportó fallo de cartografía.')
    }
  }, [onStateChange])

  // Reintento manual controlado por el usuario
  const handleManualRetry = () => {
    setOperationalError(null)
    setFailoverOccurred(false)
    const hasWebGL = checkWebGLSupport()
    if (preferredRenderer === 'MAPLIBRE' || (mode3D && hasWebGL)) {
      setActiveEngine('MAPLIBRE')
    } else {
      setActiveEngine('LEAFLET')
    }
  }

  // 1. Rama MapLibre (Enhanced 3D) con Failover reactivo
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
        userPosition={props.userPosition}
        className={props.className}
        enableGeolocate={props.enableGeolocate}
        enableClustering={props.enableClustering}
        onToggle3D={props.onToggle3D}
        onMapClick={props.onMapClick}
        onHealthChange={handleMapLibreHealth}
      />
    )
  }

  // 2. Rama Leaflet (Fallback robusto y 2D ligero con paridad de contratos)
  if (activeEngine === 'LEAFLET') {
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
        onStateChange={handleLeafletState}
      />
    )
  }

  // 3. Fallback Operacional Textual (Si ambos motores fallasen de forma catastrófica)
  return (
    <div className={`w-full h-full min-h-[420px] bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4 border border-slate-800 ${props.className || ''}`}>
      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-black tracking-tight">No pudimos cargar la cartografía interactiva</h3>
        <p className="text-xs text-slate-400 font-medium">
          {operationalError || 'Los servicios de mapas no pudieron desplegarse en este dispositivo. Puedes reintentar o consultar la información operativa en texto.'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleManualRetry}
        className="px-4 py-2 rounded-full bg-[#0040A1] hover:bg-[#0056D2] text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Reintentar Mapa</span>
      </button>
    </div>
  )
}
