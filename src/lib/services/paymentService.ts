'use client'

// paymentService.ts — Cliente frontend para el sistema de pagos VAMO
// Llama a las API Routes del servidor (nunca directamente a Conekta)

export type PaymentMethod = 'card' | 'oxxo_cash' | 'spei' | 'cash'

export interface CreatePaymentParams {
  orderId: string
  amount: number
  paymentMethod: PaymentMethod
  customerName: string
  customerEmail: string
  customerPhone: string
  description: string
}

export interface PaymentResult {
  success: boolean
  paymentMethod: PaymentMethod
  gatewayOrderId?: string
  // Tarjeta
  checkoutUrl?: string
  checkoutId?: string
  // OXXO
  reference?: string
  barcode?: string
  barcodeUrl?: string
  expiresAt?: number
  store?: string
  // SPEI
  clabe?: string
  bank?: string
  // Efectivo
  redirectUrl?: string
  message?: string
  error?: string
}

export const PaymentService = {
  /**
   * Crea una intención de pago en Conekta a través del servidor seguro.
   * Devuelve la URL de checkout, referencia OXXO o CLABE SPEI según el método.
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      if (!res.ok) {
        const error = await res.json()
        return { success: false, paymentMethod: params.paymentMethod, error: error.error || 'Error al procesar pago' }
      }

      const data = await res.json()
      return data as PaymentResult

    } catch (error) {
      console.error('[PaymentService] Error de red:', error)
      return {
        success: false,
        paymentMethod: params.paymentMethod,
        error: 'Sin conexión. Verifica tu internet e intenta de nuevo.'
      }
    }
  },

  /**
   * Obtiene el estado actual de un payment_intent desde Supabase Realtime
   * (el webhook de Conekta actualiza este registro automáticamente)
   */
  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      card: '💳 Tarjeta de Crédito / Débito',
      oxxo_cash: '🏪 Pago en OXXO',
      spei: '🏦 Transferencia SPEI',
      cash: '💵 Efectivo al Repartidor'
    }
    return labels[method]
  },

  /**
   * Formatea los segundos epoch de expiración como texto legible
   */
  formatExpiry(epochSeconds: number): string {
    const date = new Date(epochSeconds * 1000)
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}
