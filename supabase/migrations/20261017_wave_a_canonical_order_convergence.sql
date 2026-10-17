-- =====================================================================
-- VAMO MIGRATION: 20261017_wave_a_canonical_order_convergence.sql
-- FASE: Ola A / Convergencia del Spine Canónico
-- AUTORIDAD: docs/research/VAMO_PRODUCT_BLUEPRINT_2026-10-15.md
--            docs/business/VAMO_BUSINESS_CONSTITUTION.md
--            docs/research/CURRENT_INFRASTRUCTURE_AUTHORITY_2026-10-15.md
--
-- PRINCIPIOS INMUTABLES:
-- 1. Idempotente (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, DO $$ blocks).
-- 2. No destructivo: no trunca ni recrea tablas existentes.
-- 3. Máquina de estados: 10 estados exactos sin llegadas en enum principal.
-- 4. Tipos logísticos: DIRECT, PURCHASE, MULTI_STOP (sin categorías de negocio).
-- 5. Dimensión temporal: schedule_type = ASAP | SCHEDULED con ventanas TIMESTAMPTZ.
-- 6. Flota/Red: VAMO_NETWORK, OWN_FLEET, HYBRID_OVERFLOW.
-- 7. Modelo multiparada normalizado: public.order_stops.
-- 8. Auditoría de transiciones: public.order_status_history.
-- 9. Pago Conekta aditivo: public.payment_intents (order_id -> orders.id, customer_order_id nullable).
-- 10. Billeteras digitales: public.wallet_accounts y public.wallet_transactions aditivas.
-- 11. Seguridad PIN: Eliminación total de '8492' y RIGHT(code, 4).
-- 12. RLS dual coherente: auth.uid() (Supabase) + withTrustedAuthContext (app.current_user_id).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTENSIÓN Y COMPONENTES BASE DE EXTENSIONES
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 2. TABLA CANÓNICA public.orders (ADICIÓN / EXTENSIÓN SEGURA)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id),
  driver_id UUID REFERENCES public.drivers(id),
  merchant_id UUID REFERENCES public.merchants(id),
  franchise_id UUID REFERENCES public.franchises(id),
  territory_id UUID,
  status TEXT NOT NULL DEFAULT 'PENDING',
  order_type TEXT NOT NULL DEFAULT 'DIRECT',
  schedule_type TEXT NOT NULL DEFAULT 'ASAP',
  fleet_mode TEXT NOT NULL DEFAULT 'VAMO_NETWORK',
  origin_address TEXT NOT NULL,
  origin_lat NUMERIC(10,7),
  origin_lng NUMERIC(10,7),
  destination_address TEXT NOT NULL,
  destination_lat NUMERIC(10,7),
  destination_lng NUMERIC(10,7),
  distance_km NUMERIC(6,2),
  duration_minutes INT,
  subtotal NUMERIC(10,2),
  delivery_fee NUMERIC(10,2),
  discount NUMERIC(10,2) DEFAULT 0.00,
  total NUMERIC(10,2),
  payment_method TEXT NOT NULL DEFAULT 'CASH',
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  pin_code VARCHAR(10),
  pickup_window_start TIMESTAMPTZ,
  pickup_window_end TIMESTAMPTZ,
  delivery_window_start TIMESTAMPTZ,
  delivery_window_end TIMESTAMPTZ,
  dispatch_not_before TIMESTAMPTZ,
  dispatch_deadline TIMESTAMPTZ,
  overflow_after_at TIMESTAMPTZ,
  arrived_origin_at TIMESTAMPTZ,
  arrived_destination_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  pod_signature_url TEXT,
  pod_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evolución aditiva en caso de que public.orders ya existiera previamente
