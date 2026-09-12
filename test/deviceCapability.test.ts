import { DeviceCapabilityService, deviceCapabilityService } from '../src/lib/services/deviceCapabilityService'
import { GeolocationRuntimeState, NormalizedGeolocationPosition } from '../src/lib/services/deviceCapabilityTypes'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`)
    process.exit(1)
  } else {
    console.log(`✅ PASS: ${message}`)
  }
}

console.log('\n=== INICIANDO SUITE DETERMINISTA: DEVICE CAPABILITY & GEOLOCATION ===\n')

// ==========================================
// 1. Mock de Browser Environment
// ==========================================
console.log('[1/7] Configurando Mock de Browser & Navigator...')

let mockGeolocationAvailable = true
let mockIsSecureContext = true
let mockPermissionState: PermissionState = 'prompt'
let mockShouldFail = false
let mockErrorCode: number = 1 // PERMISSION_DENIED
let mockLatitude = 20.5218
let mockLongitude = -100.8142
let mockAccuracy = 15 // 15m (alta precisión)
let mockTimestamp = Date.now()
let watchCallback: ((pos: any) => void) | null = null
let watchErrorCallback: ((err: any) => void) | null = null
let nextWatchId = 1
const activeBrowserWatchers = new Set<number>()

// Mock global window & navigator
const mockNavigator: any = {
  get geolocation() {
    if (!mockGeolocationAvailable) return undefined
    return {
      getCurrentPosition: (success: any, error: any, options: any) => {
        if (mockShouldFail) {
          error({
            code: mockErrorCode,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
            message: 'Mock geolocation error'
          })
        } else {
          success({
            coords: {
              latitude: mockLatitude,
              longitude: mockLongitude,
              accuracy: mockAccuracy,
              altitude: null,
              altitudeAccuracy: null,
              heading: 45,
              speed: 5
            },
            timestamp: mockTimestamp
          })
        }
      },
      watchPosition: (success: any, error: any, options: any) => {
        const id = nextWatchId++
        activeBrowserWatchers.add(id)
        watchCallback = success
        watchErrorCallback = error

        if (mockShouldFail) {
          error({
            code: mockErrorCode,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
            message: 'Mock watch error'
          })
        } else {
          success({
            coords: {
              latitude: mockLatitude,
              longitude: mockLongitude,
              accuracy: mockAccuracy,
              heading: 45,
              speed: 5
            },
            timestamp: mockTimestamp
          })
        }
        return id
      },
      clearWatch: (id: number) => {
        activeBrowserWatchers.delete(id)
        watchCallback = null
        watchErrorCallback = null
      }
    }
  },
  permissions: {
    query: async (desc: { name: string }) => {
      return { state: mockPermissionState }
    }
  }
}

// Inyectar en global
Object.defineProperty(globalThis, 'window', {
  value: {
    isSecureContext: mockIsSecureContext,
    location: { protocol: 'https:', hostname: 'localhost' }
  },
  writable: true,
  configurable: true
})

Object.defineProperty(globalThis, 'navigator', {
  value: mockNavigator,
  writable: true,
  configurable: true
})

// ==========================================
// 2. Soporte y Detección de Capacidades
// ==========================================
console.log('\n[2/7] Verificando Detección de Soporte & Contexto Seguro...')

assert(deviceCapabilityService.checkSupport('GEOLOCATION') === true, 'Detecta soporte de GEOLOCATION')
assert(deviceCapabilityService.checkSupport('USB') === false, 'Detecta que USB no está implementada')
assert(deviceCapabilityService.isSecureContext() === true, 'Detecta Secure Context (HTTPS/localhost)')

// ==========================================
// 3. Consulta de Permisos
// ==========================================
console.log('\n[3/7] Verificando Consulta de Permisos...')

;(async () => {
  mockPermissionState = 'granted'
  const perm = await deviceCapabilityService.checkPermission('GEOLOCATION')
  assert(perm === 'granted', 'Permiso de Geolocation reconocido como "granted"')

  const status = await deviceCapabilityService.getCapabilityStatus('GEOLOCATION')
  assert(status.isSupported === true, 'Capability status isSupported = true')
  assert(status.permissionState === 'granted', 'Capability status permission = granted')

  // ==========================================
  // 4. Adquisición Exitosa & Normalización
  // ==========================================
  console.log('\n[4/7] Verificando Adquisición Exitosa y Precisión...')

  mockShouldFail = false
  mockAccuracy = 18 // 18m
  mockTimestamp = Date.now()
  const pos = await deviceCapabilityService.getCurrentPosition()
  assert(pos.coords.latitude === mockLatitude, 'Latitud adquirida coincide')
  assert(pos.coords.longitude === mockLongitude, 'Longitud adquirida coincide')
  assert(pos.isLowAccuracy === false, '18m clasificado como precisión aceptable (no lowAccuracy)')
  assert(pos.isStale === false, 'Posición reciente clasificada como fresca (isStale = false)')
  assert(deviceCapabilityService.getCurrentRuntimeState() === 'ACTIVE', 'Estado operacional = ACTIVE')

  // Probar Baja Precisión (>100m)
  mockAccuracy = 250 // 250m
  const lowAccPos = await deviceCapabilityService.getCurrentPosition()
  assert(lowAccPos.isLowAccuracy === true, '250m clasificado como isLowAccuracy = true')
  assert(deviceCapabilityService.getCurrentRuntimeState() === 'LOW_ACCURACY', 'Estado operacional = LOW_ACCURACY')

  // Probar Posición Antigua (Stale > 15s)
  mockTimestamp = Date.now() - 30000 // 30s atrás
  const stalePos = await deviceCapabilityService.getCurrentPosition({ maximumAge: 60000 })
  assert(stalePos.isStale === true, 'Posición de hace 30s clasificada como isStale = true')

  // ==========================================
  // 5. Clasificación de Errores Nativos y UX
  // ==========================================
  console.log('\n[5/7] Verificando Clasificación de Errores y Mensajes UX en es-MX...')

  // Error 1: Permission Denied
  mockShouldFail = true
  mockErrorCode = 1
  try {
    await deviceCapabilityService.getCurrentPosition()
    assert(false, 'Debe fallar cuando el permiso es denegado')
  } catch (err: any) {
    assert(err.message.includes('PERMISSION_DENIED'), 'Error clasificado como PERMISSION_DENIED')
    assert(deviceCapabilityService.getCurrentRuntimeState() === 'PERMISSION_DENIED', 'Estado = PERMISSION_DENIED')
    const msg = deviceCapabilityService.mapHumanMessage('PERMISSION_DENIED')
    assert(msg.includes('Permiso de ubicación denegado'), 'Mensaje humano es-MX para permiso denegado')
  }

  // Error 2: Position Unavailable
  mockErrorCode = 2
  try {
    await deviceCapabilityService.getCurrentPosition()
    assert(false, 'Debe fallar con posición no disponible')
  } catch (err: any) {
    assert(err.message.includes('POSITION_UNAVAILABLE'), 'Error clasificado como POSITION_UNAVAILABLE')
    const msg = deviceCapabilityService.mapHumanMessage('POSITION_UNAVAILABLE')
    assert(msg.includes('GPS esté encendido') || msg.includes('no pudimos'), 'Mensaje amigable de GPS no disponible')
  }

  // Error 3: Timeout
  mockErrorCode = 3
  try {
    await deviceCapabilityService.getCurrentPosition()
    assert(false, 'Debe fallar por timeout')
  } catch (err: any) {
    assert(err.message.includes('TIMEOUT'), 'Error clasificado como TIMEOUT')
  }

  // ==========================================
  // 6. Watch Lifecycle, Fan-out y Prevención de Duplicados
  // ==========================================
  console.log('\n[6/7] Verificando Ciclo de Vida de watchPosition y Prevención de Duplicados...')

  mockShouldFail = false
  mockAccuracy = 10
  mockTimestamp = Date.now()

  let subscriber1Updates = 0
  let subscriber2Updates = 0

  const sub1 = (p: NormalizedGeolocationPosition) => {
    subscriber1Updates++
  }
  const sub2 = (p: NormalizedGeolocationPosition) => {
    subscriber2Updates++
  }

  // Registrar primer listener
  const unsub1 = deviceCapabilityService.startWatch(sub1)
  assert(activeBrowserWatchers.size === 1, 'Inició exactamente 1 watcher en el navegador')

  // Registrar segundo listener: NO debe crear otro watcher en el navegador
  const unsub2 = deviceCapabilityService.startWatch(sub2)
  assert(activeBrowserWatchers.size === 1, 'Mantiene 1 solo watcher en el navegador (evitó duplicación)')

  // Desuscribir sub1: el watcher del navegador debe permanecer activo porque sub2 sigue escuchando
  unsub1()
  assert(activeBrowserWatchers.size === 1, 'Watcher sigue vivo porque aún existe un suscriptor')

  // Desuscribir sub2: como ya no hay suscriptores, debe limpiar clearWatch
  unsub2()
  assert(activeBrowserWatchers.size === 0, 'Watcher del navegador limpiado al desuscribir todos')
  assert(deviceCapabilityService.getCurrentRuntimeState() === 'IDLE', 'Estado regresa a IDLE')

  // ==========================================
  // 7. Contexto Inseguro (HTTP Remoto)
  // ==========================================
  console.log('\n[7/7] Verificando Detección de Contexto Inseguro...')

  ;(global as any).window.isSecureContext = false
  ;(global as any).window.location = { protocol: 'http:', hostname: '192.168.0.11' }

  assert(deviceCapabilityService.isSecureContext() === false, 'Detecta contexto inseguro sobre HTTP remoto')

  try {
    await deviceCapabilityService.getCurrentPosition()
    assert(false, 'Debe rechazar en contexto inseguro')
  } catch (err: any) {
    assert(err.message.includes('INSECURE_CONTEXT'), 'Rechazado con INSECURE_CONTEXT')
  }

  console.log('\n=== TODAS LAS PRUEBAS DE DEVICE CAPABILITY & GEOLOCATION PASARON EXITOSAMENTE ===\n')
})().catch(e => {
  console.error('Fatal test error:', e)
  process.exit(1)
})
