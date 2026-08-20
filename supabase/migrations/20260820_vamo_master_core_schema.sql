-- =====================================================================
-- VAMO MASTER CORE DATABASE MIGRATION (NIVEL 1 & ARQUITECTURA MULTI-FRANQUICIA)
-- Cumplimiento total de los 65 Principios del Resumen Maestro VAMO
-- Ejecutar en el SQL Editor del Dashboard de Supabase (cheoxokdpgbjgfdghhzt)
-- =====================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================================
-- 2. JERARQUÍA TERRITORIAL Y MULTI-FRANQUICIA (Puntos 1, 2, 3, 26, 60, 61)
-- =====================================================================

-- Paises y Ciudades
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'MEX',
  timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Territorios Geográficos / Polígonos (Puntos 26, 27)
CREATE TABLE IF NOT EXISTS public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL, -- ej. 'CELAYA-CENTRO', 'QRO-JURIQUILLA'
  boundary GEOGRAPHY(POLYGON, 4326),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Franquicias (Puntos 2, 3, 60, 61)
CREATE TABLE IF NOT EXISTS public.franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  legal_name TEXT,
  rfc TEXT,
  owner_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('applicant', 'evaluation', 'approved', 'setup', 'pilot', 'active', 'corrective_plan', 'suspended', 'closed')),
  commission_split_percent NUMERIC(5,2) DEFAULT 50.00, -- Central vs Franquicia
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asignación de Territorios a Franquicias (Punto 3: Franquicia Territorial)
CREATE TABLE IF NOT EXISTS public.franchise_territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  territory_id UUID REFERENCES public.territories(id) ON DELETE CASCADE NOT NULL,
  is_exclusive BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(franchise_id, territory_id)
);

-- Bases Operativas (Puntos 2, 4)
CREATE TABLE IF NOT EXISTS public.operation_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  territory_id UUID REFERENCES public.territories(id),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  location GEOGRAPHY(POINT, 4326),
  manager_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flotas / Grupos de Motos (Puntos 2, 57)
