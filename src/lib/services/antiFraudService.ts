'use client'

export interface OrderPinRecord {
  orderId: string
  pin: string
  destinationLat: number
  destinationLng: number
  generatedAt: string
  isVerified: boolean
}

export interface FleetOverflowRecord {
  orderId: string
  primaryFleetId: string
  primaryFleetName: string
  overflowFleetId: string
  overflowFleetName: string
  elapsedSeconds: number
  overflowThresholdSeconds: number
  compensationFeePercent: number
  status: 'PENDING' | 'OVERFLOWED' | 'ACCEPTED'
  timestamp: string
}

export const MAX_PIN_DISTANCE_METERS = 30 // Geofence de seguridad: 30 metros
export const OVERFLOW_TIMEOUT_SECONDS = 180 // 3 minutos para desborde entre flotas
export const OVERFLOW_COMPENSATION_PERCENT = 3.0 // 3% de cuota de compensación

export class AntiFraudService {
  /**
   * Cálculo de distancia geodésica mediante la fórmula de Haversine en metros
   */
  static calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000 // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }

  /**
   * Valida si el conductor está a menos de 30 metros del destino del cliente para habilitar el modal de PIN
   */
  static checkPinGeofence(
    driverLat: number,
    driverLng: number,
    destLat: number = 20.5260,
    destLng: number = -100.8090,
    maxDistanceMeters: number = MAX_PIN_DISTANCE_METERS
  ): { isAllowed: boolean; distanceMeters: number; message: string } {
    const distanceMeters = this.calculateDistanceMeters(driverLat, driverLng, destLat, destLng)
    const isAllowed = distanceMeters <= maxDistanceMeters

    return {
      isAllowed,
      distanceMeters,
      message: isAllowed
        ? `🟢 En rango de entrega (${distanceMeters} m). Ingreso de PIN habilitado.`
        : `🔴 Estás a ${distanceMeters} metros. Debes estar a menos de ${maxDistanceMeters}m del domicilio para ingresar el PIN.`
    }
  }

  /**
   * Genera o consulta el PIN OTP de 4 dígitos de una orden
   */
  static getOrderPin(orderId: string): string {
    if (typeof window === 'undefined') return ''
    const storageKey = `vamo_order_pin_${orderId}`
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) return stored
      // Generar PIN aleatorio seguro de 4 dígitos
      const newPin = Math.floor(1000 + Math.random() * 9000).toString()
      localStorage.setItem(storageKey, newPin)
      return newPin
    } catch {
      return ''
    }
  }

  /**
   * Valida si el PIN introducido por el chofer coincide con el de la orden
   */
  static verifyOrderPin(orderId: string, enteredPin: string): boolean {
    const expectedPin = this.getOrderPin(orderId)
    return enteredPin.trim() === expectedPin.trim()
  }

  /**
   * Valida el PIN directamente contra el endpoint atómico de backend y dispara la liquidación contable
   */
  static async verifyPinAtomic(params: {
    orderId: string
    pin?: string
    photoUrl?: string
    lat?: number
    lng?: number
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await fetch('/api/dispatch/pod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      return await res.json()
    } catch (e: any) {
      return { success: false, message: e.message || 'Error al verificar el PIN con el servidor.' }
    }
  }

  /**
   * Motor de Desborde Inteligente entre Flotas (3 minutos -> Flota vecina)
   */
  static evaluateOrderOverflow(
    orderId: string,
    elapsedSeconds: number,
    primaryFleetName: string = 'Flota Centro Titular',
    overflowFleetName: string = 'Flota Galery Norte'
  ): FleetOverflowRecord {
    const shouldOverflow = elapsedSeconds >= OVERFLOW_TIMEOUT_SECONDS

    return {
      orderId,
      primaryFleetId: 'fleet-central-1',
      primaryFleetName,
      overflowFleetId: 'fleet-north-2',
      overflowFleetName,
      elapsedSeconds,
      overflowThresholdSeconds: OVERFLOW_TIMEOUT_SECONDS,
      compensationFeePercent: OVERFLOW_COMPENSATION_PERCENT,
      status: shouldOverflow ? 'OVERFLOWED' : 'PENDING',
      timestamp: new Date().toISOString()
    }
  }
}
