-- =====================================================================
-- VAMO M9 — Tabla de Intenciones de Pago (Payment Gateway Integration)
-- Pasarela: Conekta (sandbox primero)
-- Ejecutar en: Supabase SQL Editor — proyecto cheoxokdpgbjgfdghhzt
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id     UUID REFERENCES public.customer_orders(id) ON DELETE CASCADE NOT NULL,
  
  -- Datos de la pasarela
  gateway               TEXT NOT NULL DEFAULT 'conekta' CHECK (gateway IN ('conekta', 'stripe', 'mercadopago')),
  gateway_order_id      TEXT NOT NULL,          -- ID del Order/Charge en Conekta (ej. ord_...)
  gateway_payment_url   TEXT,                   -- URL de Checkout hosted de Conekta
  
  -- Montos
  amount                NUMERIC(10,2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'MXN',
  
  -- Estado del pago
  status                TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'EXPIRED', 'DECLINED')
  ),
  
  -- Método de pago elegido por el cliente
  payment_method_type   TEXT CHECK (
    payment_method_type IN ('card', 'oxxo_cash', 'spei', 'cash', 'wallet')
  ),
  
  -- Datos de la tarjeta (solo metadata, nunca el número completo)
  card_last4            TEXT,       -- Últimos 4 dígitos (Conekta los provee)
  card_brand            TEXT,       -- 'visa', 'mastercard', 'amex'
  card_bank             TEXT,       -- Banco emisor
  
  -- Referencia para pagos en OXXO/SPEI
  payment_reference     TEXT,       -- Número de referencia OXXO o CLABE SPEI
  payment_expires_at    TIMESTAMPTZ,-- Cuándo vence la referencia OXXO (usualmente 3 días)
  
  -- Timestamps del ciclo de vida
  webhook_received_at   TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  failed_at             TIMESTAMPTZ,
  
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_payment_intents_order_id ON public.payment_intents(customer_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_gateway_order ON public.payment_intents(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(status);

-- RLS: Habilitar Row Level Security
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

-- Policy: El cliente solo puede VER sus propios payment_intents
-- (via el customer_order_id que es suyo)
CREATE POLICY "customer_can_view_own_payment_intents" ON public.payment_intents
  FOR SELECT USING (
    customer_order_id IN (
      SELECT id FROM public.customer_orders 
      WHERE customer_id = auth.uid()
    )
  );

-- Policy: Superadmin puede ver todo
CREATE POLICY "superadmin_full_access_payment_intents" ON public.payment_intents
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = 'superadmin'
    AND (auth.jwt() ->> 'is_master')::boolean = true
  );

-- Trigger: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payment_intents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION update_payment_intents_updated_at();

-- Agregar a Supabase Realtime (para que el cliente vea el pago confirmado en tiempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_intents;
