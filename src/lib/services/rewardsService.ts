export type RewardBranch = 'SOCIO' | 'NEGOCIO' | 'PARTNER' | 'CLUB'

export interface RewardItem {
  id: string
  branch: RewardBranch
  title: string
  pointsCost: number
  realCostMxn: number
  description: string
  sponsor: string
  financing: 'CENTRAL_50_FRANCHISE_50' | 'MERCHANT_100' | 'CENTRAL_100' | 'FRANCHISE_100'
  badge: string
  availableStock: number
}

export interface UserPointsHistory {
  id: string
  userId: string
  role: 'DRIVER' | 'MERCHANT' | 'CUSTOMER' | 'BASE'
  points: number
  reason: string
  timestamp: string
  balanceAfter: number
}

export const REWARD_CATALOG: RewardItem[] = [
  // 1. VAMO SOCIO (Para Repartidores)
  {
    id: 'rew-socio-1',
    branch: 'SOCIO',
    title: 'Cambio de Aceite & Filtro Gratis (Taller Aliado)',
    pointsCost: 450,
    realCostMxn: 180,
    description: 'Servicio completo de cambio de aceite mineral/semisintético y filtro en talleres afiliados VAMO.',
    sponsor: 'Taller MotoExpress Centro',
    financing: 'CENTRAL_50_FRANCHISE_50',
    badge: 'MANTENIMIENTO 🛠️',
    availableStock: 25
  },
  {
    id: 'rew-socio-2',
    branch: 'SOCIO',
    title: '50% Descuento en Cuota Semanal VAMO',
    pointsCost: 300,
    realCostMxn: 25,
    description: 'Aplica un descuento directo del 50% en tu cuota operativa semanal.',
    sponsor: 'VAMO Franquicia',
    financing: 'FRANCHISE_100',
    badge: 'CUOTA ⚡',
    availableStock: 100
  },
  {
    id: 'rew-socio-3',
    branch: 'SOCIO',
    title: 'Impermeable Térmico Reflejante VAMO Oficial',
    pointsCost: 800,
    realCostMxn: 350,
    description: 'Traje impermeable de alta resistencia con vivos reflejantes neón para temporada de lluvia.',
    sponsor: 'VAMO Central',
    financing: 'CENTRAL_100',
    badge: 'EQUIPAMIENTO 🌧️',
    availableStock: 12
  },

  // 2. VAMO NEGOCIO (Para Comercios y Restaurantes)
  {
    id: 'rew-neg-1',
    branch: 'NEGOCIO',
    title: 'Posición Destacada Top 1 en Radar Urbano (7 Días)',
    pointsCost: 600,
    realCostMxn: 300,
    description: 'Tu local aparecerá con insignia dorada en la primera posición del mapa de clientes durante 1 semana.',
    sponsor: 'VAMO Marketing',
    financing: 'CENTRAL_50_FRANCHISE_50',
    badge: 'VISIBILIDAD 🌟',
    availableStock: 5
  },
  {
    id: 'rew-neg-2',
    branch: 'NEGOCIO',
    title: 'Paquete 500 Flyers Impresos con Código QR',
    pointsCost: 900,
    realCostMxn: 420,
    description: 'Material publicitario impreso a todo color para colocar en mostrador y empaques.',
    sponsor: 'Imprenta Regional Aliada',
    financing: 'CENTRAL_50_FRANCHISE_50',
    badge: 'PUBLICIDAD 📄',
    availableStock: 10
  },

  // 3. VAMO PARTNER (Para Franquiciatarios y Bases)
  {
    id: 'rew-partner-1',
    branch: 'PARTNER',
    title: 'Bono de Aceleración de Flota (+10 Motos Nuevas)',
    pointsCost: 2500,
    realCostMxn: 1500,
    description: 'Subsidio directo para reclutamiento y kit de bienvenida de 10 nuevos repartidores.',
    sponsor: 'VAMO Central Expansión',
    financing: 'CENTRAL_100',
    badge: 'EXPANSIÓN 🚀',
    availableStock: 3
  },

  // 4. VAMO CLUB (Para Clientes Finales)
  {
    id: 'rew-club-1',
    branch: 'CLUB',
    title: 'Envío Gratis en tu Próximo Pedido',
    pointsCost: 150,
    realCostMxn: 35,
    description: 'Cupón aplicable en cualquier pedido directo o de comida.',
    sponsor: 'VAMO Club',
    financing: 'CENTRAL_50_FRANCHISE_50',
    badge: 'FLETE $0 🛵',
    availableStock: 500
  },
  {
    id: 'rew-club-2',
    branch: 'CLUB',
    title: 'Combo Gratis: Torta Especial + Refresco',
    pointsCost: 500,
    realCostMxn: 120,
    description: 'Canjeable en Tortería El Pariente y locales participantes.',
    sponsor: 'Tortería El Pariente',
    financing: 'MERCHANT_100',
    badge: 'COMBO 🍔',
    availableStock: 30
  }
]

export class RewardsService {
  static getRewardsByBranch(branch: RewardBranch): RewardItem[] {
    return REWARD_CATALOG.filter(r => r.branch === branch)
  }

  static async redeemReward(rewardId: string, userId: string, userPoints: number): Promise<{ success: boolean; message: string; remainingPoints: number }> {
    const reward = REWARD_CATALOG.find(r => r.id === rewardId)
    if (!reward) {
      return { success: false, message: 'Recompensa no encontrada', remainingPoints: userPoints }
    }

    if (userPoints < reward.pointsCost) {
      return { 
        success: false, 
        message: `Puntos insuficientes. Tienes ${userPoints} pts y necesitas ${reward.pointsCost} pts.`, 
        remainingPoints: userPoints 
      }
    }

    const remaining = userPoints - reward.pointsCost
    return {
      success: true,
      message: `¡Canje exitoso! Has obtenido: "${reward.title}". Se descontaron ${reward.pointsCost} puntos.`,
      remainingPoints: remaining
    }
  }
}
