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

export interface OrderRow {
  id: string
  code: string
  customer_id: string
  merchant_id: string | null
  driver_id: string | null
  franchise_id: string | null
  territory_id: string | null
  status: CanonicalOrderStatus
  origin_address: string
  origin_lat: number | null
  origin_lng: number | null
  destination_address: string
  destination_lat: number | null
  destination_lng: number | null
  distance_km: number
  subtotal: number
  delivery_fee: number
  total: number
  payment_method: CanonicalPaymentMethod
  payment_status: CanonicalPaymentStatus
  pin_code: string | null
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