DO $$
BEGIN
  -- Columnas de tipo y dimensiones logísticas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_type') THEN
    ALTER TABLE public.orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'DIRECT';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'schedule_type') THEN
    ALTER TABLE public.orders ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'ASAP';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'fleet_mode') THEN
    ALTER TABLE public.orders ADD COLUMN fleet_mode TEXT NOT NULL DEFAULT 'VAMO_NETWORK';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'territory_id') THEN
    ALTER TABLE public.orders ADD COLUMN territory_id UUID;
  END IF;

  -- Ventanas temporales y programación
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'pickup_window_start') THEN
    ALTER TABLE public.orders ADD COLUMN pickup_window_start TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'pickup_window_end') THEN
    ALTER TABLE public.orders ADD COLUMN pickup_window_end TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_window_start') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_window_start TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_window_end') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_window_end TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'dispatch_not_before') THEN
    ALTER TABLE public.orders ADD COLUMN dispatch_not_before TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'dispatch_deadline') THEN
    ALTER TABLE public.orders ADD COLUMN dispatch_deadline TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'overflow_after_at') THEN
    ALTER TABLE public.orders ADD COLUMN overflow_after_at TIMESTAMPTZ;
  END IF;

  -- Timestamps de eventos de llegada y trazabilidad
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'arrived_origin_at') THEN
    ALTER TABLE public.orders ADD COLUMN arrived_origin_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'arrived_destination_at') THEN
    ALTER TABLE public.orders ADD COLUMN arrived_destination_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivered_at') THEN
    ALTER TABLE public.orders ADD COLUMN delivered_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'pin_code') THEN
    ALTER TABLE public.orders ADD COLUMN pin_code VARCHAR(10);
  END IF;
END $$;

-- Permitir NULL en campos de precio y distancia hasta cotización autoritativa
ALTER TABLE public.orders ALTER COLUMN distance_km DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN subtotal DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN delivery_fee DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN total DROP NOT NULL;

-- Actualizar Constraints de Validación (CHECKs canónicos)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
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
  ));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('DIRECT', 'PURCHASE', 'MULTI_STOP'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_schedule_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_schedule_type_check
  CHECK (schedule_type IN ('ASAP', 'SCHEDULED'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_fleet_mode_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_fleet_mode_check
  CHECK (fleet_mode IN ('VAMO_NETWORK', 'OWN_FLEET', 'HYBRID_OVERFLOW'));

-- ---------------------------------------------------------------------
-- 3. MODELO MULTIPARADA NORMALIZADO: public.order_stops
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sequence_index INT NOT NULL DEFAULT 1,
  stop_type TEXT NOT NULL CHECK (stop_type IN ('PICKUP', 'DROPOFF', 'WAYPOINT')),
  address TEXT NOT NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT,
  scheduled_window_start TIMESTAMPTZ,
  scheduled_window_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ARRIVED', 'COMPLETED', 'FAILED', 'SKIPPED')),
  pod_pin_code VARCHAR(10),
  pod_signature_url TEXT,
  pod_photo_url TEXT,
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, sequence_index)
);

CREATE INDEX IF NOT EXISTS idx_order_stops_order_id ON public.order_stops(order_id);
CREATE INDEX IF NOT EXISTS idx_order_stops_coords ON public.order_stops(lat, lng);

-- ---------------------------------------------------------------------
-- 4. HISTORIAL INMUTABLE DE ESTADOS: public.order_status_history
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id UUID,
  actor_role TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at DESC);

-- Trigger para registrar transiciones automáticamente en order_status_history
CREATE OR REPLACE FUNCTION public.fn_track_order_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.order_status_history (
      order_id,
      from_status,
      to_status,
      actor_id,
      actor_role,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      NEW.status,
      COALESCE(auth.uid(), NULLIF(current_setting('app.current_user_id', true), '')::uuid),
      COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'service_role'),
      'Transition: ' || NEW.status,
      jsonb_build_object(
        'fleet_mode', NEW.fleet_mode,
        'driver_id', NEW.driver_id,
        'updated_at', NEW.updated_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_order_status_history ON public.orders;
CREATE TRIGGER trg_track_order_status_history
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_track_order_status_history();

-- ---------------------------------------------------------------------
-- 5. EVOLUCIÓN ADITIVA DE public.payment_intents (CONEKTA GATEWAY)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id UUID,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'conekta',
  gateway_order_id TEXT NOT NULL,
  gateway_payment_url TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'EXPIRED', 'DECLINED')),
  payment_method_type TEXT CHECK (payment_method_type IN ('card', 'oxxo_cash', 'spei', 'cash', 'wallet')),
  card_last4 TEXT,
  card_brand TEXT,
  card_bank TEXT,
  payment_reference TEXT,
  payment_expires_at TIMESTAMPTZ,
  webhook_received_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existía con customer_order_id NOT NULL:
