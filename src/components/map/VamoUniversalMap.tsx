'use client'

import React, { useState, useEffect } from 'react'
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
  className?: string
  enableGeolocate?: boolean
  onToggle3D?: (is3D: boolean) => void
  onMapClick?: (coords: { lat: number; lng: number }) => void
}

// Carga Dinámica Segura para Next.js App Router (Cero errores de SSR en servidor)
const VamoMapLibreComponent = dynamic(
  () => import('./VamoMapLibre'),
  { ssr: false, loading: () => <MapLoadingSkeleton /> }
)

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
  const [engine, setEngine] = useState<'maplibre' | 'leaflet'>('leaflet')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // 1. Diagnóstico de Hardware & GPU
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      
      // Si el dispositivo no tiene soporte WebGL o el canvas falla, activar Leaflet 2D inmediatamente
      if (!gl) {
        console.warn('🛡️ [VAMO Map Engine] WebGL no disponible en este dispositivo. Activando Leaflet 2D Fail-Safe.')
        setEngine('leaflet')
        return
      }

      // Detección de dispositivos con memoria baja (ej. Android Go / móviles de 1GB-2GB RAM)
      // @ts-ignore
      if (navigator.deviceMemory && navigator.deviceMemory < 2) {
        console.info('🛡️ [VAMO Map Engine] Dispositivo de memoria ligera detectado. Optimizando con Leaflet 2D.')
        setEngine('leaflet')
        return
      }

      // Escuchar eventos globales de pérdida de contexto WebGL
      const handleContextLost = (e: Event) => {
        console.warn('🛡️ [VAMO Map Watchdog] Contexto WebGL perdido por el sistema. Conmutando a Leaflet 2D en caliente.')
        e.preventDefault()
        setEngine('leaflet')
      }

      window.addEventListener('webglcontextlost', handleContextLost, true)
      return () => {
        window.removeEventListener('webglcontextlost', handleContextLost, true)
      }
    } catch (err) {
      console.warn('🛡️ [VAMO Map Engine] Excepción en diagnóstico WebGL, fallback a Leaflet:', err)
      setEngine('leaflet')
    }
  }, [])

  if (!isClient) {
    return <MapLoadingSkeleton />
  }

  // Renderizar MapLibre para 3D en dispositivos capaces, o Leaflet para máxima compatibilidad
  if (engine === 'leaflet') {
    return <VamoLeafletMapComponent {...props} />
  }

  return <VamoMapLibreComponent {...props} />
}
