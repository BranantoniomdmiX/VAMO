export interface ReferralBonus {
  id: string
  code: string // ej. RIDER-CARLOS-77, CLI-MARIA-22, BIZ-PARIENTE-01
  referrerType: 'DRIVER' | 'CUSTOMER' | 'MERCHANT'
  referrerId: string
  referrerName: string
  rewardPoints: number
  rewardCashMxn: number
  totalReferredCount: number
  activeBonusesMxn: number
}

export interface ActivationKey {
  key: string // ej. "CEL-4982"
  franchiseId: string
  franchiseName: string
  role: 'DRIVER' | 'OPERATOR' | 'MERCHANT'
  createdBy: string
  createdAt: string
  isUsed: boolean
  usedBy?: string
}

export class AuthService {
  private static ROLE_KEY = 'vamo_active_user_role'
  private static REFERRAL_CODES_KEY = 'vamo_referral_directory'
  private static ACTIVATION_KEYS_KEY = 'vamo_activation_keys'

  // Persistencia de rol en dispositivo
  static setActiveRole(role: 'CUSTOMER' | 'DRIVER' | 'MERCHANT' | 'OWNER' | 'BASE' | 'ADMIN') {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ROLE_KEY, role)
    }
  }

  static getActiveRole(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ROLE_KEY)
    }
    return null
  }

  static clearActiveRole() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ROLE_KEY)
    }
  }

  // Generador de Llaves de Activación para el Socio Comercial
  static generateActivationKey(franchiseId: string, franchiseName: string, role: 'DRIVER' | 'OPERATOR' | 'MERCHANT', createdBy: string): ActivationKey {
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const prefix = franchiseId.slice(0, 3).toUpperCase()
    const newKey: ActivationKey = {
      key: `${prefix}-${randomDigits}`,
      franchiseId,
      franchiseName,
      role,
      createdBy,
      createdAt: new Date().toISOString(),
      isUsed: false
    }

    if (typeof window !== 'undefined') {
      const existing = this.getActivationKeys()
      localStorage.setItem(this.ACTIVATION_KEYS_KEY, JSON.stringify([newKey, ...existing]))
    }
    return newKey
  }

  static getActivationKeys(): ActivationKey[] {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.ACTIVATION_KEYS_KEY)
      if (data) {
        try { return JSON.parse(data) } catch {}
      }
    }
    return [
      {
        key: 'CEL-4982',
        franchiseId: 'frq-celaya-1',
        franchiseName: 'Plaza Celaya Centro',
        role: 'DRIVER',
        createdBy: 'Socio Comercial Celaya',
        createdAt: new Date().toISOString(),
        isUsed: false
      },
      {
        key: 'CEL-7120',
        franchiseId: 'frq-celaya-1',
        franchiseName: 'Plaza Celaya Centro',
        role: 'OPERATOR',
        createdBy: 'Socio Comercial Celaya',
        createdAt: new Date().toISOString(),
        isUsed: true,
        usedBy: 'Operador Turno Matutino'
      }
    ]
  }

  // Validación de Llave de Entrada
  static validateKey(key: string): { valid: boolean; message: string; keyData?: ActivationKey } {
    const keys = this.getActivationKeys()
    const found = keys.find(k => k.key.trim().toUpperCase() === key.trim().toUpperCase())
    if (!found) {
      return { valid: false, message: 'Llave de activación no encontrada. Pídela a tu Socio Comercial.' }
    }
    if (found.isUsed) {
      return { valid: false, message: 'Esta llave ya fue utilizada previamente.' }
    }
    return { valid: true, message: `¡Llave válida! Acceso concedido a ${found.franchiseName}`, keyData: found }
  }

  // Sistema de Bonos por Referido (Chofer recomienda Local / Cliente recomienda Amigo)
  static generateReferralCode(userType: 'DRIVER' | 'CUSTOMER', userId: string, userName: string): string {
    const cleanName = userName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6)
    const randomSuffix = Math.floor(10 + Math.random() * 90)
    return `${userType === 'DRIVER' ? 'MOTO' : 'VAMO'}-${cleanName}-${randomSuffix}`
  }

  static getReferralStats(userCode: string) {
    return {
      code: userCode,
      totalReferred: 8,
      merchantsReferred: 2, // 2 locales afiliados por recomendación
      pointsEarned: 240, // +30 pts por afiliado
      cashBonusMxn: 300.00, // Bono en efectivo
      ratingScore: 4.9
    }
  }
}
