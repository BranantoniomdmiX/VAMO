import { DriverMarkerData, MapWaypoint } from './VamoMapLibre'
import { MARKER_DENSITY_THRESHOLD } from './mapUtils'

export interface ClusterFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    id: string
    name: string
    status: string
    isApproximate: boolean
    cluster?: boolean
    point_count?: number
  }
}

export interface ClusterFeatureCollection {
  type: 'FeatureCollection'
  features: ClusterFeature[]
}

/**
 * Obfuscate coordinates for approximate privacy mode by snapping to ~1km grid (2 decimal places)
 * ensuring exact physical location is never exposed in cluster sources or feature collections.
 */
export function obfuscateApproximateCoords(lat: number, lng: number): [number, number] {
  return [
    Number((Math.round(lng * 100) / 100).toFixed(2)),
    Number((Math.round(lat * 100) / 100).toFixed(2))
  ]
}

/**
 * Filter and convert DriverMarkerData into GeoJSON format respecting privacyMode:
 * - 'hidden': excluded completely (0 features created)
 * - 'approximate': coordinates obfuscated to ~1km neighborhood centroid and flagged with isApproximate
 * - 'exact': included as exact point
 */
export function driversToGeoJSON(drivers: DriverMarkerData[]): ClusterFeatureCollection {
  const visibleDrivers = drivers.filter(d => d.privacyMode !== 'hidden')
  return {
    type: 'FeatureCollection',
    features: visibleDrivers.map(d => {
      const isApproximate = d.privacyMode === 'approximate'
      const coords: [number, number] = isApproximate 
        ? obfuscateApproximateCoords(d.lat, d.lng) 
        : [d.lng, d.lat]

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coords
        },
        properties: {
          id: d.id,
          name: d.name,
          status: d.status,
          isApproximate
        }
      }
    })
  }
}

/**
 * Filter and convert MapWaypoint into GeoJSON format.
 * Routes/Waypoints (Pickups & Destinations) are kept separate from driver clustering
 * to preserve critical delivery landmarks.
 */
export function waypointsToGeoJSON(waypoints: MapWaypoint[]): ClusterFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: waypoints.map(wp => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [wp.lng, wp.lat]
      },
      properties: {
        id: wp.id,
        name: wp.title,
        status: wp.type,
        isApproximate: false
      }
    }))
  }
}

/**
 * Project override policy for cluster activation:
 * Clusters are enabled when marker density exceeds MARKER_DENSITY_THRESHOLD (25)
 * or when explicitly forced for testing/operational stress.
 */
export function shouldActivateClustering(markerCount: number, threshold: number = MARKER_DENSITY_THRESHOLD): boolean {
  return markerCount > threshold
}

/**
 * Pure spatial grid clustering algorithm (K-Means/Grid based) for deterministic testing and Node.js execution.
 * Simulates the exact cluster reduction behavior of MapLibre GeoJSON clustering at a given zoom level.
 */
export interface SpatialCluster {
  id: string
  lat: number
  lng: number
  count: number
  driverIds: string[]
  isCluster: boolean
}

export function computeSpatialClusters(
  drivers: DriverMarkerData[],
  zoom: number,
  clusterRadiusPixels: number = 50
): SpatialCluster[] {
  const visible = drivers.filter(d => d.privacyMode !== 'hidden')
  if (visible.length === 0) return []

  // If density is at or below threshold, or zoom is very high (street level zoom >= 16), show individual markers
  if (!shouldActivateClustering(visible.length) || zoom >= 16) {
    return visible.map(d => {
      const isApprox = d.privacyMode === 'approximate'
      const [lng, lat] = isApprox ? obfuscateApproximateCoords(d.lat, d.lng) : [d.lng, d.lat]
      return {
        id: d.id,
        lat,
        lng,
        count: 1,
        driverIds: [d.id],
        isCluster: false
      }
    })
  }

  // Pixel grid cell size in degrees at this zoom level:
  // 360 degrees / (256 * 2^zoom) * clusterRadiusPixels
  const cellSize = (360 / (256 * Math.pow(2, zoom))) * clusterRadiusPixels

  const grid: Map<string, { latSum: number; lngSum: number; drivers: DriverMarkerData[] }> = new Map()

  for (const rawDriver of visible) {
    const isApproximate = rawDriver.privacyMode === 'approximate'
    const [driverLng, driverLat] = isApproximate 
      ? obfuscateApproximateCoords(rawDriver.lat, rawDriver.lng)
      : [rawDriver.lng, rawDriver.lat]

    const driver = isApproximate ? { ...rawDriver, lat: driverLat, lng: driverLng } : rawDriver
    const gridX = Math.floor(driver.lng / cellSize)
    const gridY = Math.floor(driver.lat / cellSize)
    const key = `${gridX}:${gridY}`

    const cell = grid.get(key)
    if (!cell) {
      grid.set(key, { latSum: driver.lat, lngSum: driver.lng, drivers: [driver] })
    } else {
      cell.latSum += driver.lat
      cell.lngSum += driver.lng
      cell.drivers.push(driver)
    }
  }

  const clusters: SpatialCluster[] = []
  grid.forEach((cell, key) => {
    const count = cell.drivers.length
    if (count === 1) {
      const d = cell.drivers[0]
      clusters.push({
        id: d.id,
        lat: d.lat,
        lng: d.lng,
        count: 1,
        driverIds: [d.id],
        isCluster: false
      })
    } else {
      clusters.push({
        id: `cluster-${key}-${count}`,
        lat: Number((cell.latSum / count).toFixed(6)),
        lng: Number((cell.lngSum / count).toFixed(6)),
        count,
        driverIds: cell.drivers.map(d => d.id),
        isCluster: true
      })
    }
  })

  return clusters
}