CREATE TABLE IF NOT EXISTS public.fleets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_id UUID REFERENCES public.operation_bases(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 3. PERFILES, ROLES RBAC Y REPARTIDORES (Puntos 1, 12, 13, 25)
-- =====================================================================

-- Extensión de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES public.franchises(id),
  base_id UUID REFERENCES public.operation_bases(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  primary_role TEXT NOT NULL DEFAULT 'customer' CHECK (primary_role IN (
    'customer', 'merchant_user', 'rider', 'base_operator', 'base_manager',
    'franchise_admin', 'franchise_owner', 'city_supervisor', 'central_support',
    'central_finance', 'central_operations', 'superadmin'
  )),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repartidores / Riders (Puntos 12, 13, 17)
CREATE TABLE IF NOT EXISTS public.riders (
  id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES public.franchises(id) NOT NULL,
  base_id UUID REFERENCES public.operation_bases(id) NOT NULL,
  fleet_id UUID REFERENCES public.fleets(id),
  rider_code VARCHAR(20) UNIQUE NOT NULL, -- ej. 'B-024'
  vehicle_plate VARCHAR(50),
  vehicle_model VARCHAR(100),
  vehicle_type VARCHAR(50) DEFAULT 'MOTORCYCLE',
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN (
    'offline', 'disponible', 'asignado', 'rumbo_comercio', 'esperando',
    'recogido', 'rumbo_cliente', 'incidencia', 'pausa'
  )),
  tier_level TEXT NOT NULL DEFAULT 'VAMO_INICIAL' CHECK (tier_level IN ('VAMO_INICIAL', 'ACTIVO', 'PRO', 'ELITE')),
  kyc_status TEXT DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  cash_held NUMERIC(10,2) DEFAULT 0.00, -- Efectivo en mano (Punto 17)
  cash_held_limit NUMERIC(10,2) DEFAULT 1500.00, -- Límite COD
  wallet_balance NUMERIC(10,2) DEFAULT 0.00,
  current_location GEOGRAPHY(POINT, 4326),
  last_gps_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 4. COMERCIOS Y PLANES (Puntos 10, 11, 14, 6)
-- =====================================================================

-- Planes de Comercios Configurables (Punto 14)
CREATE TABLE IF NOT EXISTS public.merchant_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- ej. 'PLAN_100', 'PLAN_300', 'PLAN_600', 'EMPRESARIAL'
  name TEXT NOT NULL,
  monthly_price NUMERIC(10,2) NOT NULL,
  central_share_percent NUMERIC(5,2) DEFAULT 50.00,
  franchise_share_percent NUMERIC(5,2) DEFAULT 50.00,
  included_orders_month INT DEFAULT 0,
  included_dedicated_riders INT DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comercios / Merchants (Puntos 3, 10)
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_franchise_id UUID REFERENCES public.franchises(id) NOT NULL, -- Franquicia Comercial
  territory_id UUID REFERENCES public.territories(id),
  owner_user_id UUID REFERENCES auth.users(id),
  plan_id UUID REFERENCES public.merchant_plans(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'RESTAURANTE',
  merchant_type TEXT NOT NULL DEFAULT 'RESTAURANTE' CHECK (merchant_type IN ('MICRO', 'PYME', 'RESTAURANTE', 'ALTA_DEMANDA', 'EMPRESARIAL')),
  phone TEXT,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  is_open BOOLEAN DEFAULT TRUE,
  avg_prep_time_minutes INT DEFAULT 20,
  rating_avg NUMERIC(3,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capacidad de Repartidores Reservados / Dedicados (Punto 6)
CREATE TABLE IF NOT EXISTS public.merchant_reserved_riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
  rider_id UUID REFERENCES public.riders(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL, -- 0=Domingo, 1=Lunes...
  start_time TIME NOT NULL, -- ej. '13:00'
  end_time TIME NOT NULL,   -- ej. '16:00'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 5. MOTOR DE TARIFAS Y CONFIGURACIÓN VERSIONADA (Puntos 7, 38, 50)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id),
  territory_id UUID REFERENCES public.territories(id),
  version INT DEFAULT 1,
  name TEXT NOT NULL,
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 30.00,
  included_km NUMERIC(5,2) NOT NULL DEFAULT 2.00,
  price_per_extra_km NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  price_per_extra_stop NUMERIC(10,2) NOT NULL DEFAULT 15.00,
  night_surcharge_percent NUMERIC(5,2) DEFAULT 0.00,
  rain_surcharge_percent NUMERIC(5,2) DEFAULT 0.00,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cuotas de Repartidores Configurables (Punto 13)
CREATE TABLE IF NOT EXISTS public.rider_fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id),
  name TEXT NOT NULL DEFAULT 'Cuota Semanal Estándar',
  weekly_fee_amount NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  central_share_amount NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  franchise_share_amount NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 6. PEDIDOS, DELIVERY TASKS Y ESTADOS (Puntos 3, 4, 18, 19, 20, 52, 53, 54)
-- =====================================================================

-- 1 Customer Order (Puede ser multitienda) (Punto 52)
CREATE TABLE IF NOT EXISTS public.customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code VARCHAR(30) UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_location GEOGRAPHY(POINT, 4326),
  city_id UUID REFERENCES public.cities(id) NOT NULL,
  territory_id UUID REFERENCES public.territories(id),
  service_type TEXT NOT NULL DEFAULT 'food_delivery' CHECK (service_type IN (
    'food_delivery', 'store_delivery', 'pharmacy', 'messenger', 'package',
    'business_delivery', 'multi_stop', 'scheduled_delivery', 'COD'
  )),
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'DIGITAL', 'CREDIT')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED')),
  subtotal_products NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  pin_code VARCHAR(6) NOT NULL, -- PIN de seguridad para entrega (Puntos 8, 18)
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'confirmed', 'preparing', 'ready', 'searching_rider',
    'assigned', 'pickup_arrived', 'picked_up', 'on_route', 'arriving',
    'delivered', 'closed', 'cancelled', 'failed', 'incident'
  )),
  scheduled_for TIMESTAMPTZ, -- Pedidos programados (Punto 55)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tareas Logísticas Desacopladas (Punto 53, 54)
