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

const MAP_STYLE_BRIGHT = 'https://tiles.openfreemap.org/styles/bright'
const MAP_STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

export default function VamoMapLibre({
  center = [20.5218, -100.8142],
  zoom = 15.5,
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

  // 1. Inicialización del Mapa Vectorial OpenFreeMap
  useEffect(() => {
    if (!mapContainer.current) return

    // Limpiar marcadores anteriores antes de destruir el mapa
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
    const styleUrl = theme === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_BRIGHT

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [center[1], center[0]] as [number, number],
      zoom,
      pitch: is3D ? 55 : 0,
      bearing,
      attributionControl: false
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')

    // Control de Geolocalización GPS Nativo (Celular, Tableta, PC)
    if (enableGeolocate !== false) {
      const geolocateControl = new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
          timeout: 6000
        },
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

    map.on('load', () => {
      console.log('✨ [VAMO MAP 3D] Mapa Vectorial OpenFreeMap cargado al 100%')
      map.resize()
      setTimeout(() => {
        try { map.resize() } catch (e) {}
      }, 250)

      // Capa de Edificios 3D (fill-extrusion)
      try {
        if (map.getSource('openmaptiles') && !map.getLayer('3d-buildings')) {
          map.addLayer({
            id: '3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 14,
            layout: {
              visibility: is3D ? 'visible' : 'none'
            },
            paint: {
              'fill-extrusion-color': theme === 'dark' ? '#1e293b' : '#cbd5e1',
              'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.05, ['get', 'render_height']],
              'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.05, ['get', 'render_min_height']],
              'fill-extrusion-opacity': 0.85
            }
          })
        }
      } catch (e) {}

      createRouteSourceAndLayers(map)
      pushRouteData(map)

      setIsMapLoaded(true)
    })

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove()
        } catch (e) {}
        mapRef.current = null
      }
    }
  }, [theme])

  // Crear Source y Layers de Ruta
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
      paint: { 'line-color': '#ffffff', 'line-width': 14, 'line-opacity': 0.95 }
    })

    map.addLayer({
      id: 'nav-route-line',
      type: 'line',
      source: 'nav-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0056D2', 'line-width': 8, 'line-opacity': 1.0 }
    })

    routeLayerCreatedRef.current = true
  }, [])

  // Actualizar GeoJSON
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

  // 2. Reactividad a Cambios en Coordenadas de Ruta
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
        padding: { top: 100, bottom: 140, left: 60, right: 60 },
        maxZoom: 16.5,
        duration: 800
      })
    }
  }, [routeCoordinates, isMapLoaded])

  // 3. Conmutador 2D / 3D
  const toggle3DMode = () => {
    const nextMode = !is3D
    setIs3D(nextMode)
    if (onToggle3D) onToggle3D(nextMode)

    if (mapRef.current) {
      const map = mapRef.current
      map.easeTo({
        pitch: nextMode ? 55 : 0,
        duration: 800
      })

      if (map.getLayer('3d-buildings')) {
        map.setLayoutProperty('3d-buildings', 'visibility', nextMode ? 'visible' : 'none')
      }
    }
  }

  // 4. MARCADOR ULTRA-MODERNO: FLECHA DE NAVEGACIÓN 3D TIPO WAZE/GOOGLE MAPS
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
        const el = markersRef.current[driver.id].getElement()
        const arrow = el.querySelector('.driver-heading-arrow') as HTMLElement | null
        if (arrow) {
          arrow.style.transform = `rotate(${rotation}deg)`
        }
      } else {
        const glowColor = driver.status === 'DISPONIBLE' ? '#c3f400' : '#0056D2'

        // 1. Elemento HTML con tamaño cero para anclaje matemático absoluto (0, 0)
        const dotEl = document.createElement('div')
        dotEl.style.cssText = 'width: 0px; height: 0px; position: relative; cursor: pointer;'
        dotEl.innerHTML = `
          <!-- Flecha de Dirección / Heading (Gira con la moto) -->
          <div class="driver-heading-arrow" style="
            position: absolute;
            top: -15px;
            left: -15px;
            width: 30px;
            height: 30px;
            transform: rotate(${rotation}deg);
            transition: transform 0.3s ease;
            pointer-events: none;
            display: flex;
            align-items: flex-start;
            justify-content: center;
          ">
            <div style="
              width: 0; 
              height: 0; 
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-bottom: 7px solid ${theme === 'dark' ? '#c3f400' : '#0040a1'};
              filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
            "></div>
          </div>

          <!-- Halo Pulsante -->
          <div style="
            position: absolute;
            top: -11px;
            left: -11px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: ${glowColor};
            opacity: 0.45;
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>

          <!-- Punto Central de Ubicación -->
          <div style="
            position: absolute;
            top: -7px;
            left: -7px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: ${glowColor};
            border: 2.5px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          "></div>

          <!-- Badge de Nombre del Conductor (SIEMPRE 100% HORIZONTAL Y DERECHO) -->
          <div style="
            position: absolute;
            bottom: 12px;
            left: 0;
            transform: translateX(-50%);
            white-space: nowrap;
            pointer-events: none;
            color: ${theme === 'dark' ? '#c3f400' : '#0040a1'};
            background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
            border: 1.5px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 86, 210, 0.25)'};
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            letter-spacing: -0.2px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.18);
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>🏍️</span>
            <span>${driver.name}</span>
          </div>
        `

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
          <div style="font-family:sans-serif;padding:4px">
            <strong style="color:#0056D2">${driver.name}</strong><br/>
            <span style="font-size:12px;color:#555">Estado: <b>${driver.status}</b></span>
          </div>
        `)

        // ANCLAJE EXACTO: El centro del punto geométrico es la coordenada GPS real (rotationAlignment: 'viewport' fija el texto derecho)
        const marker = new maplibregl.Marker({ element: dotEl, anchor: 'center', rotationAlignment: 'viewport' })
          .setLngLat(posLngLat)
          .setPopup(popup)
          .addTo(map)

        markersRef.current[driver.id] = marker
      }
    })
  }, [drivers, isMapLoaded, theme])

  // 5. Marcadores de Waypoints (Locales: Punto Minimalista Centrado + Texto Compacto con Halo Nítido)
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
            position: absolute;
            top: -7px;
            left: -7px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: ${dotColor};
            border: 2.5px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          "></div>
          <div style="
            position: absolute;
            bottom: 9px;
            left: 0;
            transform: translateX(-50%);
            white-space: nowrap;
            pointer-events: none;
            color: ${textColor};
            font-size: 11px;
            font-weight: 800;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            letter-spacing: -0.2px;
            text-shadow:
              -1.5px -1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
               0   -1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
               1.5px -1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
              -1.5px  0   0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
               1.5px  0   0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
              -1.5px  1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
               0    1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
               1.5px  1.5px 0 ${theme === 'dark' ? '#0f172a' : '#ffffff'},
               0 1.5px 4px rgba(0,0,0,0.4);
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

  // Recentrar en la posición actual
  const recenterOnDriver = () => {
    setIsUserInteracting(false)
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [center[1], center[0]],
        pitch: is3D ? 55 : 0,
        bearing, zoom,
        duration: 1000
      })
    }
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative z-0 ${className}`}
      style={{ minHeight: '100%', height: '100%', width: '100%' }}
    >
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '100%', height: '100%', width: '100%' }} />

      {/* Botón Flotante Conmutador 2D / 3D con Máximo Contraste VAMO */}
      <button
        onClick={toggle3DMode}
        className={`absolute top-24 right-2.5 z-20 px-3.5 py-2 rounded-xl font-black text-[11px] shadow-2xl flex items-center gap-2 border-2 active:scale-95 transition-all cursor-pointer pointer-events-auto ${
          is3D
            ? 'bg-[#0056D2] text-white border-white shadow-blue-500/30'
            : 'bg-white text-[#0056D2] border-[#0056D2] shadow-slate-400/30 dark:bg-slate-900 dark:text-[#c3f400] dark:border-[#c3f400]'
        }`}
        title="Alternar vista entre plano 2D y perspectiva 3D"
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

      {/* Botón Flotante para Recentrar */}
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
