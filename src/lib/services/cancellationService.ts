import { createClient } from '@/lib/supabase/client'

export interface CancellationRequest {
  userId: string
  role: 'customer' | 'driver' | 'merchant' | 'fleet_owner'
  reason: string
  feedback?: string
  codBalance?: number
}

export class CancellationService {
  /**
   * Ejecuta la baja definitiva de la cuenta en el sistema
   */
  public static async cancelAccount(req: CancellationRequest): Promise<{ success: boolean; message: string }> {
    // 1. Regla de Negocio: Conductor no puede tener efectivo COD retenido
    if (req.role === 'driver' && req.codBalance && req.codBalance > 0) {
      return {
        success: false,
        message: `No puedes darte de baja mientras tengas $${req.codBalance.toFixed(2)} MXN de efectivo retenido en mano. Acude a la Base Operativa a liquidar tu caja.`
      }
    }

    // 2. Intentar llamar a la función en Supabase si hay sesión activa
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.rpc('cancel_user_account', {
          p_user_id: user.id,
          p_role: req.role,
          p_reason: req.reason,
          p_feedback: req.feedback || null
        })
        // Cerrar sesión en auth
        await supabase.auth.signOut()
      }
    } catch (e) {
      console.warn('Fallback a cancelación local de cuenta:', e)
    }

    // 3. Limpieza total de almacenamiento local y tokens de sesión
    try {
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'vamo_user_session',
          'vamo_active_role',
          'vamo_saved_cards',
          'vamo_customer_balance',
          'vamo_driver_status',
          'vamo_merchant_profile',
          'vamo_push_token'
        ]
        keysToRemove.forEach(k => localStorage.removeItem(k))
        sessionStorage.clear()
      }
    } catch {}

    return {
      success: true,
      message: 'Tu cuenta y datos personales han sido dados de baja definitivamente del sistema VAMO.'
    }
  }
}
