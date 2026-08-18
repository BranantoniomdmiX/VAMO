'use client'

export type SocioVamoTier = 'PLATA' | 'ORO' | 'PLATINO' | 'DIAMANTE'

export interface SocioVamoProfile {
  driverId: string
  driverName: string
  totalTrips: number
  rating: number
  currentTier: SocioVamoTier
  nextTier: SocioVamoTier | null
  tripsToNextTier: number
  progressPercent: number
  surgeBonusPercent: number
  weeklyFeeDiscountPercent: number
  priorityLevel: 'Estándar' | 'Alta' | 'Prioritaria' | 'Máxima Inmediata (Dios)'
  benefits: string[]
}

export class GamificationService {
  /**
   * Calcula el perfil y nivel de gamificación Socio VAMO en base a viajes completados y calificación
   */
  static getSocioProfile(
    totalTrips: number = 42,
    rating: number = 4.9,
    driverId: string = 'driver-carlos-1',
    driverName: string = 'Carlos M.'
  ): SocioVamoProfile {
    let currentTier: SocioVamoTier = 'PLATA'
    let nextTier: SocioVamoTier | null = 'ORO'
    let tripsToNextTier = 30 - totalTrips
    let progressPercent = Math.min(100, Math.round((totalTrips / 30) * 100))
    let surgeBonusPercent = 0
    let weeklyFeeDiscountPercent = 0
    let priorityLevel: SocioVamoProfile['priorityLevel'] = 'Estándar'
    let benefits: string[] = [
      'Acceso a viajes estándar en la ciudad',
      '0% comisión por distancia recorrida'
    ]

    if (totalTrips >= 150 && rating >= 4.8) {
      currentTier = 'DIAMANTE'
      nextTier = null
      tripsToNextTier = 0
      progressPercent = 100
      surgeBonusPercent = 15
      weeklyFeeDiscountPercent = 100 // Condonación total de cuota semanal
      priorityLevel = 'Máxima Inmediata (Dios)'
      benefits = [
        '👑 Condonación del 100% de la cuota semanal ($0 MXN/semana)',
        '⚡ Prioridad Máxima Inmediata en el algoritmo de despacho',
        '🔥 +15% de bono en tarifa dinámica durante horas pico',
        '🛠️ Vale de afinación y cambio de aceite gratis al mes'
      ]
    } else if (totalTrips >= 80 && rating >= 4.7) {
      currentTier = 'PLATINO'
      nextTier = 'DIAMANTE'
      tripsToNextTier = 150 - totalTrips
      progressPercent = Math.min(100, Math.round(((totalTrips - 80) / 70) * 100))
      surgeBonusPercent = 10
      weeklyFeeDiscountPercent = 50
      priorityLevel = 'Prioritaria'
      benefits = [
        '🎟️ 50% de descuento en cuota semanal ($25 MXN/semana)',
        '⚡ Despacho prioritario en restaurantes de alta demanda',
        '🔥 +10% de bono en tarifa dinámica durante horas pico',
        '🔧 Descuento del 30% en talleres mecánicos afiliados'
      ]
    } else if (totalTrips >= 30 && rating >= 4.5) {
      currentTier = 'ORO'
      nextTier = 'PLATINO'
      tripsToNextTier = 80 - totalTrips
      progressPercent = Math.min(100, Math.round(((totalTrips - 30) / 50) * 100))
      surgeBonusPercent = 5
      weeklyFeeDiscountPercent = 0
      priorityLevel = 'Alta'
      benefits = [
        '⭐ Asignación preferencial frente a conductores nivel Plata',
        '🔥 +5% de bono en tarifa dinámica durante fines de semana',
        '🎒 Kit de stickers y personalización neón VAMO'
      ]
    }

    return {
      driverId,
      driverName,
      totalTrips,
      rating,
      currentTier,
      nextTier,
      tripsToNextTier: Math.max(0, tripsToNextTier),
      progressPercent,
      surgeBonusPercent,
      weeklyFeeDiscountPercent,
      priorityLevel,
      benefits
    }
  }
}
