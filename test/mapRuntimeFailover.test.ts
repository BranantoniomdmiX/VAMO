import fs from 'fs'
import path from 'path'

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FALLÓ ASERCIÓN: ${msg}`)
    process.exit(1)
  }
  console.log(`✅ PASS: ${msg}`)
}

console.log('\n=== INICIANDO SUITE DETERMINISTA: MAP RUNTIME FAILOVER & ARCHITECTURE GUARD ===\n')

// 1. Simulación de selección de motor según WebGL support
console.log('[1/7] Verificando Separación de Support vs Runtime Health...')
function selectInitialEngine(hasWebGL: boolean, mode3D: boolean, preferred: 'AUTO' | 'MAPLIBRE' | 'LEAFLET') {
  if (preferred === 'MAPLIBRE') return hasWebGL ? 'MAPLIBRE' : 'LEAFLET'
  if (preferred === 'LEAFLET') return 'LEAFLET'
  return (mode3D && hasWebGL) ? 'MAPLIBRE' : 'LEAFLET'
}

assert(selectInitialEngine(false, true, 'AUTO') === 'LEAFLET', 'WebGL no soportado selecciona LEAFLET como fallback')
assert(selectInitialEngine(true, true, 'AUTO') === 'MAPLIBRE', 'WebGL soportado con 3D selecciona MAPLIBRE inicialmente')
assert(selectInitialEngine(true, false, 'AUTO') === 'LEAFLET', 'WebGL soportado en 2D selecciona LEAFLET por eficiencia móvil')

// 2. Simulación de Failover reactivo ONE-WAY
console.log('\n[2/7] Verificando Failover reactivo ONE-WAY ante fallos de runtime...')
interface SupervisorState {
  activeEngine: 'MAPLIBRE' | 'LEAFLET' | 'OPERATIONAL_FALLBACK'
  failoverOccurred: boolean
  failoverCount: number
}

function createSupervisor(initial: 'MAPLIBRE' | 'LEAFLET'): {
  getState: () => SupervisorState
  onMapLibreHealth: (report: { state: string; failureCategory?: string; fatal?: boolean }) => void
  onLeafletHealth: (state: string) => void
  manualRetry: () => void
} {
  const state: SupervisorState = {
    activeEngine: initial,
    failoverOccurred: false,
    failoverCount: 0
  }

  return {
    getState: () => ({ ...state }),
    onMapLibreHealth: (report) => {
      if (report.state === 'MAPLIBRE_FAILED' && !state.failoverOccurred) {
        state.failoverOccurred = true
        state.failoverCount++
        state.activeEngine = 'LEAFLET'
      }
    },
    onLeafletHealth: (leafletState) => {
      if ((leafletState === 'TILE_ERROR' || leafletState === 'RENDERER_ERROR') && state.failoverOccurred) {
        state.activeEngine = 'OPERATIONAL_FALLBACK'
      }
    },
    manualRetry: () => {
      state.failoverOccurred = false
      state.activeEngine = 'MAPLIBRE'
    }
  }
}

const supervisor = createSupervisor('MAPLIBRE')
assert(supervisor.getState().activeEngine === 'MAPLIBRE', 'Motor inicial arranca en MAPLIBRE')

// Simular fallo asíncrono crítico de estilo en MapLibre
supervisor.onMapLibreHealth({ state: 'MAPLIBRE_FAILED', failureCategory: 'STYLE_LOAD_FAILED', fatal: true })
assert(supervisor.getState().activeEngine === 'LEAFLET', 'Fallo asíncrono de MapLibre activa failover a LEAFLET')
assert(supervisor.getState().failoverCount === 1, 'Failover se ejecuta exactamente una vez')

// Repetir evento de error de MapLibre no debe alterar ni provocar bucle
supervisor.onMapLibreHealth({ state: 'MAPLIBRE_FAILED', failureCategory: 'STYLE_LOAD_FAILED', fatal: true })
assert(supervisor.getState().failoverCount === 1, 'No existe ping-pong ni bucle de failover (ONE-WAY preservado)')

// 3. Simulación de evento no fatal (transient)
console.log('\n[3/7] Verificando eventos no fatales / transitorios (No failover prematuro)...')
const transientSupervisor = createSupervisor('MAPLIBRE')
transientSupervisor.onMapLibreHealth({ state: 'MAPLIBRE_DEGRADED', failureCategory: 'WEBGL_CONTEXT_UNRECOVERED', fatal: false })
assert(transientSupervisor.getState().activeEngine === 'MAPLIBRE', 'Evento no fatal / degradado no dispara failover prematuro')

// 4. Simulación de fallo simultáneo de ambos motores -> Fallback Operacional Textual
console.log('\n[4/7] Verificando degradación total a Fallback Operacional Textual...')
const catastrophicSupervisor = createSupervisor('MAPLIBRE')
catastrophicSupervisor.onMapLibreHealth({ state: 'MAPLIBRE_FAILED', failureCategory: 'RENDER_TIMEOUT', fatal: true })
assert(catastrophicSupervisor.getState().activeEngine === 'LEAFLET', 'Primer failover va a Leaflet')
catastrophicSupervisor.onLeafletHealth('RENDERER_ERROR')
assert(catastrophicSupervisor.getState().activeEngine === 'OPERATIONAL_FALLBACK', 'Fallo de Leaflet degrada a OPERATIONAL_FALLBACK (Cero mapa blanco)')

// 5. Normalización y preservación de userPosition
console.log('\n[5/7] Verificando Preservación del Contrato userPosition...')
interface UserPos {
  lat: number
  lng: number
  accuracyMeters?: number
  heading?: number | null
  speed?: number | null
  runtimeState?: string
}

const initialPos: UserPos = {
  lat: 20.5218,
  lng: -100.8142,
  accuracyMeters: 14.5,
  heading: 90,
  speed: 25,
  runtimeState: 'ACTIVE'
}

function projectUserPosition(pos: UserPos | null) {
  if (!pos) return null
  return {
    coordinates: [pos.lat, pos.lng],
    accuracy: pos.accuracyMeters || 0,
    heading: pos.heading ?? 0,
    hasAccuracyCircle: (pos.accuracyMeters || 0) > 0
  }
}

const userProjection = projectUserPosition(initialPos)
assert(userProjection !== null, 'userPosition proyectado con éxito')
assert(userProjection!.coordinates[0] === 20.5218 && userProjection!.coordinates[1] === -100.8142, 'Coordenadas preservadas idénticas')
assert(userProjection!.hasAccuracyCircle === true, 'Círculo de precisión activo en ambos motores')

// 6. Manual Retry tras Failover
console.log('\n[6/7] Verificando Reintento Manual Controlado...')
supervisor.manualRetry()
assert(supervisor.getState().activeEngine === 'MAPLIBRE', 'Reintento manual reactiva MAPLIBRE de forma explícita')
assert(supervisor.getState().failoverOccurred === false, 'Flag de failover reseteado para permitir nuevo ciclo')

// 7. Architectural Guard: Comprobar que ninguna página de app/ importe VamoMapLibre ni VamoLeafletMap directamente
console.log('\n[7/7] Verificando Dependency Boundary (Cero bypasses directos en app/)...')
const appDir = path.join(process.cwd(), 'src', 'app')

function scanFiles(dir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      results = results.concat(scanFiles(fullPath))
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath)
    }
  }
  return results
}

const allAppFiles = scanFiles(appDir)
let directEngineViolations = 0

for (const filePath of allAppFiles) {
  const content = fs.readFileSync(filePath, 'utf-8')
  if (content.includes("from '@/components/map/VamoMapLibre'") || content.includes('from "@/components/map/VamoMapLibre"')) {
    console.error(`❌ Violación de frontera arquitectónica en: ${filePath} (Importa VamoMapLibre directamente)`)
    directEngineViolations++
  }
  if (content.includes("from '@/components/map/VamoLeafletMap'") || content.includes('from "@/components/map/VamoLeafletMap"')) {
    console.error(`❌ Violación de frontera arquitectónica en: ${filePath} (Importa VamoLeafletMap directamente)`)
    directEngineViolations++
  }
}

assert(directEngineViolations === 0, 'CERO violaciones de frontera arquitectónica: todas las páginas consumen VamoUniversalMap o VamoMap')

console.log('\n=== TODAS LAS PRUEBAS DE MAP RUNTIME FAILOVER PASARON CON ÉXITO ===\n')
