'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Navigation, Box, Map as MapIcon } from 'lucide-react'
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

interface VamoMapLibreProps {
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

// Estilos Vectoriales Oficiales de Alta Disponibilidad CartoDB
const CARTO_GL_VOYAGER = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
const CARTO_GL_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const CARTO_GL_POSITRON = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

// Fallback de Emergencia con Mosaicos OpenStreetMap Raster
const OSM_RASTER_FALLBACK: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-raster-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors'
    }
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster-tiles',
      minzoom: 0,
      maxzoom: 19
    }
  ]
}

export default function VamoMapLibre({
  center = [20.5218, -100.8142],
  zoom = 15,
  theme = 'light',
  mode3D: initialMode3D = false,
  pitch = 0,
  bearing = 0,
  drivers = [],
  waypoints = [],
  routeCoordinates = [],
  className = 'w-full h-full min-h-[450px]',
  enableGeolocate = true,
  onToggle3D,
  onMapClick
}: VamoMapLibreProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({})
  const waypointsRef = useRef<{ [key: string]: maplibregl.Marker }>({})
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [is3D, setIs3D] = useState(initialMode3D)

  const routeCoordsRef = useRef<LngLat[]>(routeCoordinates)
  routeCoordsRef.current = routeCoordinates

  const routeLayerCreatedRef = useRef(false)

  // 1. Inicialización de MapLibre GL
  useEffect(() => {
    if (!mapContainer.current) return

    Object.values(markersRef.current).forEach(m => {
      try { m.remove() } catch (e) {}
    })
    Object.values(waypointsRef.current).forEach(w => {
      try { w.remove() } catch (e) {}
    })
    markersRef.current = {}
    waypointsRef.current = {}

    if (mapRef.current) {
      try {
        mapRef.current.remove()
      } catch (e) {}
      mapRef.current = null
    }

    setIsMapLoaded(false)
    routeLayerCreatedRef.current = false
    const styleUrl = theme === 'dark' ? CARTO_GL_DARK : CARTO_GL_VOYAGER

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [center[1], center[0]] as [number, number],
        zoom,
        pitch: is3D ? 55 : 0,
        bearing,
        attributionControl: false
      })
    } catch (err) {
      console.warn('⚠️ [VAMO Map] Error iniciando Carto GL, usando OSM Raster:', err)
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: OSM_RASTER_FALLBACK,
        center: [center[1], center[0]] as [number, number],
        zoom,
        pitch: 0,
        bearing,
        attributionControl: false
      })
    }

    // Watchdog Anti-Pantalla Blanca: Si tarda en cargar el estilo, aplicar OSM Raster
    let fallbackApplied = false
    const fallbackTimer = setTimeout(() => {
      if (!fallbackApplied && !map.isStyleLoaded()) {
        fallbackApplied = true
        try {
          map.setStyle(OSM_RASTER_FALLBACK)
        } catch (e) {}
      }
    }, 2000)

    map.on('error', (e) => {
      const msg = e.error?.message || ''
      if (!fallbackApplied && (msg.includes('style') || msg.includes('Failed to fetch') || msg.includes('404'))) {
        fallbackApplied = true
        try {
          map.setStyle(OSM_RASTER_FALLBACK)
        } catch (err) {}
      }
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')

    if (enableGeolocate !== false) {
      const geolocateControl = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true, timeout: 6000 },
        trackUserLocation: true,
        showUserLocation: true
      })
      map.addControl(geolocateControl, 'top-right')
    }

    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      }
    })

    map.on('dragstart', () => setIsUserInteracting(true))
    map.on('zoomstart', () => setIsUserInteracting(true))

    const handleLoadedMap = () => {
      clearTimeout(fallbackTimer)
      try { map.resize() } catch (e) {}
      setTimeout(() => { try { map.resize() } catch (e) {} }, 150)
      setTimeout(() => { try { map.resize() } catch (e) {} }, 500)
      createRouteSourceAndLayers(map)
      pushRouteData(map)
      setIsMapLoaded(true)
    }

    map.on('load', handleLoadedMap)
    map.on('style.load', () => {
      try { map.resize() } catch (e) {}
      createRouteSourceAndLayers(map)
      pushRouteData(map)
      setIsMapLoaded(true)
    })

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && mapContainer.current) {
      resizeObserver = new ResizeObserver(() => {
        try { map.resize() } catch (e) {}
      })
      resizeObserver.observe(mapContainer.current)
    }

    mapRef.current = map

    return () => {
      clearTimeout(fallbackTimer)
      if (resizeObserver) resizeObserver.disconnect()
      if (mapRef.current) {
        try { mapRef.current.remove() } catch (e) {}
        mapRef.current = null
      }
    }
  }, [theme])

  // 2. Rutas
  const createRouteSourceAndLayers = useCallback((map: maplibregl.Map) => {
    if (routeLayerCreatedRef.current) return
    if (map.getSource('nav-route')) return

    map.addSource('nav-route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    })

    map.addLayer({
      id: 'nav-route-casing',
      type: 'line',
      source: 'nav-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#ffffff', 'line-width': 12, 'line-opacity': 0.95 }
    })

    map.addLayer({
      id: 'nav-route-line',
      type: 'line',
      source: 'nav-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0056D2', 'line-width': 7, 'line-opacity': 1.0 }
    })

    routeLayerCreatedRef.current = true
  }, [])

  const pushRouteData = useCallback((map: maplibregl.Map) => {
    const coords = routeCoordsRef.current
    if (!coords || coords.length < 2) return

    const src = map.getSource('nav-route') as maplibregl.GeoJSONSource | undefined
    if (!src) return

    src.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords }
      }]
    })
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isMapLoaded) return
    if (!routeCoordinates || routeCoordinates.length < 2) return

    createRouteSourceAndLayers(map)
    pushRouteData(map)

    if (!isUserInteracting) {
      const bounds = new maplibregl.LngLatBounds()
      routeCoordinates.forEach(pt => bounds.extend(pt as [number, number]))
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 100, left: 50, right: 50 },
        maxZoom: 16.5,
        duration: 600
      })
    }
  }, [routeCoordinates, isMapLoaded])

  // 3. Conmutador 2D / 3D
  const toggle3DMode = () => {
    const nextMode = !is3D
    setIs3D(nextMode)
    if (onToggle3D) onToggle3D(nextMode)

    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: nextMode ? 55 : 0,
        duration: 800
      })
    }
  }

  // 4. Marcadores de Choferes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return
    const map = mapRef.current

    Object.keys(markersRef.current).forEach(id => {
      if (!drivers.find(d => d.id === id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    drivers.forEach(driver => {
      const rotation = driver.heading || 0
      const posLngLat: [number, number] = [driver.lng, driver.lat]

      if (markersRef.current[driver.id]) {
        markersRef.current[driver.id].setLngLat(posLngLat)
      } else {
        const glowColor = driver.status === 'DISPONIBLE' ? '#c3f400' : '#0056D2'

        const dotEl = document.createElement('div')
        dotEl.style.cssText = 'width: 0px; height: 0px; position: relative; cursor: pointer;'
        dotEl.innerHTML = `
          <div style="
            position: absolute; top: -11px; left: -11px;
            width: 22px; height: 22px; border-radius: 50%;
            background: ${glowColor}; opacity: 0.45;
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: absolute; top: -7px; left: -7px;
            width: 14px; height: 14px; border-radius: 50%;
            background: ${glowColor}; border: 2.5px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          "></div>
          <div style="
            position: absolute; bottom: 12px; left: 0;
            transform: translateX(-50%); white-space: nowrap; pointer-events: none;
            color: ${theme === 'dark' ? '#c3f400' : '#0040a1'};
            background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
            border: 1.5px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 86, 210, 0.25)'};
            padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800;
            box-shadow: 0 2px 8px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 4px;
          ">
            <span>🏍️</span><span>${driver.name}</span>
          </div>
        `

        const marker = new maplibregl.Marker({ element: dotEl, anchor: 'center', rotationAlignment: 'viewport' })
          .setLngLat(posLngLat)
          .addTo(map)

        markersRef.current[driver.id] = marker
      }
    })
  }, [drivers, isMapLoaded, theme])

  // 5. Marcadores de Waypoints
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return
    const map = mapRef.current

    Object.keys(waypointsRef.current).forEach(id => {
      if (!waypoints.find(w => w.id === id)) {
        waypointsRef.current[id].remove()
        delete waypointsRef.current[id]
      }
    })

    waypoints.forEach(wp => {
      const isOrigin = wp.type === 'ORIGIN'
      const textColor = isOrigin ? (theme === 'dark' ? '#ffffff' : '#0040A1') : '#ba1a1a'
      const dotColor = isOrigin ? '#0056D2' : '#ba1a1a'
      const posLngLat: [number, number] = [wp.lng, wp.lat]

      if (waypointsRef.current[wp.id]) {
        waypointsRef.current[wp.id].setLngLat(posLngLat)
      } else {
        const wpEl = document.createElement('div')
        wpEl.style.cssText = 'width: 0px; height: 0px; position: relative; cursor: pointer;'
        wpEl.innerHTML = `
          <div style="
            position: absolute; top: -7px; left: -7px;
            width: 14px; height: 14px; border-radius: 50%;
            background: ${dotColor}; border: 2.5px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          "></div>
          <div style="
            position: absolute; bottom: 9px; left: 0;
            transform: translateX(-50%); white-space: nowrap; pointer-events: none;
            color: ${textColor}; font-size: 11px; font-weight: 800;
            text-shadow: -1.5px -1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
                         1.5px -1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
                        -1.5px 1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
                         1.5px 1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'};
          ">
            ${isOrigin ? '🏪' : '📍'} ${wp.title}
          </div>
        `
        const marker = new maplibregl.Marker({ element: wpEl, anchor: 'center' })
          .setLngLat(posLngLat)
          .addTo(map)

        waypointsRef.current[wp.id] = marker
      }
    })
  }, [waypoints, isMapLoaded, theme])

  const recenterOnDriver = () => {
    setIsUserInteracting(false)
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [center[1], center[0]],
        pitch: is3D ? 55 : 0,
        bearing, zoom,
        duration: 800
      })
    }
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative z-0 ${className}`}
      style={{ minHeight: '480px', height: '100%', width: '100%', position: 'relative' }}
    >
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ minHeight: '480px', height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
      />

      {/* Botón Flotante 2D / 3D */}
      <button
        onClick={toggle3DMode}
        className={`absolute bottom-4 left-3 z-20 px-3.5 py-2 rounded-xl font-black text-[11px] shadow-2xl flex items-center gap-2 border-2 active:scale-95 transition-all cursor-pointer pointer-events-auto ${
          is3D
            ? 'bg-[#0056D2] text-white border-white'
            : 'bg-white text-[#0056D2] border-[#0056D2] dark:bg-slate-900 dark:text-[#c3f400] dark:border-[#c3f400]'
        }`}
      >
        {is3D ? (
          <>
            <Box className="w-4 h-4 text-[#c3f400] animate-pulse shrink-0" />
            <span className="font-black text-white tracking-wider">MODO 3D</span>
          </>
        ) : (
          <>
            <MapIcon className="w-4 h-4 text-[#0056D2] dark:text-[#c3f400] shrink-0" />
            <span className="font-black tracking-wider">MODO 2D</span>
          </>
        )}
      </button>

      {/* Recentrar */}
      {isUserInteracting && (
        <button
          onClick={recenterOnDriver}
          className="absolute bottom-6 right-4 z-20 bg-[#0056D2] hover:bg-[#0040a1] text-[#c3f400] px-4 py-2.5 rounded-full font-extrabold text-xs shadow-2xl flex items-center gap-2 border-2 border-white animate-bounce pointer-events-auto"
        >
          <Navigation className="w-4 h-4 text-[#c3f400] rotate-45" />
          <span className="text-white">Recentrar 🎯</span>
        </button>
      )}
    </div>
  )
}
