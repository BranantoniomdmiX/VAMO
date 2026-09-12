/**
 * VAMO Map Common Types & Contracts
 * Unified representation of User Position and Map Load Status
 */

export type MapLoadState =
  | 'MAP_INITIALIZING'
  | 'MAP_READY'
  | 'TILE_LOADING'
  | 'TILE_ERROR'
  | 'STYLE_ERROR'
  | 'RENDERER_ERROR'

/**
 * Health states for MapLibre runtime
 * Strictly distinguishes environment support from runtime health
 */
export type MapLibreHealthState =
  | 'MAPLIBRE_SUPPORTED'
  | 'MAPLIBRE_INITIALIZING'
  | 'MAPLIBRE_READY'
  | 'MAPLIBRE_DEGRADED'
  | 'MAPLIBRE_FAILED'

export type MapLibreFailureCategory =
  | 'STYLE_LOAD_FAILED'
  | 'CRITICAL_SOURCE_FAILED'
  | 'RENDER_TIMEOUT'
  | 'WEBGL_CONTEXT_UNRECOVERED'
  | 'UNKNOWN_RENDERER_FAILURE'

export interface MapHealthReport {
  state: MapLibreHealthState
  failureCategory?: MapLibreFailureCategory
  message?: string
  fatal?: boolean
}

export type VamoUniversalEngineState =
  | 'MAPLIBRE'
  | 'LEAFLET'
  | 'OPERATIONAL_FALLBACK'

export interface UserPositionData {
  lat: number
  lng: number
  accuracyMeters?: number
  heading?: number | null
  speed?: number | null
  isStale?: boolean
  isLowAccuracy?: boolean
  runtimeState?: string
}

export interface MapRendererSelection {
  primary: 'MAPLIBRE' | 'LEAFLET'
  fallback: 'LEAFLET' | 'TEXTUAL'
  current: 'MAPLIBRE' | 'LEAFLET' | 'FALLBACK'
}

