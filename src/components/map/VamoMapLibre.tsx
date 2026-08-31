'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Navigation, Box, Map as MapIcon, Moon, Sun } from 'lucide-react'
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

// Estilos Vectoriales 100% Libres y Nativos para MapLibre (OpenFreeMap Oficial)
const STYLE_3D_LIGHT = 'https://tiles.openfreemap.org/styles/liberty'
const STYLE_3D_DARK = 'https://tiles.openfreemap.org/styles/dark'

export default function VamoMapLibre({
  center = [20.5218, -100.8142],
  zoom = 15,
  theme: initialTheme = 'light',
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
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(initialTheme)

  const routeCoordsRef = useRef<LngLat[]>(routeCoordinates)
  routeCoordsRef.current = routeCoordinates
  const routeLayerCreatedRef = useRef(false)

  // Inyectar edificios 3D cuando el estilo vectorial OpenFreeMap esté listo
  const add3DBuildingsLayer = (map: maplibregl.Map) => {
    try {
      if (map.getLayer('3d-buildings')) return
      
      const layers = map.getStyle().layers || []
      let labelLayerId: string | undefined
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]
        if (layer.type === 'symbol' && layer.layout && 'text-field' in layer.layout) {
          labelLayerId = layer.id
          break
        }
      }

      // Añadir capa de extrusión 3D usando la fuente openmaptiles estándar
      map.addLayer({
        id: '3d-buildings',
        source: 'openmaptiles',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': currentTheme === 'dark' ? '#334155' : '#cbd5e1',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            14, 0,
            16, ['coalesce', ['get', 'render_height'], ['get', 'height'], 15]
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            14, 0,
            16, ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0]
          ],
          'fill-extrusion-opacity': 0.85
        }
      }, labelLayerId)
    } catch (err) {
      console.warn('⚠️ Capa 3D procesada:', err)
    }
  }

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

    const styleUrl = currentTheme === 'dark' ? STYLE_3D_DARK : STYLE_3D_LIGHT

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [center[1], center[0]] as [number, number],
      zoom,
      pitch: is3D ? 58 : 0,
      bearing: is3D ? -15 : 0,
      attributionControl: false
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
      try { map.resize() } catch (e) {}
      setTimeout(() => { try { map.resize() } catch (e) {} }, 150)
      setTimeout(() => { try { map.resize() } catch (e) {} }, 500)
      add3DBuildingsLayer(map)
      createRouteSourceAndLayers(map)
      pushRouteData(map)
      setIsMapLoaded(true)
    }

    map.on('load', handleLoadedMap)
    map.on('style.load', () => {
      try { map.resize() } catch (e) {}
      add3DBuildingsLayer(map)
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
      if (resizeObserver) resizeObserver.disconnect()
      if (mapRef.current) {
        try { mapRef.current.remove() } catch (e) {}
        mapRef.current = null
      }
    }
  }, [currentTheme])

  // 2. Conmutador 3D / 2D
  const toggle3DMode = () => {
    const nextMode = !is3D
    setIs3D(nextMode)
    if (onToggle3D) onToggle3D(nextMode)

    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: nextMode ? 58 : 0,
        bearing: nextMode ? -15 : 0,
        duration: 800
      })
      if (nextMode) {
        add3DBuildingsLayer(mapRef.current)
      }
    }
  }

  // 3. Conmutador de Tema (Claro / Gris Dark)
  const toggleTheme = () => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light'
    setCurrentTheme(nextTheme)
  }

  // 4. Manejo de Rutas
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

  // 5. Marcadores de Choferes
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
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          "></div>
          <div style="
            position: absolute; top: -20px; left: -20px;
            width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            transform: rotate(${rotation}deg);
            pointer-events: none;
          ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); transform: translateY(-7px);">
              <polygon points="12 2 19 21 12 17 5 21 12 2" fill="#0056D2" />
            </svg>
          </div>
          <div style="
            position: absolute; top: 12px; left: 0;
            transform: translateX(-50%); white-space: nowrap; pointer-events: none;
            background: rgba(15, 23, 42, 0.85); color: #c3f400; font-size: 10px; font-weight: 800;
            padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 1px solid rgba(195, 244, 0, 0.4);
          ">
            🛵 ${driver.name}
          </div>
        `
        const marker = new maplibregl.Marker({ element: dotEl, anchor: 'center' })
          .setLngLat(posLngLat)
          .addTo(map)

        markersRef.current[driver.id] = marker
      }
    })
  }, [drivers, isMapLoaded])

  // 6. Marcadores de Waypoints (Comercios / Destinos)
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
      const textColor = isOrigin ? '#0056D2' : '#ba1a1a'
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
            background: rgba(255, 255, 255, 0.95);
            padding: 2px 8px; border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            border: 1px solid rgba(0, 86, 210, 0.2);
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
  }, [waypoints, isMapLoaded])

  const recenterOnDriver = () => {
    setIsUserInteracting(false)
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [center[1], center[0]],
        pitch: is3D ? 58 : 0,
        bearing: is3D ? -15 : 0,
        zoom,
        duration: 800
      })
    }
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0 ${className}`}
      style={{ minHeight: '480px', height: '100%', width: '100%', position: 'relative' }}
    >
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ minHeight: '480px', height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
      />

      {/* Botones Flotantes 3D y Tema (Inferior Izquierda) */}
      <div className="absolute bottom-4 left-3 z-20 flex items-center gap-2 pointer-events-auto">
        
        {/* Botón 3D / 2D */}
        <button
          type="button"
          onClick={toggle3DMode}
          className={`px-3.5 py-2 rounded-xl font-black text-[11px] shadow-2xl flex items-center gap-1.5 border-2 active:scale-95 transition-all cursor-pointer ${
            is3D
              ? 'bg-[#0056D2] text-white border-white'
              : 'bg-white text-[#0056D2] border-[#0056D2]'
          }`}
        >
          {is3D ? (
            <>
              <Box className="w-3.5 h-3.5 text-[#c3f400] animate-pulse shrink-0" />
              <span className="tracking-wider">MODO 3D</span>
            </>
          ) : (
            <>
              <MapIcon className="w-3.5 h-3.5 text-[#0056D2] shrink-0" />
              <span className="tracking-wider">MODO 2D</span>
            </>
          )}
        </button>

        {/* Botón Tema Gris Oscuro / Claro */}
        <button
          type="button"
          onClick={toggleTheme}
          className="bg-white hover:bg-slate-50 text-slate-800 p-2 rounded-xl shadow-2xl border border-slate-200 active:scale-95 transition-all flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
        >
          {currentTheme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#0056D2]" />
              <span>Gris Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Botón Recentrar flotante */}
      {isUserInteracting && (
        <button
          type="button"
          onClick={recenterOnDriver}
          className="absolute bottom-6 right-4 z-20 bg-[#0056D2] hover:bg-[#0040a1] text-[#c3f400] px-4 py-2.5 rounded-full font-extrabold text-xs shadow-2xl flex items-center gap-2 border-2 border-white animate-bounce pointer-events-auto cursor-pointer"
        >
          <Navigation className="w-4 h-4 text-[#c3f400] rotate-45" />
          <span className="text-white">Recentrar 🎯</span>
        </button>
      )}
    </div>
  )
}