DO $$
BEGIN
  -- 1. Permitir que customer_order_id sea nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payment_intents' 
      AND column_name = 'customer_order_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.payment_intents ALTER COLUMN customer_order_id DROP NOT NULL;
  END IF;

  -- 2. Agregar columna order_id referenciando public.orders
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payment_intents' 
      AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.payment_intents ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_intents_canonical_order_id ON public.payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_gateway_order ON public.payment_intents(gateway_order_id);

-- ---------------------------------------------------------------------
-- 6. BILLETERAS DIGITALES: public.wallet_accounts & public.wallet_transactions
-- ---------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_wallet_accounts_profile ON public.wallet_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order ON public.wallet_transactions(order_id);

-- ---------------------------------------------------------------------
-- 7. REGLAS DE PRICING Y TARIFICACIÓN CONFIGURABLES POR PLAZA
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  territory_id UUID,
  name TEXT NOT NULL,
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 35.00,
  base_km_included NUMERIC(6,2) NOT NULL DEFAULT 2.00,
  per_km_rate NUMERIC(10,2) NOT NULL DEFAULT 8.00,
  per_stop_fee NUMERIC(10,2) NOT NULL DEFAULT 15.00,
  gateway_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 3.60,
  gateway_fixed_fee NUMERIC(10,2) NOT NULL DEFAULT 3.00,
  operational_dispatch_buffer_minutes INT NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sembrar hipótesis inicial de pricing si no existe
INSERT INTO public.pricing_rules (
  name, base_fare, base_km_included, per_km_rate, per_stop_fee,
  gateway_fee_percent, gateway_fixed_fee, operational_dispatch_buffer_minutes, is_active
)
SELECT 'Hipótesis Operativa Base', 35.00, 2.00, 8.00, 15.00, 3.60, 3.00, 15, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules);

-- ---------------------------------------------------------------------
-- 8. ENDURECIMIENTO P0: VERIFICACIÓN POD ATÓMICA SIN FALLBACK DE PIN
-- ---------------------------------------------------------------------
-- Se elimina absolutamente cualquier fallback de '8492' o RIGHT(code, 4).
-- Solo el pin_code criptográfico registrado o foto POD obligatoria son válidos.

