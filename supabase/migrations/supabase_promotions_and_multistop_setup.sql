-- ====================================================================
-- SCRIPT DE MIGRACIÓN IDEMPOTENTE: PROMOCIONES, DIRECCIONES Y RUTAS MULTI-PARADA (VAMO)
-- ====================================================================
-- Ejecutar este script en el SQL Editor del Dashboard de Supabase.

-- 1. TABLA DE PROMOCIONES DE COMERCIOS (PUBLIC.MERCHANT_PROMOTIONS)
CREATE TABLE IF NOT EXISTS public.merchant_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  discount_badge TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  badge_type TEXT DEFAULT 'POPULAR',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en Promociones
ALTER TABLE public.merchant_promotions ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Lectura pública de promociones activas
DROP POLICY IF EXISTS "Promociones son visibles para todos" ON public.merchant_promotions;
CREATE POLICY "Promociones son visibles para todos"
  ON public.merchant_promotions FOR SELECT TO anon, authenticated
  USING (is_active = TRUE);

-- Política de RLS: Comercios y Superadmins crean y editan promociones
DROP POLICY IF EXISTS "Comercios y Admins gestionan sus promociones" ON public.merchant_promotions;
CREATE POLICY "Comercios y Admins gestionan sus promociones"
  ON public.merchant_promotions FOR ALL TO authenticated
  USING (
    merchant_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('superadmin', 'merchant')
    )
  );

-- 2. TABLA DE DIRECCIONES FRECUENTES GUARDADAS (PUBLIC.SAVED_ADDRESSES)
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en Direcciones Guardadas
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Los usuarios manejan exclusivamente sus direcciones
DROP POLICY IF EXISTS "Usuarios ven y gestionan sus propias direcciones" ON public.saved_addresses;
CREATE POLICY "Usuarios ven y gestionan sus propias direcciones"
  ON public.saved_addresses FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- 3. EXTENSIÓN DE SERVICIOS PARA PARADAS MÚLTIPLES Y ENCARGOS COMBINADOS
-- Agregar columnas JSONB a la tabla public.services si existen
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    ALTER TABLE public.services ADD COLUMN IF NOT EXISTS intermediate_stops JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.services ADD COLUMN IF NOT EXISTS combo_items JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ====================================================================
-- 4. CUBETA DE ALMACENAMIENTO DE IMÁGENES (SUPABASE STORAGE BUCKET)
-- ====================================================================
-- Crear bucket público 'store-assets' para fotos de productos y locales
INSERT INTO storage.buckets (id, name, public) 
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de lectura pública para la cubeta de imágenes
DROP POLICY IF EXISTS "Lectura pública de fotos de comercios" ON storage.objects;
CREATE POLICY "Lectura pública de fotos de comercios"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'store-assets');

-- Política de subida de imágenes para usuarios autenticados
DROP POLICY IF EXISTS "Comercios y usuarios pueden subir fotos" ON storage.objects;
CREATE POLICY "Comercios y usuarios pueden subir fotos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-assets');


