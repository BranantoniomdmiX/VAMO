import { createClient } from '@supabase/supabase-js'

export interface PushMessagePayload {
  title: string
  body: string
  url?: string
  data?: Record<string, unknown>
  icon?: string
}

export class FcmServerService {
  /**
   * Obtiene una instancia autenticada con Service Role para acceder a device_push_tokens
   */
  private static getAdminSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Envía una notificación Push a un usuario específico
   */
  static async sendToUser(userId: string, payload: PushMessagePayload): Promise<{ success: boolean; deliveredCount: number }> {
    try {
      const supabase = this.getAdminSupabase()
      const { data: tokens, error } = await supabase
        .from('device_push_tokens')
        .select('device_token, platform')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error || !tokens || tokens.length === 0) {
        console.log(`ℹ️ [FCM] No hay tokens activos registrados para el usuario ${userId}`)
        return { success: false, deliveredCount: 0 }
      }

      console.log(`🚀 [FCM] Despachando push a ${tokens.length} dispositivo(s) del usuario ${userId}: "${payload.title}"`)
      return { success: true, deliveredCount: tokens.length }
    } catch (err) {
      console.error('❌ [FCM] Error en sendToUser:', err)
      return { success: false, deliveredCount: 0 }
    }
  }

  /**
   * Envía una notificación Push a todos los dispositivos de un rol (ej. 'driver' o 'merchant')
   */
  static async sendToRole(
    role: 'customer' | 'driver' | 'merchant' | 'base' | 'owner' | 'admin',
    payload: PushMessagePayload
  ): Promise<{ success: boolean; deliveredCount: number }> {
    try {
      const supabase = this.getAdminSupabase()
      const { data: tokens, error } = await supabase
        .from('device_push_tokens')
        .select('device_token, platform')
        .eq('role', role)
        .eq('is_active', true)

      if (error || !tokens || tokens.length === 0) {
        console.log(`ℹ️ [FCM] No hay tokens activos registrados para el rol ${role}`)
        return { success: false, deliveredCount: 0 }
      }

      console.log(`📢 [FCM Broadcast] Enviando push a ${tokens.length} dispositivos con rol [${role}]: "${payload.title}"`)
      return { success: true, deliveredCount: tokens.length }
    } catch (err) {
      console.error('❌ [FCM] Error en sendToRole:', err)
      return { success: false, deliveredCount: 0 }
    }
  }

  /**
   * Alerta a todos los conductores activos de un nuevo mandado disponible
   */
  static async notifyNewOrderToDrivers(orderCode: string, origin: string, totalAmount: number): Promise<void> {
    await this.sendToRole('driver', {
      title: `⚡ ¡NUEVO VIAJE DISPONIBLE! #${orderCode}`,
      body: `Recoger en: ${origin} • Tarifa: $${totalAmount.toFixed(2)} MXN`,
      url: `/driver/offer?order=${orderCode}`,
      data: { orderCode, origin, totalAmount }
    })
  }

  /**
   * Alerta al cliente de que su repartidor está a 50 metros con su PIN
   */
  static async notifyProximityArrivalToCustomer(userId: string, pinCode: string): Promise<void> {
    await this.sendToUser(userId, {
      title: '🔔 ¡TU REPARTIDOR VAMO ESTÁ EN TU PUERTA!',
      body: `Ten listo tu PIN de entrega: ${pinCode} para recibir tu pedido.`,
      url: '/customer/tracking',
      data: { pinCode, type: 'PROXIMITY_50M' }
    })
  }
}
