import { 
  driversToGeoJSON, 
  waypointsToGeoJSON, 
  shouldActivateClustering, 
  computeSpatialClusters 
} from '../src/components/map/clusterUtils'
import { DriverMarkerData, MapWaypoint } from '../src/components/map/VamoMapLibre'
import { MARKER_DENSITY_THRESHOLD } from '../src/components/map/mapUtils'

export function runClusteringUnitChecks(): { passed: number; failed: number } {
  let passed = 0
  let failed = 0

  function check(condition: boolean, name: string) {
    if (condition) {
      passed++
    } else {
      failed++
      console.error(`Check failed: ${name}`)
    }
  }

  // 1. Privacidad
  const drivers: DriverMarkerData[] = [
    { id: 'd1', name: 'Chofer 1', lat: 20.52, lng: -100.81, status: 'DISPONIBLE', privacyMode: 'exact' },
    { id: 'd2', name: 'Chofer 2', lat: 20.53, lng: -100.82, status: 'EN_SERVICIO', privacyMode: 'hidden' },
    { id: 'd3', name: 'Chofer 3', lat: 20.54, lng: -100.83, status: 'DISPONIBLE', privacyMode: 'approximate' }
  ]
  const geojson = driversToGeoJSON(drivers)
  check(geojson.features.length === 2, 'Excluye hidden de GeoJSON')
  check(!geojson.features.find(f => f.properties.id === 'd2'), 'No expone d2')
  check(geojson.features.find(f => f.properties.id === 'd3')?.properties.isApproximate === true, 'd3 aproximado')

  // 2. Umbral de Activación
  check(!shouldActivateClustering(10), 'No activa <= 25')
  check(!shouldActivateClustering(MARKER_DENSITY_THRESHOLD), 'No activa en 25')
  check(shouldActivateClustering(26), 'Activa en 26')

  // 3. Waypoints
  const waypoints: MapWaypoint[] = [
    { id: 'wp1', title: 'Origen', lat: 20.52, lng: -100.81, type: 'ORIGIN' },
    { id: 'wp2', title: 'Destino', lat: 20.54, lng: -100.83, type: 'DESTINATION' }
  ]
  const wpGeo = waypointsToGeoJSON(waypoints)
  check(wpGeo.features.length === 2, 'Waypoints intactos')

  // 4. Estrés determinista
  const densities = [1, 10, 25, 50, 100, 250, 500]
  densities.forEach(count => {
    const list: DriverMarkerData[] = Array.from({ length: count }, (_, i) => ({
      id: `driver-${i + 1}`,
      name: `Repartidor #${i + 1}`,
      lat: 20.5218 + (Math.sin(i) * 0.015),
      lng: -100.8142 + (Math.cos(i) * 0.015),
      status: 'DISPONIBLE',
      privacyMode: i === 3 ? 'hidden' : 'exact'
    }))

    const t0 = Date.now()
    const clusters = computeSpatialClusters(list, 12)
    const dt = Date.now() - t0

    const allIds = clusters.flatMap(c => c.driverIds)
    const uniqueIds = new Set(allIds)
    check(allIds.length === uniqueIds.size, `Densidad ${count}: Cero duplicados`)
    check(dt < 100, `Densidad ${count}: Tiempo < 100ms`)

    if (count > MARKER_DENSITY_THRESHOLD) {
      check(clusters.length < count, `Densidad ${count}: Reducción de features`)
    }
  })

  // 5. Expansión a zoom de calle
  const list100: DriverMarkerData[] = Array.from({ length: 100 }, (_, i) => ({
    id: `d-${i}`,
    name: `Chofer ${i}`,
    lat: 20.52 + (i * 0.001),
    lng: -100.81 + (i * 0.001),
    status: 'DISPONIBLE',
    privacyMode: 'exact'
  }))
  const streetClusters = computeSpatialClusters(list100, 16)
  check(streetClusters.length === 100, 'Zoom 16 expandido')
  check(streetClusters.every(c => !c.isCluster), 'Todos son puntos individuales')

  return { passed, failed }
}

const res = runClusteringUnitChecks()
if (res.failed > 0) {
  console.error(`Tests failed: ${res.failed}`)
  process.exit(1)
} else {
  console.log(`All ${res.passed} clustering unit checks passed successfully.`)
}
