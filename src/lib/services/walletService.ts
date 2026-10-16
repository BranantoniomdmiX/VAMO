'use client'

import { createClient } from '@/lib/supabase/client'

export interface WalletTransaction {
  id: string
  type: 'TOPUP' | 'ORDER_COD' | 'ORDER_DIGITAL' | 'WEEKLY_FEE' | 'BASE_SETTLEMENT' | 'FLEET_RENT'
  title: string
  date: string
  amount: number
  isPositive: boolean
  referenceId?: string
}

export interface UserWallet {
  id: string
  userId: string
  userRole: 'driver' | 'customer' | 'biz' | 'fleet_owner' | 'admin'
  balance: number // Saldo digital a favor (recargas / retiros)
  codBalance: number // Efectivo físico recolectado en viajes COD
  maxCodLimit: number // Límite máximo de retención ($1,500.00 MXN)
  weeklyFee: number // Cuota fija canónica de acceso ($100.00 MXN/semana: $50 Socio / $50 Master)
  negativeTolerance: number // Margen de saldo negativo (-$100.00 MXN)
  tier: 'PLATA' | 'ORO' | 'PLATINO' | 'DIAMANTE'
  status: 'ACTIVE' | 'COD_RESTRICTED' | 'SUSPENDED_DEBT'
  isCodBlocked: boolean
  lastSettlementAt?: string
}

export const MAX_COD_CASH = 1500.00
export const WEEKLY_FEE = 100.00
export const NEGATIVE_TOLERANCE = -100.00

// Almacén reactivo local con fallback para demo/desconexión
const LOCAL_STORAGE_KEY = 'vamo_driver_wallet'

function getInitialLocalWallet(driverId: string = 'driver'): UserWallet {
  if (typeof window === 'undefined') {
    return {
      id: `wallet-${driverId}`,
      userId: driverId,
      userRole: 'driver',
      balance: 0.00,
      codBalance: 0.00,
      maxCodLimit: MAX_COD_CASH,
      weeklyFee: WEEKLY_FEE,
      negativeTolerance: NEGATIVE_TOLERANCE,
      tier: 'PLATA',
      status: 'ACTIVE',
      isCodBlocked: false,
      lastSettlementAt: new Date().toISOString()
    }
  }

  try {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${driverId}`)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.warn('Error reading local wallet:', e)
  }

  const defaultWallet: UserWallet = {
    id: `wallet-${driverId}`,
    userId: driverId,
    userRole: 'driver',
    balance: 0.00,
    codBalance: 0.00,
    maxCodLimit: MAX_COD_CASH,
    weeklyFee: WEEKLY_FEE,
    negativeTolerance: NEGATIVE_TOLERANCE,
    tier: 'PLATA',
    status: 'ACTIVE',
    isCodBlocked: false,
    lastSettlementAt: new Date().toISOString()
  }

  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${driverId}`, JSON.stringify(defaultWallet))
  } catch (e) {}

  return defaultWallet
}