CREATE OR REPLACE FUNCTION public.verify_order_pod(
  p_order_id UUID,
  p_pin TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_lat NUMERIC DEFAULT NULL,
  p_lng NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_actor_user_id UUID;
  v_actor_role TEXT;
  v_settlement_res JSONB;
BEGIN
  v_actor_user_id := COALESCE(auth.uid(), NULLIF(current_setting('app.current_user_id', true), '')::uuid);
  v_actor_role := COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'anon');

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDER_NOT_FOUND',
      'message', 'El pedido especificado no existe.'
    );
  END IF;

  -- Validar identidad de conductor
  IF v_actor_role NOT IN ('superadmin', 'master') THEN
    IF v_actor_user_id IS NULL OR v_order.driver_id IS NULL OR v_order.driver_id != v_actor_user_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'FORBIDDEN_WRONG_DRIVER',
        'message', 'Solo el conductor asignado a este pedido puede registrar la entrega.'
      );
    END IF;
  END IF;

  -- Idempotencia: Si ya está DELIVERED, retornar éxito sin doble liquidación
  IF v_order.status = 'DELIVERED' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_DELIVERED',
      'message', 'Este pedido ya fue marcado como entregado anteriormente.'
    );
  END IF;

  -- 🛡️ REGLA P0: NUNCA USAR PIN '8492' NI RIGHT(order.code, 4).
  -- El PIN debe coincidir EXACTAMENTE con el pin_code criptográfico de la orden.
  IF p_pin IS NOT NULL AND TRIM(p_pin) != '' THEN
    IF v_order.pin_code IS NULL OR TRIM(p_pin) != TRIM(v_order.pin_code) THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'INVALID_PIN',
        'message', 'El código PIN ingresado es incorrecto. Solicítalo nuevamente al cliente.'
      );
    END IF;
  ELSIF p_photo_url IS NULL OR TRIM(p_photo_url) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PROOF_REQUIRED',
      'message', 'Se requiere el código PIN criptográfico del cliente o una fotografía POD válida.'
    );
  END IF;

  -- Marcar orden como entregada
  UPDATE public.orders
  SET 
    status = 'DELIVERED',
    arrived_destination_at = COALESCE(arrived_destination_at, NOW()),
    delivered_at = NOW(),
    pod_photo_url = COALESCE(p_photo_url, pod_photo_url),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Liberar al conductor
  IF v_order.driver_id IS NOT NULL THEN
    UPDATE public.drivers
    SET status = 'AVAILABLE', updated_at = NOW()
    WHERE id = v_order.driver_id;
  END IF;

  -- Liquidación contable atómica (0% comisión por viaje, 100% flete al conductor)
  v_settlement_res := public.process_order_settlement(p_order_id);

  RETURN jsonb_build_object(
    'success', true,
    'code', 'ORDER_DELIVERED',
    'message', '¡Entrega confirmada exitosamente! Pedido finalizado y fondos liquidados.',
    'order_id', p_order_id,
    'order_code', v_order.code,
    'settlement', v_settlement_res
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', 'INTERNAL_ERROR',
    'message', SQLERRM
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 9. ASIGNACIÓN ATÓMICA DE PEDIDOS CON SOPORTE DE FLOTA Y HORARIOS
-- ---------------------------------------------------------------------
-- Soporta:
-- - VAMO_NETWORK
-- - OWN_FLEET (solo conductores vinculados al merchant)
-- - HYBRID_OVERFLOW (espera overflow_after_at antes de abrir a red)
-- - SCHEDULED: No permite aceptar antes de dispatch_not_before

CREATE OR REPLACE FUNCTION public.assign_order_atomic(
  p_order_id UUID,
  p_driver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_driver RECORD;
  v_is_merchant_driver BOOLEAN := false;
BEGIN
  -- Bloqueo pesimista de la orden
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDER_NOT_FOUND',
      'message', 'El pedido no existe.'
    );
  END IF;

  -- Si ya está tomado por otro chofer
  IF v_order.driver_id IS NOT NULL AND v_order.driver_id != p_driver_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDER_ALREADY_TAKEN',
      'message', 'Este pedido ya fue asignado a otro conductor.'
    );
  END IF;

  -- Validar estados elegibles para asignación
  IF v_order.status NOT IN ('PENDING', 'ACCEPTED_BIZ', 'CONFIRMED', 'PREPARING', 'READY_BIZ', 'READY_FOR_PICKUP') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDER_NOT_DISPATCHABLE',
      'message', 'El pedido ya no se encuentra en un estado disponible para despacho.'
    );
  END IF;

  -- 🛡️ REGLA SCHEDULED: Si es programado, no se despacha antes de dispatch_not_before
  IF v_order.schedule_type = 'SCHEDULED' AND v_order.dispatch_not_before IS NOT NULL THEN
    IF NOW() < v_order.dispatch_not_before THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'ORDER_SCHEDULED_NOT_READY',
        'message', 'El pedido programado aún no alcanza su ventana de despacho autorizada.'
      );
    END IF;
  END IF;

  -- Validar si el conductor está vinculado al comercio
  IF v_order.merchant_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.drivers 
      WHERE id = p_driver_id AND merchant_id = v_order.merchant_id
    ) INTO v_is_merchant_driver;
  END IF;

  -- 🛡️ REGLA FLEET_MODE:
  IF v_order.fleet_mode = 'OWN_FLEET' THEN
    IF NOT v_is_merchant_driver THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'FORBIDDEN_OWN_FLEET_ONLY',
        'message', 'Este pedido pertenece a la flota privada exclusiva del comercio.'
      );
    END IF;
  ELSIF v_order.fleet_mode = 'HYBRID_OVERFLOW' THEN
    IF NOT v_is_merchant_driver THEN
      -- Si no es chofer del negocio, solo puede tomarla si ya pasó overflow_after_at
      IF v_order.overflow_after_at IS NOT NULL AND NOW() < v_order.overflow_after_at THEN
        RETURN jsonb_build_object(
          'success', false,
          'code', 'HYBRID_WAITING_FOR_OVERFLOW',
          'message', 'El pedido está reservado temporalmente para la flota del comercio antes del desborde.'
        );
      END IF;
    END IF;
  END IF;

  -- Bloquear al conductor
  SELECT * INTO v_driver
  FROM public.drivers
  WHERE id = p_driver_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'DRIVER_NOT_FOUND',
      'message', 'El perfil de conductor no fue encontrado.'
    );
  END IF;

  -- Actualizar orden a DRIVER_ASSIGNED
  UPDATE public.orders
  SET
    driver_id = p_driver_id,
    status = 'DRIVER_ASSIGNED',
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Marcar conductor como BUSY
  UPDATE public.drivers
  SET
    status = 'BUSY',
    updated_at = NOW()
  WHERE id = p_driver_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'ORDER_ASSIGNED',
    'message', 'Pedido asignado exitosamente al conductor.',
    'order_id', p_order_id,
    'driver_id', p_driver_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', 'INTERNAL_ERROR',
    'message', SQLERRM
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 10. FUNCIONES DE CONTEXTO RLS DUALES Y SEGURAS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_app_user_id() RETURNS UUID AS $$
  SELECT COALESCE(
    auth.uid(),
    NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.current_app_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_role', true), ''),
    (auth.jwt() ->> 'user_role'),
    'anon'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.current_app_franchise_id() RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_franchise_id', true), '')::uuid,
    (auth.jwt() ->> 'franchise_id')::uuid
  );
