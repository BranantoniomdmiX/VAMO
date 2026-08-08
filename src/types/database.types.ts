export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'superadmin' | 'owner' | 'base' | 'driver' | 'business' | 'customer'
export type DriverStatus = 'OFFLINE' | 'DISPONIBLE' | 'EN_SERVICIO' | 'PAUSA' | 'SUSPENDIDO'
export type ServiceStatus = 
  | 'CREADO' 
  | 'COTIZADO' 
  | 'CONFIRMADO' 
  | 'ASIGNADO' 
  | 'EN_CAMINO_RECOGER' 
  | 'LLEGÓ_RECOGER' 
  | 'RECOGIDO' 
  | 'EN_CAMINO_ENTREGA' 
  | 'LLEGÓ_ENTREGA' 
  | 'ENTREGADO' 
  | 'CERRADO' 
  | 'CANCELADO'

export type ServiceType = 'DIRECT' | 'PURCHASE' | 'MULTI_STOP' | 'RETURN'
export type PaymentMethod = 'CASH' | 'DIGITAL' | 'CREDIT'

export interface Tenant {
  id: string
  name: string
  slug: string
  phone: string | null
  email: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  tenant_id: string | null
  full_name: string
  phone: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Driver {
  id: string
  tenant_id: string
  vehicle_plate: string | null
  vehicle_model: string | null
  license_number: string | null
  status: DriverStatus
  kyc_verified: boolean
  wallet_balance: number
  updated_at: string
}

export interface Service {
  id: string
  tenant_id: string
  service_code: string
  customer_id: string | null
  driver_id: string | null
  service_type: ServiceType
  status: ServiceStatus
  origin_address: string
  destination_address: string
  distance_km: number | null
  total_price: number
  driver_earnings: number | null
  company_earnings: number | null
  payment_method: PaymentMethod
  payment_status: string
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  tenant_id: string
  service_id: string | null
  user_id: string
  amount: number
  type: 'SERVICE_EARNING' | 'COMMISSION_DEDUCTION' | 'RENTAL_FEE' | 'CASH_DEPOSIT' | 'PAYOUT'
  description: string | null
  created_at: string
}
