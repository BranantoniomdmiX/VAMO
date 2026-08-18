-- ====================================================================
-- SCRIPT DE MIGRACIÓN: FLUJO DE 2 CAPAS Y REALTIME KDS/ODS (VAMO)
-- ====================================================================
-- Ejecutar en el SQL Editor del Dashboard de Supabase.

-- 1. CREAR TABLA PUBLIC.MERCHANT_ORDERS
CREATE TABLE IF NOT EXISTS public.merchant_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  order_code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL CHECK (status IN ('PENDING_APPROVAL', 'APPROVED_KITCHEN', 'PREPARING', 'READY_FOR_PICKUP', 'DISPATCHED', 'CANCELLED')),
  notes TEXT,
  prep_extra_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.merchant_orders ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Lectura de pedidos por comercios y usuarios" ON public.merchant_orders;
CREATE POLICY "Lectura de pedidos por comercios y usuarios"
  ON public.merchant_orders FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Inserción y actualización de pedidos por gerencia y cocina" ON public.merchant_orders;
CREATE POLICY "Inserción y actualización de pedidos por gerencia y cocina"
  ON public.merchant_orders FOR ALL TO authenticated
  USING (true);

-- 2. HABILITAR SUPABASE REALTIME EN PUBLIC.MERCHANT_ORDERS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'merchant_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.merchant_orders;
  END IF;
END $$;