$$ LANGUAGE sql STABLE;

-- ---------------------------------------------------------------------
-- 11. HABILITACIÓN DE RLS Y POLÍTICAS COHERENTES
-- ---------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- 11.1 Políticas para public.orders
DROP POLICY IF EXISTS "orders_party_isolation" ON public.orders;
CREATE POLICY "orders_party_isolation" ON public.orders FOR SELECT
  USING (
    customer_id = public.current_app_user_id() 
    OR driver_id = public.current_app_user_id()
    OR (merchant_id IS NOT NULL AND merchant_id IN (
      SELECT id FROM public.merchants WHERE profile_id = public.current_app_user_id()
    ))
    OR franchise_id = public.current_app_franchise_id()
    OR public.current_app_role() IN ('superadmin', 'master', 'dispatcher')
  );

DROP POLICY IF EXISTS "orders_customer_insert" ON public.orders;
CREATE POLICY "orders_customer_insert" ON public.orders FOR INSERT
  WITH CHECK (
    customer_id = public.current_app_user_id() 
    OR public.current_app_role() IN ('superadmin', 'master')
  );

DROP POLICY IF EXISTS "orders_admin_dispatcher_update" ON public.orders;
CREATE POLICY "orders_admin_dispatcher_update" ON public.orders FOR UPDATE
  USING (
    customer_id = public.current_app_user_id()
    OR driver_id = public.current_app_user_id()
    OR (merchant_id IS NOT NULL AND merchant_id IN (
      SELECT id FROM public.merchants WHERE profile_id = public.current_app_user_id()
    ))
    OR public.current_app_role() IN ('superadmin', 'master', 'dispatcher')
  );

-- 11.2 Políticas para public.order_stops
DROP POLICY IF EXISTS "order_stops_access_policy" ON public.order_stops;
CREATE POLICY "order_stops_access_policy" ON public.order_stops FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_stops.order_id
        AND (
          o.customer_id = public.current_app_user_id()
          OR o.driver_id = public.current_app_user_id()
          OR o.franchise_id = public.current_app_franchise_id()
          OR public.current_app_role() IN ('superadmin', 'master', 'dispatcher')
        )
    )
  );

-- 11.3 Políticas para public.pricing_rules (Lectura pública, edición master)
DROP POLICY IF EXISTS "pricing_rules_read_all" ON public.pricing_rules;
CREATE POLICY "pricing_rules_read_all" ON public.pricing_rules FOR SELECT TO anon, authenticated
  USING (is_active = TRUE OR public.current_app_role() IN ('superadmin', 'master'));

DROP POLICY IF EXISTS "pricing_rules_write_master" ON public.pricing_rules;
CREATE POLICY "pricing_rules_write_master" ON public.pricing_rules FOR ALL TO authenticated
  USING (public.current_app_role() IN ('superadmin', 'master'));

-- ---------------------------------------------------------------------
-- 12. GRANTS Y PERMISOS MÍNIMOS
-- ---------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.order_stops TO authenticated;
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT SELECT ON public.pricing_rules TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_order_pod TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_order_atomic TO authenticated;
