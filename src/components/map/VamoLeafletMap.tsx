'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type L from 'leaflet'
import { LatLng, LngLat } from '@/lib/services/gpsSocketService'
import { UserPositionData, MapLoadState } from './mapCommonTypes'
import { AlertTriangle, RefreshCw, Navigation, Compass } from 'lucide-react'

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
  surgePercent?: string
}

export interface VamoLeafletMapProps {
  center?: LatLng
  zoom?: number
  theme?: 'light' | 'dark'
  drivers?: DriverMarkerData[]
  waypoints?: MapWaypoint[]
  routeCoordinates?: LngLat[]
  heatZones?: HeatZoneItem[]
  userPosition?: UserPositionData | null
  className?: string
  enableGeolocate?: boolean
  enableClustering?: boolean
  onMapClick?: (coords: { lat: number; lng: number }) => void
  onStateChange?: (state: MapLoadState) => void
}

function createHexagonCoordinates(centerLat: number, centerLng: number, radiusMeters: number): [number, number][] {
  const points: [number, number][] = []
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
  userPosition,
  className = 'w-full h-full min-h-[420px]',
  enableGeolocate = true,
  onMapClick,
  onStateChange
}: VamoLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const driversLayerRef = useRef<L.LayerGroup | null>(null)
  const waypointsLayerRef = useRef<L.LayerGroup | null>(null)
  const heatLayerRef = useRef<L.LayerGroup | null>(null)
  const userPositionLayerRef = useRef<L.LayerGroup | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)
  const routeCasingRef = useRef<L.Polyline | null>(null)
  const lastAppliedCenterRef = useRef<[number, number]>([center[0], center[1]])
  const lastAppliedZoomRef = useRef<number>(zoom)
  const hasSuccessfulTileRef = useRef<boolean>(false)

  const [mapState, setMapState] = useState<MapLoadState>('MAP_INITIALIZING')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [failedTilesCount, setFailedTilesCount] = useState(0)

  const updateState = useCallback((s: MapLoadState, err?: string) => {
    setMapState(s)
    if (err) setErrorMessage(err)
    if (onStateChange) onStateChange(s)
  }, [onStateChange])

  // 1. Inicialización de Leaflet con Manejo de Errores y Diagnóstico de Tiles
  useEffect(() => {
    let isMounted = true
    hasSuccessfulTileRef.current = false

    let initTimeout: NodeJS.Timeout | null = setTimeout(() => {
      if (isMounted && !hasSuccessfulTileRef.current) {
        console.warn('⚠️ [VAMO Leaflet] Timeout de inicialización de teselas agotado (8.5s).')
        updateState('TILE_ERROR', 'No se pudieron descargar las teselas de cartografía en tiempo y forma.')
      }
    }, 8500)

    async function initLeaflet() {
      if (!containerRef.current || mapRef.current) return

      setFailedTilesCount(0)
      setErrorMessage(null)
      updateState('MAP_INITIALIZING')

      try {
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

        lastAppliedCenterRef.current = [center[0], center[1]]
        lastAppliedZoomRef.current = zoom

        L.control.zoom({ position: 'topright' }).addTo(map)

        // Tile layer con diagnóstico y eventos
        const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        const tileLayer = L.tileLayer(tileUrl, {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap Contributors'
        }).addTo(map)

        tileLayer.on('loading', () => {
          if (isMounted && !hasSuccessfulTileRef.current) updateState('TILE_LOADING')
        })

        tileLayer.on('tileload', () => {
          if (isMounted && !hasSuccessfulTileRef.current) {
            hasSuccessfulTileRef.current = true
            if (initTimeout) {
              clearTimeout(initTimeout)
              initTimeout = null
            }
            updateState('MAP_READY')
          }
        })

        tileLayer.on('load', () => {
          if (isMounted) {
            hasSuccessfulTileRef.current = true
            if (initTimeout) {
              clearTimeout(initTimeout)
              initTimeout = null
            }
            updateState('MAP_READY')
          }
        })

        tileLayer.on('tileerror', () => {
          if (isMounted) {
            setFailedTilesCount(prev => {
              const next = prev + 1
              if (next >= 4 && !hasSuccessfulTileRef.current) {
                updateState('TILE_ERROR', 'Dificultad de conexión con el proveedor de mapas.')
              }
              return next
            })
          }
        })

        tileLayer.addTo(map)

        const heatGroup = L.layerGroup().addTo(map)
        const waypointsGroup = L.layerGroup().addTo(map)
        const driversGroup = L.layerGroup().addTo(map)
        const userPositionGroup = L.layerGroup().addTo(map)

        heatLayerRef.current = heatGroup
        waypointsLayerRef.current = waypointsGroup
        driversLayerRef.current = driversGroup
        userPositionLayerRef.current = userPositionGroup

        map.on('click', (e: L.LeafletMouseEvent) => {
          if (onMapClick) {
            onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
          }
        })

        mapRef.current = map

        // Invalidate size en montura inicial
        setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize() }, 100)
        setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize() }, 400)
      } catch (err: unknown) {
        if (initTimeout) clearTimeout(initTimeout)
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Error al inicializar Leaflet'
          updateState('RENDERER_ERROR', msg)
        }
      }
    }

    initLeaflet()

    return () => {
      isMounted = false
      if (initTimeout) clearTimeout(initTimeout)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [theme])

  // 2. ResizeObserver y Detección de Viewport Dinámico (Móvil / PWA)
  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return

    let timeoutId: NodeJS.Timeout | null = null

    const triggerInvalidate = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }, 120)
    }

    // A. ResizeObserver sobre el contenedor físico
    const ro = new ResizeObserver(() => {
      triggerInvalidate()
    })
    ro.observe(containerRef.current)

    // B. Eventos de ventana móvil y orientación
    window.addEventListener('resize', triggerInvalidate)
    window.addEventListener('orientationchange', triggerInvalidate)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', triggerInvalidate)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      ro.disconnect()
      window.removeEventListener('resize', triggerInvalidate)
      window.removeEventListener('orientationchange', triggerInvalidate)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', triggerInvalidate)
      }
    }
  }, [mapState])

  // 3. Actualizar Centro y Zoom basado en CAMBIOS SEMÁNTICOS NUMÉRICOS (No referencias de arrays)
  useEffect(() => {
    if (!mapRef.current) return

    const [prevLat, prevLng] = lastAppliedCenterRef.current
    const prevZoom = lastAppliedZoomRef.current

    // Verificar si los valores numéricos del prop cambiaron realmente
    const centerChanged = Math.abs(prevLat - center[0]) > 0.00001 || Math.abs(prevLng - center[1]) > 0.00001
    const zoomChanged = prevZoom !== zoom

    if (centerChanged || zoomChanged) {
      lastAppliedCenterRef.current = [center[0], center[1]]
      lastAppliedZoomRef.current = zoom
      mapRef.current.setView([center[0], center[1]], zoom, { animate: true })
    }
  }, [center[0], center[1], zoom])

  // 4. Renderizar Ubicación Actual del Usuario ("Mi ubicación" + Círculo de Precisión)
  useEffect(() => {
    if (!mapRef.current || !userPositionLayerRef.current) return
    const group = userPositionLayerRef.current
    group.clearLayers()

    if (!userPosition) return

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      const { lat, lng, accuracyMeters, isLowAccuracy } = userPosition

      // Círculo de precisión semitransparente (si existe margen medible)
      if (accuracyMeters && accuracyMeters > 0 && accuracyMeters <= 1000) {
        const accuracyCircle = L.circle([lat, lng], {
          radius: accuracyMeters,
          color: isLowAccuracy ? '#d97706' : '#0056D2',
          fillColor: isLowAccuracy ? '#fef3c7' : '#ccd8ff',
          fillOpacity: 0.25,
          weight: 1.5,
          interactive: false
        })
        group.addLayer(accuracyCircle)
      }

      // Marcador de Ubicación del Usuario con Pulso VAMO
      const userDotHtml = `
        <div style="position: relative; width: 0; height: 0; pointer-events: none;">
          <div style="
            position: absolute; top: -14px; left: -14px;
            width: 28px; height: 28px; border-radius: 50%;
            background: #0056D2; opacity: 0.35;
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: absolute; top: -9px; left: -9px;
            width: 18px; height: 18px; border-radius: 50%;
            background: #0056D2; border: 3px solid #ffffff;
            box-shadow: 0 3px 8px rgba(0, 86, 210, 0.4);
          "></div>
          <div style="
            position: absolute; top: 12px; left: 0;
            transform: translateX(-50%); white-space: nowrap;
            background: #0040A1; color: #C3F400;
            font-size: 10px; font-weight: 900; font-family: system-ui, sans-serif;
            padding: 2px 8px; border-radius: 9999px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          ">
            Mi ubicación 🎯
          </div>
        </div>
      `

      const userIcon = L.divIcon({
        html: userDotHtml,
        className: 'user-position-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      })

      const userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
      group.addLayer(userMarker)
    })
  }, [userPosition])

  // 5. Renderizar Zonas Calientes
  useEffect(() => {
    if (!mapRef.current || !heatLayerRef.current) return
    const group = heatLayerRef.current
    group.clearLayers()

    if (!heatZones || heatZones.length === 0) return

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      heatZones.forEach(zone => {
        const hexCoords = createHexagonCoordinates(zone.lat, zone.lng, zone.radiusMeters)
        const fillColor = zone.intensity >= 0.85 ? '#FF5722' : zone.intensity >= 0.55 ? '#ff9800' : '#c3f400'

        const polygon = L.polygon(hexCoords, {
          color: fillColor,
          weight: 2,
          opacity: 0.85,
          fillColor: fillColor,
          fillOpacity: 0.25
        })

        polygon.on('click', () => {
          if (onMapClick) onMapClick({ lat: zone.lat, lng: zone.lng })
        })

        group.addLayer(polygon)
      })
    })
  }, [heatZones])

  // 6. Renderizar Choferes
  useEffect(() => {
    if (!mapRef.current || !driversLayerRef.current) return
    const group = driversLayerRef.current
    group.clearLayers()

    if (!drivers || drivers.length === 0) return

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      drivers.forEach(driver => {
        try {
          if (
            typeof driver.lat !== 'number' ||
            typeof driver.lng !== 'number' ||
            !Number.isFinite(driver.lat) ||
            !Number.isFinite(driver.lng) ||
            driver.lat < -90 ||
            driver.lat > 90 ||
            driver.lng < -180 ||
            driver.lng > 180
          ) {
            console.warn(`[VAMO Leaflet] Conductor ignorado por coordenadas inválidas:`, driver)
            return
          }

          const glowColor = driver.status === 'DISPONIBLE' ? '#c3f400' : '#0056D2'
          const dotHtml = `
            <div style="position: relative; width: 0; height: 0; cursor: pointer;">
              <div style="
                position: absolute; top: -7px; left: -7px;
                width: 14px; height: 14px; border-radius: 50%;
                background: ${glowColor}; border: 2px solid #ffffff;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              "></div>
            </div>
          `
          const icon = L.divIcon({ html: dotHtml, className: 'driver-dot', iconSize: [0, 0] })
          const marker = L.marker([driver.lat, driver.lng], { icon })
          group.addLayer(marker)
        } catch (driverErr) {
          console.warn('[VAMO Leaflet] Error aislado al agregar conductor:', driverErr)
        }
      })
    })
  }, [drivers])

  // 7. Renderizar Waypoints
  useEffect(() => {
    if (!mapRef.current || !waypointsLayerRef.current) return
    const group = waypointsLayerRef.current
    group.clearLayers()

    if (!waypoints || waypoints.length === 0) return

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      waypoints.forEach(wp => {
        try {
          if (
            typeof wp.lat !== 'number' ||
            typeof wp.lng !== 'number' ||
            !Number.isFinite(wp.lat) ||
            !Number.isFinite(wp.lng) ||
            wp.lat < -90 ||
            wp.lat > 90 ||
            wp.lng < -180 ||
            wp.lng > 180
          ) {
            console.warn(`[VAMO Leaflet] Waypoint ignorado por coordenadas inválidas:`, wp)
            return
          }

          const isOrigin = wp.type === 'ORIGIN'
          const wpIconHtml = `
            <div style="position: relative; width: 0; height: 0; cursor: pointer;">
              <div style="
                position: absolute; bottom: 0; left: 0;
                transform: translate(-50%, -100%);
                background: ${isOrigin ? '#0040A1' : '#ba1a1a'};
                color: white; padding: 4px 8px; border-radius: 8px;
                font-size: 11px; font-weight: 800; white-space: nowrap;
                border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">
                ${isOrigin ? '🏪' : '📍'} ${wp.title}
              </div>
            </div>
          `
          const icon = L.divIcon({ html: wpIconHtml, className: 'wp-marker', iconSize: [0, 0] })
          const marker = L.marker([wp.lat, wp.lng], { icon })
          group.addLayer(marker)
        } catch (wpErr) {
          console.warn('[VAMO Leaflet] Error aislado al agregar waypoint:', wpErr)
        }
      })
    })
  }, [waypoints])

  // 8. Trazado de Rutas OSRM
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
    <div className={`relative ${className} bg-slate-100 dark:bg-slate-900 overflow-hidden`}>
      {/* Contenedor DOM del Mapa */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '100%', height: '100%' }}
      />

      {/* Estado de Error o Teselas Fallidas */}
      {(mapState === 'RENDERER_ERROR' || (mapState === 'TILE_ERROR' && failedTilesCount >= 4)) && (
        <div className="absolute inset-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              No pudimos cargar la superficie del mapa
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {errorMessage || 'Verifica tu conexión a internet o reintenta cargar el mapa cartográfico.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.invalidateSize()
                setFailedTilesCount(0)
                updateState('MAP_READY')
              }
            }}
            className="px-4 py-2 rounded-full bg-[#0040a1] hover:bg-[#0056d2] text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar carga</span>
          </button>
        </div>
      )}

      {/* Botón de Geolocalización Ergonómico Móvil (Ubicación Física del Dispositivo) */}
      {enableGeolocate && (
        <button
          type="button"
          onClick={async () => {
            try {
              const { deviceCapabilityService } = await import('@/lib/services/deviceCapabilityService')
              const pos = await deviceCapabilityService.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 })
              if (mapRef.current) {
                mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 16, { animate: true })
              }
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Ubicación no disponible en este momento.'
              alert(msg)
            }
          }}
          className="absolute bottom-4 right-4 z-40 bg-white hover:bg-slate-50 text-[#0056d2] p-3 rounded-full shadow-lg border border-slate-200 active:scale-95 transition-all cursor-pointer pointer-events-auto"
          title="Centrar en mi ubicación"
          aria-label="Centrar en mi ubicación"
        >
          <Navigation className="w-5 h-5 text-[#0056d2]" />
        </button>
      )}
    </div>
  )
}
