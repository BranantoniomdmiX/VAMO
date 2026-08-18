import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface ServiceOrderPayload {
  id: string
  tracking_number: string
  status: 'PENDING' | 'ACCEPTED' | 'IN_PREPARATION' | 'ASSIGNED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'
  customer_name?: string
  driver_name?: string
  updated_at?: string
  [key: string]: unknown
}

export type OrderChangeCallback = (payload: ServiceOrderPayload, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void

class OrderRealtimeService {
  private activeChannels: Map<string, RealtimeChannel> = new Map()

  /**
   * Suscribe una pantalla a los cambios en vivo de la tabla `services`
   * @param channelName Nombre identificador único del canal
   * @param filterFilter Filtro opcional por id (ej: `id=eq.${serviceId}`)
   * @param callback Callback al recibir cambios
   */
  subscribeToOrders(
    channelName: string,
    filterFilter: string | null,
    callback: OrderChangeCallback
  ): () => void {
    const supabase = createClient()

    // Si ya existe un canal previo con este nombre, limpiarlo
    if (this.activeChannels.has(channelName)) {
      this.activeChannels.get(channelName)?.unsubscribe()
      this.activeChannels.delete(channelName)
    }

    const channelConfig: {
      event: string
      schema: string
      table: string
      filter?: string
    } = {
      event: '*',
      schema: 'public',
      table: 'services',
    }

    if (filterFilter) {
      channelConfig.filter = filterFilter
    }

    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        channelConfig,
        (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: ServiceOrderPayload }) => {
          if (payload.new) {
            callback(payload.new, payload.eventType)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`📡 [Realtime Orders] Canal '${channelName}' conectado correctamente.`)
        }
      })

    this.activeChannels.set(channelName, channel)

    // Función de desuscripción
    return () => {
      channel.unsubscribe()
      this.activeChannels.delete(channelName)
      console.log(`🔌 [Realtime Orders] Canal '${channelName}' desconectado.`)
    }
  }
}

export const orderRealtimeService = new OrderRealtimeService()
