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
