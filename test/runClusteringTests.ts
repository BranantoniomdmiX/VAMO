import { 
  driversToGeoJSON, 
  waypointsToGeoJSON, 
  shouldActivateClustering, 
  computeSpatialClusters 
} from '../src/components/map/clusterUtils'
import { DriverMarkerData, MapWaypoint } from '../src/components/map/VamoMapLibre'
import { MARKER_DENSITY_THRESHOLD } from '../src/components/map/mapUtils'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`)
    process.exit(1)
  } else {
    console.log(`✅ PASS: ${message}`)
  }
}

console.log('\n=== INICIANDO SUITE DETERMINISTA: CLUSTERING & STRESS VAMO ===\n')

// 1. Modelo de Privacidad
console.log('[1/5] Verificando Modelo de Privacidad...')
const rawLat = 20.548765
const rawLng = -100.834521
const driversTest: DriverMarkerData[] = [
  { id: 'd1', name: 'Chofer 1', lat: 20.5218, lng: -100.8142, status: 'DISPONIBLE', privacyMode: 'exact' },
  { id: 'd2', name: 'Chofer 2', lat: 20.5300, lng: -100.8200, status: 'EN_SERVICIO', privacyMode: 'hidden' },
  { id: 'd3', name: 'Chofer 3', lat: rawLat, lng: rawLng, status: 'DISPONIBLE', privacyMode: 'approximate' }
]

const geojson = driversToGeoJSON(driversTest)
assert(geojson.features.length === 2, 'Chofer con privacyMode="hidden" excluido de GeoJSON')
assert(!geojson.features.find(f => f.properties.id === 'd2'), 'ID d2 no existe en GeoJSON')
assert(geojson.features.find(f => f.properties.id === 'd1')?.properties.isApproximate === false, 'd1 no aproximado')
assert(geojson.features.find(f => f.properties.id === 'd3')?.properties.isApproximate === true, 'd3 marcado como aproximado')

// Comprobación de B) La Map Foundation transforma coordenadas exactas a representación aproximada
const d3Feature = geojson.features.find(f => f.properties.id === 'd3')
assert(Boolean(d3Feature), 'Feature d3 presente')
const [d3Lng, d3Lat] = d3Feature!.geometry.coordinates
assert(d3Lat !== rawLat, 'Latitud aproximada fue transformada y difiere de la coordenada exacta')
assert(d3Lng !== rawLng, 'Longitud aproximada fue transformada y difiere de la coordenada exacta')
assert(d3Lat === 20.55 && d3Lng === -100.83, 'Coordenadas redondeadas/obfuscadas a cuadrícula de ~1km')

const clusterPrivacy = computeSpatialClusters(driversTest, 12)
const privacyIds = clusterPrivacy.flatMap(c => c.driverIds)
assert(privacyIds.includes('d1') && !privacyIds.includes('d3') === false && !privacyIds.includes('d2'), 'Clusters excluyen choferes ocultos')

// 2. Política de Activación de Clusters
console.log('\n[2/5] Verificando Política de Activación...')
assert(!shouldActivateClustering(10), 'No activa clustering con 10 choferes')
assert(!shouldActivateClustering(MARKER_DENSITY_THRESHOLD), 'No activa en el límite exacto (25)')
assert(shouldActivateClustering(26), 'Activa clustering con 26 choferes (>25)')
assert(shouldActivateClustering(100), 'Activa clustering con 100 choferes')

// 3. Preservación de Rutas y Waypoints
console.log('\n[3/5] Verificando Preservación de Rutas y Waypoints...')
const waypoints: MapWaypoint[] = [
  { id: 'wp-origin', title: 'Local Taquería', lat: 20.52, lng: -100.81, type: 'ORIGIN' },
  { id: 'wp-dest', title: 'Domicilio Cliente', lat: 20.54, lng: -100.83, type: 'DESTINATION' }
]
const wpGeoJSON = waypointsToGeoJSON(waypoints)
assert(wpGeoJSON.features.length === 2, 'Waypoints preservan cantidad')
assert(wpGeoJSON.features[0].properties.status === 'ORIGIN', 'Waypoint origen intacto')
assert(wpGeoJSON.features[1].properties.status === 'DESTINATION', 'Waypoint destino intacto')

// 4. Simulaciones de Estrés Determinista (1, 10, 25, 50, 100, 250, 500)
console.log('\n[4/5] Ejecutando Simulaciones de Estrés en Densidades: 1, 10, 25, 50, 100, 250, 500...')
const densities = [1, 10, 25, 50, 100, 250, 500]

densities.forEach(count => {
  const drivers: DriverMarkerData[] = Array.from({ length: count }, (_, i) => ({
    id: `driver-${i + 1}`,
    name: `Repartidor #${i + 1}`,
    lat: 20.5218 + (Math.sin(i) * 0.015),
    lng: -100.8142 + (Math.cos(i) * 0.015),
    heading: (i * 30) % 360,
    status: i % 2 === 0 ? 'DISPONIBLE' : 'EN_SERVICIO',
    privacyMode: i === 3 ? 'hidden' : 'exact'
  }))

  const t0 = Date.now()
  const clusters = computeSpatialClusters(drivers, 12)
  const dt = Date.now() - t0

  const allIds = clusters.flatMap(c => c.driverIds)
  const uniqueIds = new Set(allIds)
  assert(allIds.length === uniqueIds.size, `Densidad ${count}: Cero IDs duplicados`)
  assert(dt < 100, `Densidad ${count}: Procesado en ${dt}ms (<100ms)`)

  if (count > MARKER_DENSITY_THRESHOLD) {
    assert(clusters.length < count, `Densidad ${count}: Reducción espacial activa (${clusters.length} features vs ${count} choferes)`)
  }
})

// 5. Expansión a Zoom de Calle
console.log('\n[5/5] Verificando Expansión Natural a Zoom de Calle (Zoom >= 16)...')
const drivers100: DriverMarkerData[] = Array.from({ length: 100 }, (_, i) => ({
  id: `driver-${i + 1}`,
  name: `Repartidor #${i + 1}`,
  lat: 20.5218 + (Math.sin(i) * 0.015),
  lng: -100.8142 + (Math.cos(i) * 0.015),
  status: 'DISPONIBLE',
  privacyMode: 'exact'
}))

const streetClusters = computeSpatialClusters(drivers100, 16)
assert(streetClusters.length === 100, 'A zoom 16 se expande a 100 puntos individuales')
assert(streetClusters.every(c => !c.isCluster), 'Cero clusters en zoom callejero')

console.log('\n=== TODAS LAS PRUEBAS DE CLUSTERING & ESTRÉS PASARON CON ÉXITO ===\n')
