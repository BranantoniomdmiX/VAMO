-- =====================================================================
-- 🐘 VAMO MASTER POSTGRESQL 16 + POSTGIS INITIALIZATION SCRIPT
-- Oracle Cloud Always Free (Dokploy VM.Standard.A1.Flex)
-- =====================================================================

-- 1. Extensiones Principales
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ 
BEGIN
  CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS no disponible en esta instancia base. Usando coordenadas numericas (lat, lng) de alta precision.';
END $$;

-- 2. Esquema de Autenticación de Compatibilidad
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 3. JERARQUÍA TERRITORIAL Y CIUDADES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'MEX',
  timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  boundary JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  legal_name TEXT,
  rfc TEXT,
  owner_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('applicant', 'evaluation', 'approved', 'setup', 'pilot', 'active', 'corrective_plan', 'suspended', 'closed')),
  commission_split_percent NUMERIC(5,2) DEFAULT 50.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 4. PERFILES DE USUARIO Y ROLES VAMO
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES public.franchises(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('superadmin', 'master', 'fleet_owner', 'dispatcher', 'driver', 'merchant', 'customer')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 5. COMERCIOS AFILIADOS (MERCHANTS) Y PRODUCTOS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id),
  franchise_id UUID REFERENCES public.franchises(id),
  name TEXT NOT NULL,
  trade_name TEXT,
  category TEXT NOT NULL DEFAULT 'RESTAURANT',
  address TEXT NOT NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  phone TEXT,
  rating NUMERIC(3,2) DEFAULT 5.00,
  preparation_time_min INT DEFAULT 15,
  is_open BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT DEFAULT 'General',
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 6. CONDUCTORES Y TELEMETRÍA GPS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES public.franchises(id),
  vehicle_type TEXT DEFAULT 'MOTORCYCLE',
  plate_number TEXT,
  status TEXT NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('AVAILABLE', 'BUSY', 'PAUSED', 'OFFLINE')),
  current_lat NUMERIC(10,7),
  current_lng NUMERIC(10,7),
  heading NUMERIC(5,2) DEFAULT 0,
  battery_level INT DEFAULT 100,
  speed_kmh NUMERIC(5,2) DEFAULT 0,
  cash_collected NUMERIC(10,2) DEFAULT 0.00,
  cash_limit NUMERIC(10,2) DEFAULT 1500.00,
  rating NUMERIC(3,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 7. PEDIDOS (ORDERS) Y ENTREGAS MULTI-PARADA
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id),
  driver_id UUID REFERENCES public.drivers(id),
  merchant_id UUID REFERENCES public.merchants(id),
  franchise_id UUID REFERENCES public.franchises(id),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED_BIZ', 'PREPARING', 'READY_BIZ', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED_ORIGIN', 'IN_TRANSIT', 'DRIVER_ARRIVED_DESTINATION', 'DELIVERED', 'CANCELLED')),
  order_type TEXT NOT NULL DEFAULT 'DELIVERY' CHECK (order_type IN ('DELIVERY', 'MANDADO', 'PHARMACY', 'MULTI_STOP')),
  origin_address TEXT NOT NULL,
  origin_lat NUMERIC(10,7) NOT NULL,
  origin_lng NUMERIC(10,7) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat NUMERIC(10,7) NOT NULL,
  destination_lng NUMERIC(10,7) NOT NULL,
  distance_km NUMERIC(6,2) DEFAULT 0,
  duration_minutes INT DEFAULT 0,
  subtotal NUMERIC(10,2) DEFAULT 0.00,
  delivery_fee NUMERIC(10,2) DEFAULT 0.00,
  discount NUMERIC(10,2) DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CARD', 'SPEI', 'OXXO', 'WALLET')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
  pod_signature_url TEXT,
  pod_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 8. BILLETERAS DIGITALES (WALLETS) Y TRANSACCIONES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  held_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallet_accounts(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'EARNING', 'COMMISSION', 'CASH_CLEARING', 'REFUND', 'BONUS')),
  amount NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 9. ÍNDICES DE ALTO RENDIMIENTO (Radar & Consultas en Milisegundos)
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_merchants_coords ON public.merchants(lat, lng);
CREATE INDEX IF NOT EXISTS idx_drivers_coords ON public.drivers(current_lat, current_lng);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON public.orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON public.products(merchant_id);
