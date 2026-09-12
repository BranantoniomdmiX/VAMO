'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Navigation, Box, Map as MapIcon, Moon, Sun, AlertTriangle, RefreshCw, Zap, ShieldCheck, ExternalLink, Copy, Check } from 'lucide-react'
import { LatLng, LngLat } from '@/lib/services/gpsSocketService'
import { VamoButton } from '@/components/ui/VamoButton'

export { MARKER_DENSITY_THRESHOLD, checkWebGLSupport, buildSafeNavigationUrl } from './mapUtils'
import { MARKER_DENSITY_THRESHOLD, checkWebGLSupport, buildSafeNavigationUrl, WebGLState } from './mapUtils'
export { driversToGeoJSON, waypointsToGeoJSON, shouldActivateClustering, computeSpatialClusters } from './clusterUtils'
import { driversToGeoJSON, shouldActivateClustering } from './clusterUtils'

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

export type MapExperienceMode = 'ENHANCED' | 'LIGHTWEIGHT' | 'FALLBACK'

export type RouteStatus = 'idle' | 'loading' | 'success' | 'no_route' | 'timeout' | 'network_error' | 'invalid_coordinates'

export type GpsStatus = 
  | 'permission_unknown'
  | 'permission_granted'
  | 'permission_denied'
  | 'permission_timeout'
  | 'position_unavailable'
  | 'approximate'
  | 'active'
  | 'stale'

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
  routeStatus?: RouteStatus
  gpsStatus?: GpsStatus
  className?: string
  enableGeolocate?: boolean
  enableClustering?: boolean
  clusterMaxZoom?: number
  forcedLightweight?: boolean
  forceFallback?: boolean // Para pruebas y forzar vista sin WebGL
  onToggle3D?: (is3D: boolean) => void
  onToggleLightweight?: (isLightweight: boolean) => void
  onMapClick?: (coords: { lat: number; lng: number }) => void
  fallbackDetails?: {
    originTitle?: string
    destinationTitle?: string
    destinationLat?: number
    destinationLng?: number
    privacyMode?: 'exact' | 'approximate' | 'hidden'
    distanceKm?: string
    orderStatus?: string
  }
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
  routeStatus = 'idle',
  gpsStatus,
  className = 'w-full h-full min-h-[450px]',
  enableGeolocate = true,
  enableClustering,
  clusterMaxZoom = 15,
  forcedLightweight,
  forceFallback = false,
  onToggle3D,
  onToggleLightweight,
  onMapClick,
  fallbackDetails
}: VamoMapLibreProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({})
  const waypointsRef = useRef<{ [key: string]: maplibregl.Marker }>({})
  const clusterSourceCreatedRef = useRef(false)

  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [is3D, setIs3D] = useState(initialMode3D)
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(initialTheme)
  
  // Modos de experiencia y resiliencia WebGL
  const [experienceMode, setExperienceMode] = useState<MapExperienceMode>(forceFallback ? 'FALLBACK' : 'ENHANCED')
  const [webglState, setWebglState] = useState<WebGLState>(() => {
    if (forceFallback) return 'WEBGL_UNAVAILABLE'
    return checkWebGLSupport() ? 'WEBGL_AVAILABLE' : 'WEBGL_UNAVAILABLE'
  })
  const [webglError, setWebglError] = useState<string | null>(() => {
    if (forceFallback) return 'Modo de visualización operacional sin aceleración gráfica.'
    return null
  })
  const [retryCount, setRetryCount] = useState(0)
  const [copiedAddress, setCopiedAddress] = useState(false)

  // Modo Ligero configurable y persistido
  const [isLightweight, setIsLightweight] = useState<boolean>(() => {
    if (typeof forcedLightweight === 'boolean') return forcedLightweight
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('vamo_map_lightweight')
        return stored === 'true'
      } catch (e) {}
    }
    return false
  })

  const routeCoordsRef = useRef<LngLat[]>(routeCoordinates)
  routeCoordsRef.current = routeCoordinates
  const routeLayerCreatedRef = useRef(false)

  // Sincronizar estado ligero forzado si se pasa por prop
  useEffect(() => {
    if (typeof forcedLightweight === 'boolean') {
      setIsLightweight(forcedLightweight)
    }
  }, [forcedLightweight])

  // Inyectar edificios 3D solo en modo ENHANCED con 3D activo
  const add3DBuildingsLayer = (map: maplibregl.Map) => {
    if (isLightweight || !is3D) return
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

  // 1. Inicialización y Resiliencia de MapLibre GL
  useEffect(() => {
    // Si se fuerza modo fallback explícitamente
    if (forceFallback) {
      setExperienceMode('FALLBACK')
      setWebglState('WEBGL_UNAVAILABLE')
      setWebglError('Modo de visualización operacional sin aceleración gráfica.')
      return
    }

    // Verificación WebGL inicial
    if (!checkWebGLSupport()) {
      setExperienceMode('FALLBACK')
      setWebglState('WEBGL_UNAVAILABLE')
      setWebglError('Tu dispositivo o navegador no tiene aceleración WebGL activa.')
      return
    }

    if (!mapContainer.current) return

    // Limpieza de marcadores existentes
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
    setWebglError(null)

    const styleUrl = currentTheme === 'dark' ? STYLE_3D_DARK : STYLE_3D_LIGHT

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [center[1], center[0]] as [number, number],
        zoom,
        pitch: (is3D && !isLightweight) ? 58 : 0,
        bearing: (is3D && !isLightweight) ? -15 : 0,
        attributionControl: false
      })

      // Escuchadores de pérdida y restauración de contexto WebGL
      const containerEl = mapContainer.current
      let restorationHandled = false

      const handleContextLost = (e: Event) => {
        e.preventDefault()
        console.warn('⚠️ Contexto WebGL perdido en VAMO MapLibre.')
        setWebglState('WEBGL_CONTEXT_LOST')
        setExperienceMode('FALLBACK')
        setWebglError('El acelerador gráfico del dispositivo se reinició temporalmente.')
      }

      const handleContextRestored = () => {
        if (restorationHandled) return
        restorationHandled = true
        console.log('🔄 Contexto WebGL restaurado. Recuperación controlada una sola vez.')
        setWebglState('WEBGL_RESTORED')
        setExperienceMode(isLightweight ? 'LIGHTWEIGHT' : 'ENHANCED')
        setWebglError(null)
      }

      containerEl.addEventListener('webglcontextlost', handleContextLost, false)
      containerEl.addEventListener('webglcontextrestored', handleContextRestored, false)

      map.addControl(new maplibregl.NavigationControl({ showCompass: !isLightweight }), 'top-right')

      if (enableGeolocate !== false) {
        const geolocateControl = new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: !isLightweight, timeout: 6000 },
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

      map.on('error', (err) => {
        console.warn('⚠️ Error interno MapLibre:', err.error?.message || err)
      })

      const handleLoadedMap = () => {
        try { map.resize() } catch (e) {}
        setTimeout(() => { try { map.resize() } catch (e) {} }, 150)
        setTimeout(() => { try { map.resize() } catch (e) {} }, 500)
        if (!isLightweight && is3D) {
          add3DBuildingsLayer(map)
        }
        createRouteSourceAndLayers(map)
        pushRouteData(map)
        setIsMapLoaded(true)
        setWebglState('WEBGL_AVAILABLE')
        setExperienceMode(isLightweight ? 'LIGHTWEIGHT' : 'ENHANCED')
      }

      map.on('load', handleLoadedMap)
      map.on('style.load', () => {
        try { map.resize() } catch (e) {}
        clusterSourceCreatedRef.current = false
        if (!isLightweight && is3D) {
          add3DBuildingsLayer(map)
        }
        createRouteSourceAndLayers(map)
        pushRouteData(map)
        setIsMapLoaded(true)
        setWebglState('WEBGL_AVAILABLE')
      })

      // ResizeObserver con protección contra storms de renderizado
      let resizeObserver: ResizeObserver | null = null
      let resizeTimeout: NodeJS.Timeout | null = null
      if (typeof ResizeObserver !== 'undefined' && mapContainer.current) {
        resizeObserver = new ResizeObserver(() => {
          if (resizeTimeout) clearTimeout(resizeTimeout)
          resizeTimeout = setTimeout(() => {
            try { map.resize() } catch (e) {}
          }, 100)
        })
        resizeObserver.observe(mapContainer.current)
      }

      mapRef.current = map

      return () => {
        if (resizeTimeout) clearTimeout(resizeTimeout)
        if (resizeObserver) resizeObserver.disconnect()
        containerEl.removeEventListener('webglcontextlost', handleContextLost)
        containerEl.removeEventListener('webglcontextrestored', handleContextRestored)
        if (mapRef.current) {
          try { mapRef.current.remove() } catch (e) {}
          mapRef.current = null
        }
      }
    } catch (err: unknown) {
      console.error('Error al inicializar MapLibre:', err)
      setWebglState('WEBGL_DEGRADED')
      setExperienceMode('FALLBACK')
      setWebglError('No se pudo inicializar la superficie cartográfica.')
    }
  }, [currentTheme, retryCount, isLightweight, forceFallback])

  // 2. Conmutador 3D / 2D
  const toggle3DMode = () => {
    if (isLightweight) return
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

  // 3. Conmutador de Modo Ligero (Ahorro de batería y bajo rendimiento)
  const toggleLightweightMode = () => {
    const nextVal = !isLightweight
    setIsLightweight(nextVal)
    try {
      localStorage.setItem('vamo_map_lightweight', String(nextVal))
    } catch (e) {}

    if (onToggleLightweight) {
      onToggleLightweight(nextVal)
    }

    if (nextVal && is3D) {
      setIs3D(false)
      if (mapRef.current) {
        mapRef.current.easeTo({ pitch: 0, bearing: 0, duration: 300 })
      }
    }
  }

  // 4. Conmutador de Tema (Claro / Gris Dark)
  const toggleTheme = () => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light'
    setCurrentTheme(nextTheme)
  }

  // 5. Manejo de Rutas Resiliente
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
      paint: { 'line-color': '#ffffff', 'line-width': isLightweight ? 8 : 12, 'line-opacity': 0.95 }
    })

    map.addLayer({
      id: 'nav-route-line',
      type: 'line',
      source: 'nav-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0056D2', 'line-width': isLightweight ? 5 : 7, 'line-opacity': 1.0 }
    })

    routeLayerCreatedRef.current = true
  }, [isLightweight])

  const pushRouteData = useCallback((map: maplibregl.Map) => {
    const src = map.getSource('nav-route') as maplibregl.GeoJSONSource | undefined
    if (!src) return

    const coords = routeCoordsRef.current

    // Si la ruta falló o fue limpiada, no dejar ruta vieja en pantalla
    if (routeStatus !== 'success' && (!coords || coords.length < 2)) {
      src.setData({ type: 'FeatureCollection', features: [] })
      return
    }

    if (coords && coords.length >= 2) {
      src.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords }
        }]
      })
    }
  }, [routeStatus])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isMapLoaded) return

    createRouteSourceAndLayers(map)
    pushRouteData(map)

    if (!isUserInteracting && routeCoordinates && routeCoordinates.length >= 2) {
      const bounds = new maplibregl.LngLatBounds()
      routeCoordinates.forEach(pt => bounds.extend(pt as [number, number]))
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 80, left: 40, right: 40 },
        maxZoom: 16,
        duration: isLightweight ? 0 : 500
      })
    }
  }, [routeCoordinates, isMapLoaded, isLightweight, pushRouteData, createRouteSourceAndLayers])

  // 6. Configuración de Fuente y Capas de Agrupación Espacial Nativa (Spatial Clustering)
  const createClusterSourceAndLayers = useCallback((map: maplibregl.Map) => {
    if (clusterSourceCreatedRef.current) return
    if (map.getSource('drivers-cluster-source')) return

    map.addSource('drivers-cluster-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom,
      clusterRadius: 50 // Radio espacial de agrupación en píxeles
    })

    // Capa 1: Círculo del Cluster con gradiente y tamaño adaptativo según cantidad
    map.addLayer({
      id: 'drivers-clusters-circle',
      type: 'circle',
      source: 'drivers-cluster-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#0040A1', // Menos de 10 motos: Azul VAMO
          10,
          '#0056D2', // Entre 10 y 25: Azul vibrante
          25,
          '#161E00'  // Más de 25: Alto contraste VAMO
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          18,
          10,
          24,
          25,
          30
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#C3F400'
      }
    })

    // Capa 2: Etiqueta de cantidad de motos dentro del cluster
    map.addLayer({
      id: 'drivers-cluster-count',
      type: 'symbol',
      source: 'drivers-cluster-source',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 12,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
      },
      paint: {
        'text-color': '#C3F400'
      }
    })

    // Capa 3: Puntos individuales desenpaquetados desde la fuente cluster
    map.addLayer({
      id: 'drivers-unclustered-points',
      type: 'circle',
      source: 'drivers-cluster-source',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'case',
          ['==', ['get', 'status'], 'DISPONIBLE'],
          '#C3F400',
          '#0056D2'
        ],
        'circle-radius': 7,
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#FFFFFF'
      }
    })

    // Interacción: Al hacer clic en un cluster, hacer zoom natural para expandir
    map.on('click', 'drivers-clusters-circle', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['drivers-clusters-circle'] })
      const clusterId = features[0]?.properties?.cluster_id
      if (clusterId === undefined) return

      const src = map.getSource('drivers-cluster-source') as maplibregl.GeoJSONSource | undefined
      if (src && src.getClusterExpansionZoom) {
        src.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geom = features[0]?.geometry
          if (geom && geom.type === 'Point') {
            const coords = (geom as GeoJSON.Point).coordinates as [number, number]
            map.easeTo({
              center: coords,
              zoom: Math.min(zoom + 0.5, 17),
              duration: 500
            })
          }
        }).catch(() => {})
      }
    })

    map.on('mouseenter', 'drivers-clusters-circle', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'drivers-clusters-circle', () => {
      map.getCanvas().style.cursor = ''
    })

    clusterSourceCreatedRef.current = true
  }, [clusterMaxZoom])

  // 7. Marcadores de Choferes con Política de Densidad, Agrupación Espacial y Privacidad
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return
    const map = mapRef.current

    // Filtrar marcadores según modelo de privacidad
    const visibleDrivers = drivers.filter(d => d.privacyMode !== 'hidden')

    // Determinar si activar agrupación espacial:
    // Prop explícita `enableClustering` o superación de umbral de densidad
    const isClusteringActive = typeof enableClustering === 'boolean'
      ? enableClustering
      : shouldActivateClustering(visibleDrivers.length, MARKER_DENSITY_THRESHOLD)

    if (isClusteringActive) {
      // 1. Limpiar marcadores DOM tradicionales para liberar memoria y evitar sobrecarga en GPU
      Object.keys(markersRef.current).forEach(id => {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      })

      // 2. Crear capas espaciales si no existen
      createClusterSourceAndLayers(map)

      // 3. Empujar GeoJSON a la fuente vectorial nativa de MapLibre
      const src = map.getSource('drivers-cluster-source') as maplibregl.GeoJSONSource | undefined
      if (src) {
        const geojsonData = driversToGeoJSON(visibleDrivers)
        src.setData(geojsonData as GeoJSON.FeatureCollection<GeoJSON.Point>)
      }

      // Asegurar visibilidad de capas de cluster
      if (map.getLayer('drivers-clusters-circle')) {
        map.setLayoutProperty('drivers-clusters-circle', 'visibility', 'visible')
        map.setLayoutProperty('drivers-cluster-count', 'visibility', 'visible')
        map.setLayoutProperty('drivers-unclustered-points', 'visibility', 'visible')
      }
    } else {
      // Ocultar capas nativas de cluster si estaban activas
      if (map.getLayer('drivers-clusters-circle')) {
        map.setLayoutProperty('drivers-clusters-circle', 'visibility', 'none')
        map.setLayoutProperty('drivers-cluster-count', 'visibility', 'none')
        map.setLayoutProperty('drivers-unclustered-points', 'visibility', 'none')
      }

      // Renderizado individual por marcadores DOM tradicionales para baja densidad
      Object.keys(markersRef.current).forEach(id => {
        if (!visibleDrivers.find(d => d.id === id)) {
          markersRef.current[id].remove()
          delete markersRef.current[id]
        }
      })

      visibleDrivers.forEach(driver => {
        const isApproximate = driver.privacyMode === 'approximate'
        const posLngLat: [number, number] = [driver.lng, driver.lat]

        if (markersRef.current[driver.id]) {
          markersRef.current[driver.id].setLngLat(posLngLat)
        } else {
          const glowColor = driver.status === 'DISPONIBLE' ? '#c3f400' : '#0056D2'

          const dotEl = document.createElement('div')
          dotEl.style.cssText = 'width: 0px; height: 0px; position: relative; cursor: pointer;'

          const pingHtml = (!isLightweight) ? `
            <div style="
              position: absolute; top: -11px; left: -11px;
              width: 22px; height: 22px; border-radius: 50%;
              background: ${glowColor}; opacity: 0.45;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
          ` : ''

          dotEl.innerHTML = `
            ${pingHtml}
            <div style="
              position: absolute; top: -7px; left: -7px;
              width: 14px; height: 14px; border-radius: 50%;
              background: ${glowColor}; border: 2px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            "></div>
            <div style="
              position: absolute; top: 10px; left: 0;
              transform: translateX(-50%); white-space: nowrap; pointer-events: none;
              background: rgba(15, 23, 42, 0.9); color: #c3f400; font-size: 10px; font-weight: 800;
              padding: 2px 6px; border-radius: 6px;
              border: 1px solid rgba(195, 244, 0, 0.3);
            ">
              🛵 ${driver.name} ${isApproximate ? '(Aprox)' : ''}
            </div>
          `
          const marker = new maplibregl.Marker({ element: dotEl, anchor: 'center' })
            .setLngLat(posLngLat)
            .addTo(map)

          markersRef.current[driver.id] = marker
        }
      })
    }
  }, [drivers, isMapLoaded, isLightweight, enableClustering, createClusterSourceAndLayers])

  // 8. Marcadores de Waypoints (Rutas, Origen y Destino - Preservados fuera de clustering)
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
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>
          <div style="
            position: absolute; bottom: 9px; left: 0;
            transform: translateX(-50%); white-space: nowrap; pointer-events: none;
            color: ${dotColor}; font-size: 11px; font-weight: 800;
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
        pitch: (is3D && !isLightweight) ? 58 : 0,
        bearing: (is3D && !isLightweight) ? -15 : 0,
        zoom,
        duration: isLightweight ? 0 : 600
      })
    }
  }

  // 8. Pantalla de Fallback Operativa Verdadera (True Non-WebGL Fallback en es-MX)
  if (experienceMode === 'FALLBACK') {
    const isWebGLOperational = webglState === 'WEBGL_AVAILABLE' || webglState === 'WEBGL_RESTORED'
    const targetTitle = fallbackDetails?.destinationTitle || 'Destino de la Orden'
    const safeNavUrl = fallbackDetails ? buildSafeNavigationUrl({
      destinationTitle: fallbackDetails.destinationTitle,
      lat: fallbackDetails.destinationLat,
      lng: fallbackDetails.destinationLng,
      privacyMode: fallbackDetails.privacyMode || 'exact'
    }) : null

    const handleCopyAddress = () => {
      if (typeof navigator !== 'undefined' && navigator.clipboard && targetTitle) {
        navigator.clipboard.writeText(targetTitle)
        setCopiedAddress(true)
        setTimeout(() => setCopiedAddress(false), 2500)
      }
    }

    return (
      <div className={`rounded-panel bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between items-center text-center relative border border-slate-800 ${className}`}>
        <div className="max-w-md my-auto space-y-4 w-full">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 text-[#FDDF33] flex items-center justify-center mx-auto text-2xl font-black">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              No pudimos mostrar el mapa en este dispositivo
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
              {webglError || 'El acelerador de gráficos no respondió. Los datos operativos continúan funcionando con normalidad.'}
            </p>
          </div>

          {/* Tarjeta de Información Operativa Crítica (True Fallback sin WebGL) */}
          <div className="bg-slate-800/90 p-4 rounded-card text-left space-y-2.5 text-xs border border-slate-700/80 shadow-md">
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">ESTADO DEL SERVICIO:</span>
              <span className="text-[#C3F400] font-black bg-[#C3F400]/15 px-2.5 py-0.5 rounded-pill">
                {fallbackDetails?.orderStatus || 'EN PROCESO'}
              </span>
            </div>

            {fallbackDetails?.originTitle && (
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 font-bold shrink-0">Origen:</span>
                <span className="text-white font-bold text-right">{fallbackDetails.originTitle}</span>
              </div>
            )}

            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-400 font-bold shrink-0">Destino:</span>
              <span className="text-white font-black text-right">{targetTitle}</span>
            </div>

            {fallbackDetails?.distanceKm && (
              <div className="flex justify-between items-center pt-1 border-t border-slate-700/40">
                <span className="text-slate-400 font-bold">Distancia estimada:</span>
                <span className="text-[#FDDF33] font-black">{fallbackDetails.distanceKm} km</span>
              </div>
            )}

            {fallbackDetails?.privacyMode === 'approximate' && (
              <p className="text-[10px] text-sky-400 font-medium pt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Ubicación aproximada protegida por privacidad</span>
              </p>
            )}
          </div>

          {/* Acciones Operativas Útiles */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <VamoButton
              variant="accent"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                setExperienceMode('ENHANCED')
                setRetryCount(c => c + 1)
              }}
            >
              Reintentar Mapa
            </VamoButton>

            {/* Acción de Navegación Externa Segura */}
            {safeNavUrl && (
              <a
                href={safeNavUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center font-extrabold text-xs px-3.5 py-2 rounded-control gap-1.5 h-8 bg-[#0056D2] hover:bg-[#0040A1] text-white shadow-xs transition-all active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#C3F400]" />
                <span>Abrir Navegación</span>
              </a>
            )}

            {/* Copiar Dirección / Nombre de Destino */}
            {targetTitle && fallbackDetails?.privacyMode !== 'hidden' && (
              <VamoButton
                variant="ghost"
                size="sm"
                leftIcon={copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                onClick={handleCopyAddress}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {copiedAddress ? '¡Copiado!' : 'Copiar Destino'}
              </VamoButton>
            )}

            {/* "Abrir en Modo Ligero" SOLO aparece si WebGL es funcional */}
            {isWebGLOperational && !isLightweight && (
              <VamoButton
                variant="ghost"
                size="sm"
                leftIcon={<Zap className="w-3.5 h-3.5 text-[#FDDF33]" />}
                onClick={() => {
                  setIsLightweight(true)
                  setExperienceMode('LIGHTWEIGHT')
                  setRetryCount(c => c + 1)
                }}
                className="text-white hover:bg-slate-800"
              >
                Abrir en Modo Ligero
              </VamoButton>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-panel overflow-hidden border border-[#E5E2E1] dark:border-slate-800 shadow-inner relative z-0 ${className}`}
      style={{ minHeight: '450px', height: '100%', width: '100%', position: 'relative' }}
    >
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ minHeight: '450px', height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
      />

      {/* Barra de Notificación de Estados de Ruta y GPS (Superior Izquierda) */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto max-w-[280px]">
        {routeStatus === 'loading' && (
          <div className="bg-slate-900/90 text-[#FDDF33] text-[10px] font-extrabold px-3 py-1 rounded-pill flex items-center gap-1.5 backdrop-blur-xs shadow-md border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#FDDF33] animate-ping" />
            Calculando trayecto por calles...
          </div>
        )}

        {routeStatus === 'no_route' && (
          <div className="bg-amber-600/95 text-white text-[10px] font-extrabold px-3 py-1 rounded-pill flex items-center gap-1.5 shadow-md">
            <span>⚠️ Ruta vehicular directa no encontrada</span>
          </div>
        )}

        {gpsStatus === 'approximate' && (
          <div className="bg-blue-600/95 text-white text-[10px] font-extrabold px-3 py-1 rounded-pill flex items-center gap-1.5 shadow-md">
            <ShieldCheck className="w-3 h-3" />
            Ubicación aproximada por privacidad
          </div>
        )}

        {gpsStatus === 'permission_denied' && (
          <div className="bg-red-600/95 text-white text-[10px] font-extrabold px-3 py-1 rounded-pill flex items-center gap-1.5 shadow-md">
            <span>Permiso GPS denegado en navegador</span>
          </div>
        )}
      </div>

      {/* Botones Flotantes Unificados VAMO (Inferior Izquierda) */}
      <div className="absolute bottom-4 left-3 z-20 flex items-center gap-2 pointer-events-auto">
        {/* Botón 3D / 2D (Solo en Modo Enhanced) */}
        {!isLightweight && (
          <button
            type="button"
            onClick={toggle3DMode}
            className={`px-3.5 py-2 rounded-control font-black text-[11px] shadow-md flex items-center gap-1.5 border-2 active:scale-95 transition-all cursor-pointer ${
              is3D
                ? 'bg-[#0056D2] text-white border-white'
                : 'bg-white dark:bg-slate-900 text-[#0056D2] border-[#0056D2]'
            }`}
          >
            {is3D ? (
              <>
                <Box className="w-3.5 h-3.5 text-[#c3f400] animate-pulse shrink-0" />
                <span className="tracking-wider">3D ACTIVO</span>
              </>
            ) : (
              <>
                <MapIcon className="w-3.5 h-3.5 text-[#0056D2] shrink-0" />
                <span className="tracking-wider">MODO 2D</span>
              </>
            )}
          </button>
        )}

        {/* Botón Conmutador de Modo Ligero */}
        <button
          type="button"
          onClick={toggleLightweightMode}
          title={isLightweight ? 'Desactivar Modo Ligero' : 'Activar Modo Ligero (Ahorro de batería)'}
          className={`px-3 py-2 rounded-control text-[11px] font-extrabold shadow-md flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
            isLightweight
              ? 'bg-[#C3F400] text-[#161E00] border-[#161E00]/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isLightweight ? 'Ligero ON' : 'Ligero'}</span>
        </button>

        {/* Botón Tema Claro / Oscuro */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Cambiar tema de mapa"
          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-control shadow-md border border-slate-200 dark:border-slate-800 active:scale-95 transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer"
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-[#0056D2]" />
          )}
        </button>
      </div>

      {/* Botón Recentrar Flotante Ergonómico */}
      {isUserInteracting && (
        <button
          type="button"
          onClick={recenterOnDriver}
          className="absolute bottom-4 right-3 z-20 bg-[#0056D2] hover:bg-[#0040a1] text-[#c3f400] px-4 py-2.5 rounded-pill font-extrabold text-xs shadow-float flex items-center gap-2 border-2 border-white animate-bounce pointer-events-auto cursor-pointer"
        >
          <Navigation className="w-4 h-4 text-[#c3f400] rotate-45" />
          <span className="text-white">Recentrar 🎯</span>
        </button>
      )}
    </div>
  )
}
