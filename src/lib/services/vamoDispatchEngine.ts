import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cheoxokdpgbjgfdghhzt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

export interface CustomerOrderPayload {
  customer_name: string
  customer_phone: string
  delivery_address: string
  city_id: string
  territory_id?: string
  service_type: 'food_delivery' | 'store_delivery' | 'pharmacy' | 'messenger' | 'package' | 'business_delivery' | 'multi_stop' | 'scheduled_delivery' | 'COD'
  payment_method: 'CASH' | 'DIGITAL' | 'CREDIT'
  subtotal_products: number
  delivery_fee: number
  total_amount: number
  pin_code?: string
  scheduled_for?: string
}

export interface DeliveryTaskPayload {
  customer_order_id: string
  origin_franchise_id: string
  commercial_franchise_id: string
  execution_franchise_id?: string
  base_id?: string
  merchant_id?: string
  rider_id?: string
  pickup_address: string
  dropoff_address: string
  distance_km: number
  delivery_fee: number
  rider_payout: number
  central_fee: number
  commercial_franchise_fee: number
  execution_franchise_fee: number
}

export const vamoDispatchEngine = {
  /**
   * Calcula el Dispatch Score para asignación inteligente (Punto 5)
   */
  calculateDispatchScore(params: {
    proximityKm: number
    etaMinutes: number
    riderTier: 'VAMO_INICIAL' | 'ACTIVO' | 'PRO' | 'ELITE'
    riderRating: number
    cashHeld: number
    cashLimit: number
    isSameFranchise: boolean
  }): number {
    let score = 100

    // Distancia: -10 puntos por cada km de distancia
    score -= params.proximityKm * 10

    // ETA: -2 puntos por cada minuto estimado
    score -= params.etaMinutes * 2

    // Nivel del repartidor
    if (params.riderTier === 'ELITE') score += 25
    else if (params.riderTier === 'PRO') score += 15
    else if (params.riderTier === 'ACTIVO') score += 5

    // Rating
    score += (params.riderRating - 4.0) * 20

    // Misma franquicia preferencia
    if (params.isSameFranchise) score += 15

    // Penalización por sobrecarga de efectivo COD
    if (params.cashHeld >= params.cashLimit) {
      score -= 50
    }

    return Math.max(0, parseFloat(score.toFixed(2)))
  },

  /**
   * Crea una orden de cliente con código de orden y PIN de seguridad (Puntos 8, 18, 52)
   */
  async createCustomerOrder(payload: CustomerOrderPayload) {
    const orderCode = `VMO-${Date.now().toString().slice(-6)}`
    const pin = payload.pin_code || Math.floor(1000 + Math.random() * 9000).toString()

    const { data, error } = await supabaseAdmin
      .from('customer_orders')
      .insert({
        order_code: orderCode,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        delivery_address: payload.delivery_address,
        city_id: payload.city_id,
        territory_id: payload.territory_id,
        service_type: payload.service_type,
        payment_method: payload.payment_method,
        subtotal_products: payload.subtotal_products,
        delivery_fee: payload.delivery_fee,
        total_amount: payload.total_amount,
        pin_code: pin,
        status: 'created',
        scheduled_for: payload.scheduled_for
      })
      .select()
      .single()

    if (error) throw error

    // Registrar en el historial inmutable (Punto 20)
    await supabaseAdmin.from('order_status_history').insert({
      customer_order_id: data.id,
      status: 'created',
      notes: 'Orden creada por cliente / central'
    })

    return data
  },

  /**
   * Crea y desglosa una Delivery Task logística (Puntos 3, 15, 53)
   */
  async createDeliveryTask(payload: DeliveryTaskPayload) {
    const taskCode = `TSK-${Date.now().toString().slice(-6)}`

    const { data, error } = await supabaseAdmin
      .from('delivery_tasks')
      .insert({
        task_code: taskCode,
        customer_order_id: payload.customer_order_id,
        origin_franchise_id: payload.origin_franchise_id,
        commercial_franchise_id: payload.commercial_franchise_id,
        execution_franchise_id: payload.execution_franchise_id || payload.origin_franchise_id,
        base_id: payload.base_id,
        merchant_id: payload.merchant_id,
        rider_id: payload.rider_id,
        pickup_address: payload.pickup_address,
        dropoff_address: payload.dropoff_address,
        distance_km: payload.distance_km,
        delivery_fee: payload.delivery_fee,
        rider_payout: payload.rider_payout,
        central_fee: payload.central_fee,
        commercial_franchise_fee: payload.commercial_franchise_fee,
        execution_franchise_fee: payload.execution_franchise_fee,
        status: 'created'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Registra una transacción inmutable en el Ledger Financiero (Punto 16)
   */
  async recordLedgerEntry(entry: {
    franchise_id?: string
    user_id?: string
    customer_order_id?: string
    delivery_task_id?: string
    entry_type: 'delivery_income' | 'cash_collected' | 'fee_payment' | 'adjustment' | 'refund' | 'franchise_compensation' | 'central_royalty' | 'rider_payout' | 'merchant_payout'
    amount: number
    description: string
  }) {
    // Obtener saldo anterior si aplica
    let balanceBefore = 0
    if (entry.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('riders')
        .select('wallet_balance')
        .eq('id', entry.user_id)
        .single()
      if (profile) balanceBefore = Number(profile.wallet_balance) || 0
    }

    const balanceAfter = balanceBefore + entry.amount

    const { data, error } = await supabaseAdmin
      .from('financial_ledger')
      .insert({
        franchise_id: entry.franchise_id,
        user_id: entry.user_id,
        customer_order_id: entry.customer_order_id,
        delivery_task_id: entry.delivery_task_id,
        entry_type: entry.entry_type,
        amount: entry.amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: entry.description
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Registra una Incidencia Operativa con cola de prioridad (Puntos 21, 22)
   */
  async createIncident(incident: {
    customer_order_id?: string
    delivery_task_id?: string
    franchise_id?: string
    base_id?: string
    category: 'CLIENTE' | 'REPARTIDOR' | 'COMERCIO' | 'FINANZAS' | 'SEGURIDAD'
    priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
    subject: string
    description: string
  }) {
    const { data, error } = await supabaseAdmin
      .from('incidents')
      .insert({
        ...incident,
        status: incident.priority === 'CRITICA' ? 'ESCALADO_CENTRAL' : 'ABIERTO'
      })
      .select()
      .single()

    if (error) throw error

    // Si es crítica, generar alerta del sistema inmediata (Punto 36)
    if (incident.priority === 'CRITICA' || incident.category === 'SEGURIDAD') {
      await supabaseAdmin.from('system_alerts').insert({
        franchise_id: incident.franchise_id,
        base_id: incident.base_id,
        alert_type: 'SEGURIDAD',
        severity: 'CRITICAL',
        title: `🚨 EMERGENCIA: ${incident.subject}`,
        message: incident.description
      })
    }

    return data
  }
}
