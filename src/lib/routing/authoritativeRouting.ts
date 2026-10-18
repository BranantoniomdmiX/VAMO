// src/lib/routing/authoritativeRouting.ts
// 🛡️ MOTOR DE ROUTING AUTORITATIVO SERVER-SIDE (VAMO OLA A)
//
// REGLA CANÓNICA:
// 1. Haversine NO es distancia autoritativa para tarificación ni liquidación financiera.
// 2. No se acepta distancia ni duración enviadas por el browser como verdad operativa.
// 3. El proveedor autoritativo consulta el endpoint configurado en el entorno (ROUTING_BASE_URL).
// 4. Si el proveedor no está configurado o falla, devuelve ROUTE_REQUIRED y NO permite crear la orden despachable.

export interface RoutingPoint {
  lat: number
  lng: number
}

export interface AuthoritativeRouteResult {
  distanceKm: number
  durationMinutes: number
  geometry?: unknown
  provider: string
}

export interface AuthoritativeRoutingProvider {
  calculateRoute(
    origin: RoutingPoint,
    destination: RoutingPoint,
    waypoints?: RoutingPoint[]
  ): Promise<AuthoritativeRouteResult | null>
}

class EnvironmentOsrmRoutingProvider implements AuthoritativeRoutingProvider {
  private baseUrl: string | null

  constructor() {
    // Lee exclusivamente la URL base del entorno
    this.baseUrl = process.env.ROUTING_BASE_URL ? process.env.ROUTING_BASE_URL.replace(/\/+$/, '') : null
  }

  async calculateRoute(
    origin: RoutingPoint,
    destination: RoutingPoint,
    waypoints: RoutingPoint[] = []
  ): Promise<AuthoritativeRouteResult | null> {
    if (!this.baseUrl) {
      console.warn('🚨 [AuthoritativeRoutingProvider]: ROUTING_BASE_URL no está configurado en el entorno.')
      return null
    }

    try {
      // Coordenadas en formato OSRM: lng,lat;lng,lat
      const allPoints = [origin, ...waypoints, destination]
      const coordString = allPoints.map(p => `${p.lng},${p.lat}`).join(';')
      const url = `${this.baseUrl}/route/v1/driving/${coordString}?overview=false&steps=false`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`🚨 [AuthoritativeRoutingProvider]: Error HTTP del motor de routing (${response.status})`)
        return null
      }

      const data = await response.json()
      if (!data || data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        console.error('🚨 [AuthoritativeRoutingProvider]: El motor de routing no devolvió rutas válidas:', data?.code)
        return null
      }

      const primaryRoute = data.routes[0]
      const distanceMeters = primaryRoute.distance // metros
      const durationSeconds = primaryRoute.duration // segundos

      if (typeof distanceMeters !== 'number' || distanceMeters <= 0) {
        return null
      }

      const distanceKm = Math.max(0.1, Math.round((distanceMeters / 1000) * 100) / 100)
      const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60))

      return {
        distanceKm,
        durationMinutes,
        provider: 'OSRM_AUTHORITATIVE'
      }
    } catch (err) {
      console.error('🚨 [AuthoritativeRoutingProvider]: Excepción al consultar el motor de routing:', err)
      return null
    }
  }
}

// Instancia única del proveedor autoritativo
export const authoritativeRoutingProvider: AuthoritativeRoutingProvider = new EnvironmentOsrmRoutingProvider()
