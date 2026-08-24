-- =====================================================================
-- VAMO M12 — Tabla de Calificaciones y Reseñas (Ratings & Reviews)
-- Ejecutar en: Supabase SQL Editor — proyecto cheoxokdpgbjgfdghhzt
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.service_ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code      TEXT NOT NULL,
  service_id      UUID REFERENCES public.customer_orders(id) ON DELETE SET NULL,
  
  -- Roles del evaluador y evaluado
  rater_role      TEXT NOT NULL CHECK (rater_role IN ('customer', 'driver', 'merchant')),
  rated_role      TEXT NOT NULL CHECK (rated_role IN ('customer', 'driver', 'merchant')),
  rater_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rated_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Puntuación y contenido
  stars           INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  tags            TEXT[] DEFAULT '{}',
  comment         TEXT,
  tip_amount      NUMERIC(10,2) DEFAULT 0.00,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida de reputación
CREATE INDEX IF NOT EXISTS idx_service_ratings_rated_user ON public.service_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_service_ratings_order_code ON public.service_ratings(order_code);
CREATE INDEX IF NOT EXISTS idx_service_ratings_stars ON public.service_ratings(stars);

-- RLS: Habilitar Row Level Security
ALTER TABLE public.service_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Todos los usuarios autenticados pueden consultar calificaciones públicas
CREATE POLICY "ratings_are_viewable_by_all" ON public.service_ratings
  FOR SELECT USING (true);

-- Policy: El usuario evaluador puede insertar su propia reseña
CREATE POLICY "users_can_create_ratings" ON public.service_ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_user_id OR rater_user_id IS NULL
  );

-- Habilitar Supabase Realtime para la tabla de calificaciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_ratings;
