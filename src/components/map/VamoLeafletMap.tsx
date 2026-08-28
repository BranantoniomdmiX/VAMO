'use client'

import React, { useEffect, useRef } from 'react'
import type L from 'leaflet'
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

interface VamoLeafletMapProps {
  center?: LatLng
  zoom?: number
  theme?: 'light' | 'dark'
  drivers?: DriverMarkerData[]
  waypoints?: MapWaypoint[]
  routeCoordinates?: LngLat[]
  className?: string
  enableGeolocate?: boolean
  onMapClick?: (coords: { lat: number; lng: number }) => void
}

export default function VamoLeafletMap({
  center = [20.5218, -100.8142],
  zoom = 15,
  theme = 'light',
  drivers = [],
  waypoints = [],
  routeCoordinates = [],
  className = 'w-full h-full min-h-[450px]',
  enableGeolocate = true,
  onMapClick
}: VamoLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const driversLayerRef = useRef<L.LayerGroup | null>(null)
  const waypointsLayerRef = useRef<L.LayerGroup | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)
  const routeCasingRef = useRef<L.Polyline | null>(null)

  // 1. Inicialización de Leaflet (100% libre de WebGL y compatible con todos los iPhones y Androids)
  useEffect(() => {
    let isMounted = true
    let leafletInstance: typeof import('leaflet') | null = null

    async function initLeaflet() {
      if (!containerRef.current || mapRef.current) return

      const L = await import('leaflet')
      leafletInstance = L
      if (!isMounted || !containerRef.current) return

      // Detección de pantalla Retina (iPhones / iPads / Pantallas AMOLED)
      const isRetina = typeof window !== 'undefined' && window.devicePixelRatio > 1.4

      const map = L.map(containerRef.current, {
        center: [center[0], center[1]],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        markerZoomAnimation: true
      })

      // Controles de zoom
      L.control.zoom({ position: 'topright' }).addTo(map)

      // Capa de mosaicos OpenStreetMap 100% Limpia, Sin Marcas de Agua y en Español
      const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

      const tiles = L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap Contributors'
      }).addTo(map)

      // Fallback a OpenStreetMap si Carto tiene problemas
      tiles.on('tileerror', () => {
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map)
      })

      // Capas de marcadores
      const driversGroup = L.layerGroup().addTo(map)
      const waypointsGroup = L.layerGroup().addTo(map)
      driversLayerRef.current = driversGroup
      waypointsLayerRef.current = waypointsGroup

      // Evento de clic en el mapa
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
        }
      })

      mapRef.current = map

      // Resize watchdog para asegurar que en celulares el mapa tome el 100% de alto
      setTimeout(() => { map.invalidateSize() }, 100)
      setTimeout(() => { map.invalidateSize() }, 500)
    }

    initLeaflet()

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [theme])

  // 2. Actualizar Centro y Zoom
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setView([center[0], center[1]], zoom, { animate: true })
  }, [center[0], center[1], zoom])

  // 3. Renderizar Choferes (Marcador interactivo con rumbo e indicador de señal)
  useEffect(() => {
    if (!mapRef.current || !driversLayerRef.current) return
    const group = driversLayerRef.current
    group.clearLayers()

    import('leaflet').then((L) => {
      drivers.forEach(d => {
        const rotation = d.heading || 0
        const glowColor = d.status === 'DISPONIBLE' ? '#c3f400' : '#0056D2'

        const iconHtml = `
          <div style="width:0; height:0; position:relative; cursor:pointer;">
            <!-- Flecha de Rumbo -->
            <div style="
              position: absolute;
              top: -15px; left: -15px;
              width: 30px; height: 30px;
              transform: rotate(${rotation}deg);
              transition: transform 0.3s ease;
              pointer-events: none;
              display: flex; align-items: flex-start; justify-content: center;
            ">
              <div style="
                width: 0; height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-bottom: 7px solid ${theme === 'dark' ? '#c3f400' : '#0040a1'};
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
              "></div>
            </div>

            <!-- Halo Pulsante -->
            <div style="
              position: absolute;
              top: -11px; left: -11px;
              width: 22px; height: 22px;
              border-radius: 50%;
              background: ${glowColor};
              opacity: 0.45;
              animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;
            "></div>

            <!-- Punto Central -->
            <div style="
              position: absolute;
              top: -7px; left: -7px;
              width: 14px; height: 14px;
              border-radius: 50%;
              background: ${glowColor};
              border: 2.5px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            "></div>

            <!-- Nombre -->
            <div style="
              position: absolute;
              bottom: 12px; left: 0;
              transform: translateX(-50%);
              white-space: nowrap;
              pointer-events: none;
              color: ${theme === 'dark' ? '#c3f400' : '#0040a1'};
              background: ${theme === 'dark' ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)'};
              border: 1.5px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,86,210,0.25)'};
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 800;
              font-family: system-ui, -apple-system, sans-serif;
              box-shadow: 0 2px 8px rgba(0,0,0,0.18);
              display: flex; align-items: center; gap: 4px;
            ">
              <span>🏍️</span>
              <span>${d.name}</span>
            </div>
          </div>
        `

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'driver-leaflet-marker',
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        })

        const marker = L.marker([d.lat, d.lng], { icon: customIcon })
        marker.bindPopup(`
          <div style="font-family:sans-serif;padding:4px">
            <strong style="color:#0056D2">${d.name}</strong><br/>
            <span style="font-size:12px;color:#555">Estado: <b>${d.status}</b></span>
          </div>
        `)
        group.addLayer(marker)
      })
    })
  }, [drivers, theme])

  // 4. Renderizar Waypoints (Comercios y Destinos)
  useEffect(() => {
    if (!mapRef.current || !waypointsLayerRef.current) return
    const group = waypointsLayerRef.current
    group.clearLayers()

    import('leaflet').then((L) => {
      waypoints.forEach(wp => {
        const isOrigin = wp.type === 'ORIGIN'
        const textColor = isOrigin ? (theme === 'dark' ? '#ffffff' : '#0040A1') : '#ba1a1a'
        const dotColor = isOrigin ? '#0056D2' : '#ba1a1a'

        const wpIconHtml = `
          <div style="width:0; height:0; position:relative; cursor:pointer;">
            <div style="
              position: absolute;
              top: -7px; left: -7px;
              width: 14px; height: 14px;
              border-radius: 50%;
              background: ${dotColor};
              border: 2.5px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            "></div>
            <div style="
              position: absolute;
              bottom: 9px; left: 0;
              transform: translateX(-50%);
              white-space: nowrap;
              pointer-events: none;
              color: ${textColor};
              font-size: 11px;
              font-weight: 800;
              font-family: system-ui, -apple-system, sans-serif;
              text-shadow:
                -1.5px -1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
                 1.5px -1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
                -1.5px  1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
                 1.5px  1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'};
            ">
              ${isOrigin ? '🏪' : '📍'} ${wp.title}
            </div>
          </div>
        `

        const customIcon = L.divIcon({
          html: wpIconHtml,
          className: 'wp-leaflet-marker',
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        })

        const marker = L.marker([wp.lat, wp.lng], { icon: customIcon })
        group.addLayer(marker)
      })
    })
  }, [waypoints, theme])

  // 5. Renderizar Ruta (Polylines)
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
    if (routeCasingRef.current) {
      map.removeLayer(routeCasingRef.current)
      routeCasingRef.current = null
    }

    if (!routeCoordinates || routeCoordinates.length < 2) return

    import('leaflet').then((L) => {
      // Coordenadas Leaflet son [lat, lng] (LngLat de MapLibre es [lng, lat])
      const latLngs: [number, number][] = routeCoordinates.map(c => [c[1], c[0]])

      // Línea exterior blanca
      const casing = L.polyline(latLngs, {
        color: '#ffffff',
        weight: 10,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map)

      // Línea central azul VAMO
      const line = L.polyline(latLngs, {
        color: '#0056D2',
        weight: 6,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map)

      routeCasingRef.current = casing
      routeLayerRef.current = line

      map.fitBounds(line.getBounds(), {
        padding: [60, 60],
        maxZoom: 16.5,
        animate: true
      })
    })
  }, [routeCoordinates])

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative z-0 ${className}`}
      style={{
        minHeight: '480px',
        height: '100%',
        width: '100%',
        position: 'relative',
        touchAction: 'pan-x pan-y',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '480px', height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </div>
  )
}
