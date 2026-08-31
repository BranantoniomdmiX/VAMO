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

export interface HeatZoneItem {
  id: string
  lat: number
  lng: number
  radiusMeters: number
  intensity: number // 0.0 a 1.0
  name?: string
  bonusText?: string
  surgePercent?: string
}

interface VamoLeafletMapProps {
  center?: LatLng
  zoom?: number
  theme?: 'light' | 'dark'
  drivers?: DriverMarkerData[]
  waypoints?: MapWaypoint[]
  routeCoordinates?: LngLat[]
  heatZones?: HeatZoneItem[]
  className?: string
  enableGeolocate?: boolean
  onMapClick?: (coords: { lat: number; lng: number }) => void
}

// Función matemática para generar polígonos hexagonales tipo H3 / Meituan
function createHexagonCoordinates(centerLat: number, centerLng: number, radiusMeters: number): [number, number][] {
  const points: [number, number][] = []
  // Conversión aproximada de metros a grados de lat/lng
  const latOffset = (radiusMeters / 111320)
  const lngOffset = (radiusMeters / (111320 * Math.cos((centerLat * Math.PI) / 180)))

  for (let i = 0; i < 6; i++) {
    const angleRad = (60 * i - 30) * (Math.PI / 180)
    const ptLat = centerLat + latOffset * Math.sin(angleRad)
    const ptLng = centerLng + lngOffset * Math.cos(angleRad)
    points.push([ptLat, ptLng])
  }
  return points
}