CREATE TABLE IF NOT EXISTS public.delivery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id UUID REFERENCES public.customer_orders(id) ON DELETE CASCADE NOT NULL,
  task_code VARCHAR(30) UNIQUE NOT NULL,
  
  -- Jerarquía de Franquicias (Punto 3)
  origin_franchise_id UUID REFERENCES public.franchises(id) NOT NULL,
  commercial_franchise_id UUID REFERENCES public.franchises(id) NOT NULL,
  execution_franchise_id UUID REFERENCES public.franchises(id), -- Quien aporta la moto
  
  base_id UUID REFERENCES public.operation_bases(id),
  merchant_id UUID REFERENCES public.merchants(id),
  rider_id UUID REFERENCES public.riders(id),
  
  pickup_address TEXT NOT NULL,
  pickup_location GEOGRAPHY(POINT, 4326),
  dropoff_address TEXT NOT NULL,
  dropoff_location GEOGRAPHY(POINT, 4326),
  distance_km NUMERIC(8,2),
  
  -- Desglose Financiero
  delivery_fee NUMERIC(10,2) NOT NULL,
  rider_payout NUMERIC(10,2) NOT NULL,
  central_fee NUMERIC(10,2) NOT NULL,
  commercial_franchise_fee NUMERIC(10,2) NOT NULL,
  execution_franchise_fee NUMERIC(10,2) NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'created',
  dispatch_score NUMERIC(8,2), -- Puntuación de despacho (Punto 5)
  proof_photo_url TEXT,
  proof_signature_url TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial Inmutable de Estados de Pedido (Punto 20)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id UUID REFERENCES public.customer_orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  location GEOGRAPHY(POINT, 4326),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 7. LEDGER FINANCIERO INMUTABLE Y COMPENSACIÓN ENTRE FRANQUICIAS (Puntos 15, 16)
-- =====================================================================

-- Libro Contable Inmutable (Ledger)
CREATE TABLE IF NOT EXISTS public.financial_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id),
  user_id UUID REFERENCES auth.users(id),
  customer_order_id UUID REFERENCES public.customer_orders(id),
  delivery_task_id UUID REFERENCES public.delivery_tasks(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'delivery_income', 'cash_collected', 'fee_payment', 'adjustment',
    'refund', 'franchise_compensation', 'central_royalty', 'rider_payout', 'merchant_payout'
  )),
  amount NUMERIC(10,2) NOT NULL,
  balance_before NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  balance_after NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cámara de Compensación entre Franquicias (VAMO Clearing) (Punto 15)
CREATE TABLE IF NOT EXISTS public.franchise_clearing_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_franchise_id UUID REFERENCES public.franchises(id) NOT NULL,   -- Franquicia que debe dinero
  creditor_franchise_id UUID REFERENCES public.franchises(id) NOT NULL, -- Franquicia que ejecutó el servicio
  settlement_period_start DATE NOT NULL,
  settlement_period_end DATE NOT NULL,
  total_orders_count INT NOT NULL DEFAULT 0,
  gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_payable_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SETTLED', 'DISPUTED')),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 8. INCIDENCIAS, ALERTAS Y AUDIT LOG (Puntos 21, 22, 24, 36)
-- =====================================================================

-- Sistema de Tickets e Incidencias (Puntos 21, 22)
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id UUID REFERENCES public.customer_orders(id),
  delivery_task_id UUID REFERENCES public.delivery_tasks(id),
  franchise_id UUID REFERENCES public.franchises(id),
  base_id UUID REFERENCES public.operation_bases(id),
  category TEXT NOT NULL CHECK (category IN ('CLIENTE', 'REPARTIDOR', 'COMERCIO', 'FINANZAS', 'SEGURIDAD')),
  priority TEXT NOT NULL DEFAULT 'MEDIA' CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'ABIERTO' CHECK (status IN ('ABIERTO', 'EN_REVISION', 'ESCALADO_BASE', 'ESCALADO_CENTRAL', 'RESUELTO', 'CERRADO')),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Motor de Alertas Operativas en Vivo (Punto 36)
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id),
  base_id UUID REFERENCES public.operation_bases(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('OPERACION', 'COMERCIO', 'REPARTIDOR', 'ZONA', 'CLIENTE', 'FINANZAS', 'FRANQUICIA', 'SEGURIDAD')),
  severity TEXT NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'DANGER', 'CRITICAL')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de Auditoría Completo (Punto 24)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT,
  ip_address TEXT,
  action TEXT NOT NULL, -- ej. 'UPDATE_PRICING', 'TERRITORY_REASSIGN', 'ROLE_CHANGE'
  entity_table TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 9. HABILITACIÓN DE SUPABASE REALTIME
-- =====================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.customer_orders,
  public.delivery_tasks,
  public.riders,
  public.system_alerts,
  public.incidents;
