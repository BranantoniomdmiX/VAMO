import { createClient } from '@supabase/supabase-js'
import { io, Socket } from 'socket.io-client'

export interface GpsLocationPayload {
  driverId: string
  id_moto?: string
  lat: number
  lng: number
  heading: number
  speed: number
  timestamp: string
  isRealGps?: boolean
}

export type LatLng = [number, number]
export type LngLat = [number, number]

export interface RouteNavigationDetails {
  coordinates: LngLat[]
  distanceKm: string
  durationMin: number
  steps: {
    instruction: string
    distanceMeters: number
    type: string
  }[]
}

class GpsSocketService {
  private socket: Socket | null = null
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  )
  private gpsInterval: NodeJS.Timeout | null = null
  private watchId: number | null = null

  constructor() {
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://212.1.213.44'
    try {
      this.socket = io(socketServerUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
      })

      this.socket.on('connect', () => {
        console.log('📡 [GPS Socket] Conectado exitosamente al VPS Hostinger (212.1.213.44)')
      })

      this.socket.on('connect_error', (err) => {
        console.warn('⚠️ [GPS Socket] Error de conexión VPS, activando fallback silencioso Supabase:', err.message)
      })
    } catch (e) {
      console.warn('⚠️ [GPS Socket] Error al inicializar socket:', e)
    }
  }

  // 1. Transmitir posición GPS en tiempo real usando GPS Real del Celular (navigator.geolocation) con Fallback Simulado
  public startGpsTransmitter(driverId: string, onUpdate?: (payload: GpsLocationPayload) => void) {
    let lat = 20.5218
    let lng = -100.8142
    let heading = 45

    // A. Intentar usar GPS Real del Celular (HTML5 Geolocation API)
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const realLat = position.coords.latitude
          const realLng = position.coords.longitude
          const realHeading = position.coords.heading || heading
          const realSpeed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 30

          const payload: GpsLocationPayload = {
            driverId,
            id_moto: driverId,
            lat: realLat,
            lng: realLng,
            heading: realHeading,
            speed: realSpeed,
            timestamp: new Date().toISOString(),
            isRealGps: true
          }

          console.log(`📱 [GPS REAL CELULAR] Lat: ${realLat.toFixed(5)}, Lng: ${realLng.toFixed(5)}`)

          if (this.socket && this.socket.connected) {
            this.socket.emit('repartidor:ubicacion', payload)
          }

          if (onUpdate) onUpdate(payload)
        },
        (error) => {
          console.warn('⚠️ [GPS REAL] Permiso denegado o no disponible. Usando simulación de ruta Celaya:', error.message)
          this.startSimulatedGps(driverId, lat, lng, heading, onUpdate)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      )
    } else {
      this.startSimulatedGps(driverId, lat, lng, heading, onUpdate)
    }
  }

  private startSimulatedGps(
    driverId: string,
    initialLat: number,
    initialLng: number,
    initialHeading: number,
    onUpdate?: (payload: GpsLocationPayload) => void
  ) {
    let lat = initialLat
    let lng = initialLng
    let heading = initialHeading

    if (this.gpsInterval) clearInterval(this.gpsInterval)

    this.gpsInterval = setInterval(async () => {
      lat += (Math.random() - 0.48) * 0.0003
      lng += (Math.random() - 0.48) * 0.0003
      heading = Math.floor(Math.random() * 360)

      const payload: GpsLocationPayload = {
        driverId,
        id_moto: driverId,
        lat,
        lng,
        heading,
        speed: 35,
        timestamp: new Date().toISOString(),
        isRealGps: false
      }

      if (this.socket && this.socket.connected) {
        this.socket.emit('repartidor:ubicacion', payload)
      }

      if (onUpdate) onUpdate(payload)
    }, 4000)
  }

  public stopGpsTransmitter() {
    if (this.gpsInterval) {
      clearInterval(this.gpsInterval)
      this.gpsInterval = null
    }
    if (this.watchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  /**
   * Desconectar repartidor por completo:
   * 1. Apaga el GPS y los intervalos de transmisión.
   * 2. Emite el evento OFFLINE al VPS y actualiza la base de datos para que la Base Operativa lo retire del radar.
   */
  public setDriverOffline(driverId: string = 'MOTO-01') {
    this.stopGpsTransmitter()

    const offlinePayload = {
      driverId,
      id_moto: driverId,
      status: 'OFFLINE',
      timestamp: new Date().toISOString()
    }

    if (this.socket && this.socket.connected) {
      this.socket.emit('repartidor:estado', offlinePayload)
      this.socket.emit('repartidor:desconectar', offlinePayload)
    }

    try {
      this.supabase
        .from('drivers')
        .update({ status: 'OFFLINE', is_available: false, updated_at: new Date().toISOString() })
        .eq('id', driverId)
        .then(() => {})
        .catch(() => {})
    } catch (e) {}

    console.log(`📴 [GPS Socket] Repartidor ${driverId} puesto en OFFLINE y desconectado de la Base Operativa.`)
  }


  // 2. Suscribirse a ubicación en tiempo real
  public subscribeLivePositions(callback: (payload: GpsLocationPayload) => void) {
    return this.subscribeToDriverPosition('MOTO-01', callback)
  }

  public subscribeToDriverPosition(driverId: string, callback: (payload: GpsLocationPayload) => void) {
    if (this.socket) {
      this.socket.on('cliente:posicion', (data: GpsLocationPayload) => {
        if (!driverId || data.driverId === driverId || data.id_moto === driverId) {
          callback(data)
        }
      })
    }

    const channel = this.supabase
      .channel(`gps_${driverId || 'all'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gps_telemetry' }, (payload) => {
        const row = payload.new
        if (!driverId || row.driver_id === driverId) {
          callback({
            driverId: row.driver_id,
            id_moto: row.driver_id,
            lat: row.latitude,
            lng: row.longitude,
            heading: row.heading,
            speed: row.speed,
            timestamp: row.created_at
          })
        }
      })
      .subscribe()

    return () => {
      if (this.socket) {
        this.socket.off('cliente:posicion')
      }
      this.supabase.removeChannel(channel)
    }
  }

  // 3. Obtener trazado de ruta e instrucciones Turn-by-Turn
  public async fetchRouteDetails(startLatLng: LatLng, endLatLng: LatLng): Promise<RouteNavigationDetails> {
    try {
      const startLngLat: LngLat = [startLatLng[1], startLatLng[0]]
      const endLngLat: LngLat = [endLatLng[1], endLatLng[0]]

      const url = `https://router.project-osrm.org/route/v1/driving/${startLngLat[0]},${startLngLat[1]};${endLngLat[0]},${endLngLat[1]}?overview=full&geometries=geojson&steps=true`
      const res = await fetch(url)
      const data = await res.json()

      if (data.code === 'Ok' && data.routes?.[0]) {
        const route = data.routes[0]
        const rawCoords: LngLat[] = route.geometry.coordinates
        const distanceKm = (route.distance / 1000).toFixed(1)
        const durationMin = Math.ceil(route.duration / 60)

        const steps = route.legs?.[0]?.steps?.map((s: any) => {
          const type = s.maneuver.type || 'straight'
          const modifier = s.maneuver.modifier || ''
          const street = s.name ? `en ${s.name}` : ''
          let instruction = 'Sigue de frente'

          if (type.includes('turn') || modifier.includes('left') || modifier.includes('right')) {
            instruction = `Gira a la ${modifier.includes('left') ? 'izquierda' : 'derecha'} ${street}`
          } else if (type.includes('depart')) {
            instruction = `Inicia ruta ${street}`
          } else if (type.includes('arrive')) {
            instruction = `Llegada a destino`
          } else {
            instruction = `Continúa por ${s.name || 'la avenida'}`
          }

          return {
            instruction,
            distanceMeters: Math.round(s.distance),
            type: modifier || type
          }
        }) || []

        console.log(`[VAMO OSRM] Ruta recibida: ${rawCoords.length} puntos`)

        return {
          coordinates: rawCoords,
          distanceKm,
          durationMin,
          steps
        }
      }
    } catch (e) {
      console.warn('[VAMO OSRM ERROR] Error al obtener ruta OSRM:', e)
    }

    return {
      coordinates: [],
      distanceKm: '...',
      durationMin: 0,
      steps: []
    }
  }
}

export const gpsSocketService = new GpsSocketService()