export default function VamoLeafletMap({
  center = [20.5218, -100.8142],
  zoom = 15,
  theme = 'light',
  drivers = [],
  waypoints = [],
  routeCoordinates = [],
  heatZones = [],
  className = 'w-full h-full min-h-[450px]',
  enableGeolocate = true,
  onMapClick
}: VamoLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const driversLayerRef = useRef<L.LayerGroup | null>(null)
  const waypointsLayerRef = useRef<L.LayerGroup | null>(null)
  const heatLayerRef = useRef<L.LayerGroup | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)
  const routeCasingRef = useRef<L.Polyline | null>(null)

  // 1. Inicialización de Leaflet
  useEffect(() => {
    let isMounted = true

    async function initLeaflet() {
      if (!containerRef.current || mapRef.current) return

      const L = await import('leaflet')
      if (!isMounted || !containerRef.current) return

      const map = L.map(containerRef.current, {
        center: [center[0], center[1]],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        markerZoomAnimation: true
      })

      L.control.zoom({ position: 'topright' }).addTo(map)

      const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap Contributors'
      }).addTo(map)

      const heatGroup = L.layerGroup().addTo(map)
      const waypointsGroup = L.layerGroup().addTo(map)
      const driversGroup = L.layerGroup().addTo(map)

      heatLayerRef.current = heatGroup
      waypointsLayerRef.current = waypointsGroup
      driversLayerRef.current = driversGroup

      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
        }
      })

      mapRef.current = map

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

  const lastCenteredCoords = useRef<string>('')

  // 2. Actualizar Centro y Zoom sin rebote de cámara
  useEffect(() => {
    if (!mapRef.current) return
    const key = `${center[0].toFixed(4)}_${center[1].toFixed(4)}_${zoom}`
    if (lastCenteredCoords.current !== key) {
      lastCenteredCoords.current = key
      mapRef.current.setView([center[0], center[1]], zoom, { animate: true })
    }
  }, [center[0], center[1], zoom])

  // 3. Renderizar Celdas Hexagonales Panal H3 (Estilo Meituan / Didi / Uber Surge)
  useEffect(() => {
    if (!mapRef.current || !heatLayerRef.current) return
    const group = heatLayerRef.current
    group.clearLayers()

    if (!heatZones || heatZones.length === 0) return

    import('leaflet').then((L) => {
      heatZones.forEach((zone) => {
        const radius = zone.radiusMeters || 380
        const intensity = zone.intensity || 0.8

        // Paleta Oficial VAMO (Naranja Dinámico #FF5722 / Lima VAMO #C3F400 / Azul Primario #0040A1)
        // Núcleo Crítico: Naranja Alerta VAMO (#FF5722)
        // Demanda Media: Ámbar / Dorado Cálido (#FF9800)
        // Demanda Activa: Verde Lima VAMO (#C3F400)
        const fillColor = intensity > 0.75 ? '#FF5722' : intensity > 0.5 ? '#FF9800' : '#C3F400'
        const strokeColor = intensity > 0.75 ? '#E64A19' : intensity > 0.5 ? '#F57C00' : '#8CAE00'
        const fillOpacity = intensity > 0.75 ? 0.32 : intensity > 0.5 ? 0.26 : 0.22

        // Crear polígono hexagonal regular
        const hexCoords = createHexagonCoordinates(zone.lat, zone.lng, radius)

        const hexPolygon = L.polygon(hexCoords, {
          color: strokeColor,
          weight: 2.5,
          opacity: 0.90,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          dashArray: intensity > 0.75 ? undefined : '5, 5'
        })

        hexPolygon.on('click', () => {
          if (onMapClick) {
            onMapClick({ lat: zone.lat, lng: zone.lng })
          }
        })

        group.addLayer(hexPolygon)

        // Insignia Flotante Oficial VAMO en el centro del hexágono
        const badgeHtml = `
          <div style="
            position: absolute;
            transform: translate(-50%, -50%);
            cursor: pointer;
            text-align: center;
            pointer-events: auto;
          ">
            <div style="
              background: #0040A1;
              color: #ffffff;
              padding: 3.5px 10px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 900;
              font-family: system-ui, -apple-system, sans-serif;
              border: 2px solid ${fillColor};
              box-shadow: 0 4px 12px rgba(0, 64, 161, 0.4);
              display: inline-flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
            ">
              <span style="color:${fillColor}; font-size:12px;">⚡</span>
              <span style="color:#ffffff">${zone.bonusText || '+ Tarifa'}</span>
            </div>
          </div>
        `

        const customBadge = L.divIcon({
          html: badgeHtml,
          className: 'vamo-surge-badge',
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        })

        const badgeMarker = L.marker([zone.lat, zone.lng], { icon: customBadge })
        badgeMarker.on('click', () => {
          if (onMapClick) {
            onMapClick({ lat: zone.lat, lng: zone.lng })
          }
        })
        group.addLayer(badgeMarker)
      })
    })
  }, [heatZones])

  // 4. Renderizar Choferes
  useEffect(() => {
    if (!mapRef.current || !driversLayerRef.current) return
    const group = driversLayerRef.current
    group.clearLayers()

    import('leaflet').then((L) => {
      drivers.forEach(d => {
        const isOnline = d.status === 'DISPONIBLE' || d.status === 'EN_SERVICIO'
        const glowColor = d.status === 'DISPONIBLE' ? '#c3f400' : d.status === 'EN_SERVICIO' ? '#0056D2' : '#888888'

        const iconHtml = `
          <div style="width:0; height:0; position:relative; cursor:pointer;">
            <div style="
              position: absolute;
              top: -11px; left: -11px;
              width: 22px; height: 22px;
              border-radius: 50%;
              background: ${glowColor};
              opacity: 0.45;
              animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;
            "></div>

            <div style="
              position: absolute;
              top: -7px; left: -7px;
              width: 14px; height: 14px;
              border-radius: 50%;
              background: ${glowColor};
              border: 2.5px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            "></div>

            <div style="
              position: absolute;
              bottom: 12px; left: 0;
              transform: translateX(-50%);
              white-space: nowrap;
              pointer-events: none;
              color: #0040a1;
              background: rgba(255,255,255,0.95);
              border: 1.5px solid rgba(0,86,210,0.25);
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
        group.addLayer(marker)
      })
    })
  }, [drivers])

  // 5. Renderizar Waypoints
  useEffect(() => {
    if (!mapRef.current || !waypointsLayerRef.current) return
    const group = waypointsLayerRef.current
    group.clearLayers()

    import('leaflet').then((L) => {
      waypoints.forEach(wp => {
        const isOrigin = wp.type === 'ORIGIN'
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
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            "></div>

            <div style="
              position: absolute;
              bottom: 12px; left: 0;
              transform: translateX(-50%);
              white-space: nowrap;
              pointer-events: none;
              color: ${isOrigin ? '#0056D2' : '#ba1a1a'};
              background: #ffffff;
              border: 1.5px solid ${isOrigin ? 'rgba(0,86,210,0.3)' : 'rgba(186,26,26,0.3)'};
              padding: 3px 10px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 800;
              font-family: system-ui, -apple-system, sans-serif;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              display: flex; align-items: center; gap: 4px;
            ">
              <span>${isOrigin ? '🏪' : '📍'}</span>
              <span>${wp.title}</span>
            </div>
          </div>
        `

        const wpIcon = L.divIcon({
          html: wpIconHtml,
          className: 'wp-leaflet-marker',
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        })

        const marker = L.marker([wp.lat, wp.lng], { icon: wpIcon })
        group.addLayer(marker)
      })
    })
  }, [waypoints])

  // 6. Trazado de Ruta OSRM
  useEffect(() => {
    if (!mapRef.current) return

    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
    if (routeCasingRef.current) {
      mapRef.current.removeLayer(routeCasingRef.current)
      routeCasingRef.current = null
    }

    if (!routeCoordinates || routeCoordinates.length === 0) return

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      const latLngs: [number, number][] = routeCoordinates.map(c => [c[1], c[0]])

      const casing = L.polyline(latLngs, {
        color: '#002661',
        weight: 9,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapRef.current)

      const line = L.polyline(latLngs, {
        color: '#0056D2',
        weight: 5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapRef.current)

      routeCasingRef.current = casing
      routeLayerRef.current = line
    })
  }, [routeCoordinates])

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '100%', height: '100%' }} />

      {enableGeolocate && (
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && 'geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  if (mapRef.current) {
                    mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 16, { animate: true })
                  }
                },
                () => {
                  alert('GPS no disponible en este dispositivo.')
                }
              )
            }
          }}
          className="absolute bottom-4 right-4 z-40 bg-white hover:bg-slate-50 text-[#0056d2] p-2.5 rounded-full shadow-lg border border-slate-200 active:scale-95 transition-all cursor-pointer"
          title="Centrar en mi ubicación GPS"
        >
          🎯
        </button>
      )}
    </div>
  )
}