function saveLocalWallet(wallet: UserWallet) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${wallet.userId}`, JSON.stringify(wallet))
    } catch (e) {}
  }
}

export class WalletService {
  /**
   * Obtiene la billetera actual del conductor con validación reactiva de límites COD
   */
  static async getDriverWallet(driverId: string = 'driver-carlos-1'): Promise<UserWallet> {
    const wallet = getInitialLocalWallet(driverId)
    
    // Validar estado de retención COD
    wallet.isCodBlocked = wallet.codBalance >= wallet.maxCodLimit
    
    if (wallet.isCodBlocked) {
      wallet.status = 'COD_RESTRICTED'
    } else if (wallet.balance < wallet.negativeTolerance) {
      wallet.status = 'SUSPENDED_DEBT'
    } else {
      wallet.status = 'ACTIVE'
    }

    saveLocalWallet(wallet)
    return wallet
  }

  /**
   * Recarga exprés 1-Tap al saldo digital del conductor (+100, +200, +500)
   */
  static async topupBalance(amount: number, driverId: string = 'driver-carlos-1'): Promise<{ success: boolean; wallet: UserWallet }> {
    const wallet = await this.getDriverWallet(driverId)
    wallet.balance += amount

    // Si estaba suspendido por deuda y ahora cubre el saldo, reactivar
    if (wallet.balance >= wallet.negativeTolerance && wallet.status === 'SUSPENDED_DEBT') {
      wallet.status = wallet.isCodBlocked ? 'COD_RESTRICTED' : 'ACTIVE'
    }

    saveLocalWallet(wallet)
    this.addTransaction(driverId, {
      id: `topup-${Date.now()}`,
      type: 'TOPUP',
      title: 'Recarga Exprés de Saldo',
      date: 'Hace un momento',
      amount: amount,
      isPositive: true
    })

    return { success: true, wallet }
  }

  /**
   * Registra el cobro de una orden finalizada
   * Si es efectivo (CASH), suma al acumulador COD y evalúa el límite MAX_COD_CASH ($1,500 MXN)
   */
  static async recordOrderPayment(
    orderTotal: number,
    paymentMethod: 'CASH' | 'CARD' | 'WALLET',
    orderId: string = `#V-${Math.floor(1000 + Math.random() * 9000)}`,
    driverId: string = 'driver-carlos-1'
  ): Promise<{ success: boolean; wallet: UserWallet; isCodBlocked: boolean }> {
    const wallet = await this.getDriverWallet(driverId)

    if (paymentMethod === 'CASH') {
      wallet.codBalance += orderTotal
      
      // Regla estricta: Bloqueo reactivo de nuevos viajes en efectivo si alcanza o supera $1,500
      if (wallet.codBalance >= wallet.maxCodLimit) {
        wallet.isCodBlocked = true
        wallet.status = 'COD_RESTRICTED'
      }

      this.addTransaction(driverId, {
        id: `cod-${Date.now()}`,
        type: 'ORDER_COD',
        title: `Cobro en Efectivo ${orderId}`,
        date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs',
        amount: orderTotal,
        isPositive: true,
        referenceId: orderId
      })
    } else {
      // Si fue digital, la ganancia entra a su saldo a favor
      wallet.balance += orderTotal
      this.addTransaction(driverId, {
        id: `dig-${Date.now()}`,
        type: 'ORDER_DIGITAL',
        title: `Viaje Digital ${orderId}`,
        date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs',
        amount: orderTotal,
        isPositive: true,
        referenceId: orderId
      })
    }

    saveLocalWallet(wallet)
    return { success: true, wallet, isCodBlocked: wallet.isCodBlocked }
  }

  /**
   * Arqueo y Liquidación COD en la Base de Operaciones
   * Resetea el efectivo acumulado a $0, genera recibo digital y desbloquea asignaciones en efectivo
   */
  static async settleCodAtBase(
    driverId: string = 'driver-carlos-1',
    baseOperatorId: string = 'base-admin-1'
  ): Promise<{ success: boolean; receiptNumber: string; settledAmount: number; wallet: UserWallet }> {
    const wallet = await this.getDriverWallet(driverId)
    const settledAmount = wallet.codBalance
    const receiptNumber = `REC-${Math.floor(10000 + Math.random() * 90000)}`

    // Resetear balance de efectivo en mano
    wallet.codBalance = 0
    wallet.isCodBlocked = false
    wallet.status = wallet.balance >= wallet.negativeTolerance ? 'ACTIVE' : 'SUSPENDED_DEBT'
    wallet.lastSettlementAt = new Date().toISOString()

    saveLocalWallet(wallet)

    this.addTransaction(driverId, {
      id: `cut-${Date.now()}`,
      type: 'BASE_SETTLEMENT',
      title: `Corte de Caja en Base #${receiptNumber}`,
      date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs',
      amount: settledAmount,
      isPositive: false,
      referenceId: receiptNumber
    })

    return { success: true, receiptNumber, settledAmount, wallet }
  }

  /**
   * Descuento automático de la cuota semanal ($50.00 MXN)
   */
  static async deductWeeklyFee(driverId: string = 'driver-carlos-1'): Promise<{ success: boolean; wallet: UserWallet }> {
    const wallet = await this.getDriverWallet(driverId)
    wallet.balance -= wallet.weeklyFee

    if (wallet.balance < wallet.negativeTolerance) {
      wallet.status = 'SUSPENDED_DEBT'
    }

    saveLocalWallet(wallet)

    this.addTransaction(driverId, {
      id: `fee-${Date.now()}`,
      type: 'WEEKLY_FEE',
      title: 'Cuota Semanal de Acceso VAMO',
      date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs',
      amount: wallet.weeklyFee,
      isPositive: false
    })

    return { success: true, wallet }
  }

  /**
   * Valida si el chofer tiene permitido aceptar viajes con pago en efectivo
   */
  static canAcceptCashOrders(wallet: UserWallet): boolean {
    return !wallet.isCodBlocked && wallet.status !== 'SUSPENDED_DEBT'
  }

  /**
   * Ejecuta la liquidación financiera atómica de una orden con split 50/50
   */
  static async settleOrderAtomic(orderId: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await fetch('/api/wallet/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      return await res.json()
    } catch (e: any) {
      return { success: false, message: e.message || 'Error al conectar con el servidor.' }
    }
  }

  /**
   * Solicita un retiro SPEI formal con retención de saldo y validación de fondos
   */
  static async requestWithdrawalAtomic(params: { profileId: string; amount: number; clabe: string }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      return await res.json()
    } catch (e: any) {
      return { success: false, message: e.message || 'Error al procesar la solicitud de retiro.' }
    }
  }

  /**
   * Historial de transacciones de la billetera
   */
  static getTransactions(driverId: string = 'driver-carlos-1'): WalletTransaction[] {
    if (typeof window === 'undefined') return []
    try {
      const list = localStorage.getItem(`vamo_wallet_tx_${driverId}`)
      if (list) {
        return JSON.parse(list)
      }
    } catch (e) {}

    // Transacciones iniciales limpias
    return []
  }

  private static addTransaction(driverId: string, tx: WalletTransaction) {
    if (typeof window === 'undefined') return
    try {
      const current = this.getTransactions(driverId)
      const updated = [tx, ...current].slice(0, 30)
      localStorage.setItem(`vamo_wallet_tx_${driverId}`, JSON.stringify(updated))
    } catch (e) {}
  }
}
