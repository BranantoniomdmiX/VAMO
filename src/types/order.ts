// src/types/order.ts
// 🛡️ Tipos canónicos y Helpers para public.orders en VAMO

export type CanonicalOrderStatus =
  | 'PENDING'
  | 'ACCEPTED_BIZ'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_BIZ'
  | 'READY_FOR_PICKUP'
  | 'DRIVER_ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'

export type CanonicalPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'

export type CanonicalPaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'OXXO_CASH'
  | 'SPEI'

export type CanonicalOrderType =
  | 'DIRECT'
  | 'PURCHASE'
  | 'MULTI_STOP'

export type CanonicalScheduleType =
  | 'ASAP'
  | 'SCHEDULED'

export type CanonicalFulfillmentMode =
  | 'VAMO_NETWORK'
  | 'OWN_FLEET'
  | 'HYBRID_OVERFLOW'

// Compatibilidad retroactiva
export type CanonicalFleetMode = CanonicalFulfillmentMode

export type OrderStopType =
  | 'PICKUP'
  | 'DROPOFF'
  | 'WAYPOINT'

export type OrderStopStatus =
  | 'PENDING'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'

export interface OrderStopRow {
  id: string
  order_id: string
  sequence_index: number
  stop_type: OrderStopType
  address: string
  lat: number
  lng: number
  contact_name: string | null
  contact_phone: string | null
  notes: string | null
  scheduled_window_start: string | null
  scheduled_window_end: string | null
  status: OrderStopStatus
  pod_pin_code: string | null
  pod_signature_url: string | null
  pod_photo_url: string | null
  arrived_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderRow {
  id: string
  code: string
  customer_id: string
  merchant_id: string | null
  driver_id: string | null
  franchise_id: string | null
  territory_id: string | null
  status: CanonicalOrderStatus
  order_type: CanonicalOrderType
  schedule_type: CanonicalScheduleType
  fulfillment_mode: CanonicalFulfillmentMode
  origin_address: string
  origin_lat: number | null
  origin_lng: number | null
  destination_address: string
  destination_lat: number | null
  destination_lng: number | null
  distance_km: number | null
  subtotal: number | null
  delivery_fee: number | null
  total: number | null
  payment_method: CanonicalPaymentMethod
  payment_status: CanonicalPaymentStatus
  pin_code: string | null
  pickup_window_start: string | null
  pickup_window_end: string | null
  delivery_window_start: string | null
  delivery_window_end: string | null
  dispatch_not_before: string | null
  dispatch_deadline: string | null
  overflow_after_at: string | null
  arrived_origin_at: string | null
  arrived_destination_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export const CANONICAL_ORDER_STATUSES: readonly CanonicalOrderStatus[] = [
  'PENDING',
  'ACCEPTED_BIZ',
  'CONFIRMED',
  'PREPARING',
  'READY_BIZ',
  'READY_FOR_PICKUP',
  'DRIVER_ASSIGNED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED'
] as const

export function isCanonicalOrderStatus(status: string): status is CanonicalOrderStatus {
  return (CANONICAL_ORDER_STATUSES as readonly string[]).includes(status)
}
