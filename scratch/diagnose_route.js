/**
 * Diagnóstico: simular la cadena exacta que sigue el código
 * gpsSocketService.fetchRouteDetails → navDetails.coordinates → VamoMapLibre.routeCoordinates
 */

async function diagnose() {
  // 1. Simular fetchRouteDetails exactamente como lo hace gpsSocketService.ts
  const startLatLng = [20.5218, -100.8142] // LatLng [lat, lng]
  const endLatLng = [20.5260, -100.8090]   // LatLng [lat, lng]

  // Conversión interna de fetchRouteDetails (líneas 156-157)
  const startLngLat = [startLatLng[1], startLatLng[0]] // [-100.8142, 20.5218]
  const endLngLat = [endLatLng[1], endLatLng[0]]       // [-100.8090, 20.5260]

  const url = `https://router.project-osrm.org/route/v1/driving/${startLngLat[0]},${startLngLat[1]};${endLngLat[0]},${endLngLat[1]}?overview=full&geometries=geojson&steps=true`
  
  console.log('URL OSRM:', url)
  
  const res = await fetch(url)
  const data = await res.json()
  
  if (data.code !== 'Ok' || !data.routes?.[0]) {
    console.error('OSRM fallo:', data.code)
    return
  }

  const route = data.routes[0]
  const rawCoords = route.geometry.coordinates

  console.log('\n=== DATOS DE OSRM ===')
  console.log('Total puntos:', rawCoords.length)
  console.log('Primer punto (rawCoords[0]):', rawCoords[0])
  console.log('Último punto:', rawCoords[rawCoords.length - 1])
  console.log('Tipo rawCoords[0][0]:', typeof rawCoords[0][0])
  console.log('Tipo rawCoords[0][1]:', typeof rawCoords[0][1])

  // 2. Esto es lo que setNavDetails guarda:
  const navDetailsCoordinates = rawCoords // LngLat[] tal cual de OSRM

  // 3. Esto es lo que VamoMapLibre recibe como prop routeCoordinates:
  const routeCoordinates = navDetailsCoordinates
  
  console.log('\n=== LO QUE RECIBE VamoMapLibre ===')
  console.log('routeCoordinates.length:', routeCoordinates.length)
  console.log('routeCoordinates[0]:', routeCoordinates[0])
  
  // 4. Validar el GeoJSON que se construye
  const geojsonData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      }
    ]
  }

  console.log('\n=== GEOJSON CONSTRUIDO ===')
  console.log('features.length:', geojsonData.features.length)
  console.log('coordinates.length:', geojsonData.features[0].geometry.coordinates.length)
  console.log('GeoJSON válido:', JSON.stringify(geojsonData).length, 'bytes')

  // 5. Verificar si el GeoJSON es parseable por MapLibre (validar estructura)
  const coords = geojsonData.features[0].geometry.coordinates
  let invalidCount = 0
  for (const c of coords) {
    const [lng, lat] = c
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      invalidCount++
      console.error('  COORDENADA INVÁLIDA:', c)
    }
  }
  console.log('Coordenadas inválidas:', invalidCount, '/', coords.length)

  // 6. PRUEBA CRÍTICA: ¿El useEffect se dispara?
  // El useEffect depende de [routeCoordinates, isMapLoaded]
  // routeCoordinates viene de navDetails.coordinates
  // Pregunta: ¿navDetails.coordinates cambia de referencia al hacer setNavDetails?
  
  console.log('\n=== PRUEBA DE REFERENCIA DE ESTADO ===')
  const state1 = { coordinates: [], distanceKm: '...', durationMin: 0, steps: [] }
  const state2 = { coordinates: rawCoords, distanceKm: '1.0', durationMin: 2, steps: [] }
  
  console.log('state1.coordinates === state2.coordinates:', state1.coordinates === state2.coordinates)
  console.log('state1.coordinates.length:', state1.coordinates.length)
  console.log('state2.coordinates.length:', state2.coordinates.length)
  
  // La referencia CAMBIA (son objetos diferentes), así que React SÍ debería re-renderizar

  // 7. PRUEBA SVG: el updateSvgOverlay usa una CLOSURE sobre routeCoordinates
  // que se captura en el primer useEffect (línea 148: map.on('render', () => updateSvgOverlay()))
  // Pero updateSvgOverlay lee routeCoordinates de la closure del COMPONENTE, no del useEffect
  // Esto es un stale closure: la función updateSvgOverlay se define en cada render pero
  // el handler de map.on('render') apunta a la versión VIEJA (con routeCoordinates = [])
  
  console.log('\n=== DIAGNÓSTICO STALE CLOSURE ===')
  console.log('PROBLEMA ENCONTRADO: map.on("render", () => updateSvgOverlay())')
  console.log('  - El handler se registra en useEffect([theme])')  
  console.log('  - En ese momento routeCoordinates = [] (valor por defecto)')
  console.log('  - updateSvgOverlay() lee routeCoordinates del closure de ese render')
  console.log('  - Cuando OSRM devuelve 27 puntos, el handler SIGUE usando []')
  console.log('  - El SVG NUNCA se dibuja porque routeCoordinates.length < 2 SIEMPRE')
  console.log('')
  console.log('PERO el useEffect WebGL (línea 169) SÍ debería funcionar porque')
  console.log('  depende de [routeCoordinates, isMapLoaded] y se re-ejecuta')
  console.log('')
  console.log('La pregunta real es: ¿POR QUÉ la capa WebGL no se ve?')
  console.log('Posible causa: timing entre isMapLoaded=true y routeCoordinates llegando')
  
  // 8. SIMULACIÓN DE TIMING
  console.log('\n=== SIMULACIÓN DE TIMING ===')
  console.log('Secuencia de eventos:')
  console.log('  1. Componente se monta → routeCoordinates=[] (default)')
  console.log('  2. useEffect([theme]) → crea mapa, registra map.on("load")')
  console.log('  3. useEffect([step]) → llama fetchRouteDetails (ASYNC)')
  console.log('  4. map.on("load") dispara → isMapLoaded=true')
  console.log('  5. useEffect([routeCoordinates, isMapLoaded]) → SE EJECUTA pero routeCoordinates=[] → SALE en línea 176')
  console.log('  6. fetchRouteDetails RESUELVE → setNavDetails({coordinates: 27pts})')
  console.log('  7. Re-render → routeCoordinates=27pts')
  console.log('  8. useEffect([routeCoordinates, isMapLoaded]) → SE EJECUTA con 27pts')
  console.log('  9. DEBERÍA crear source + layers + setData')
  console.log('')
  console.log('PERO... si el paso 6 ocurre ANTES del paso 4 (map load),')
  console.log('entonces en el paso 5 routeCoordinates ya tiene 27pts pero isMapLoaded=false')
  console.log('Y cuando isMapLoaded se pone true, React puede que NO re-ejecute')
  console.log('el useEffect si routeCoordinates no cambió de referencia entre renders.')
  console.log('')
  console.log('SOLUCIÓN: Usar un useRef para las coordenadas de ruta')
  console.log('y dibujar SIEMPRE dentro del callback de map.on("load")')
  console.log('+ mantener el useEffect para actualizaciones posteriores')
}

diagnose().catch(console.error)
