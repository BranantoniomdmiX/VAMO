-- =====================================================================
-- 🍳 VAMO KDS (KITCHEN DISPLAY SYSTEM) & COMANDAS DE COCINA VISUAL
-- Transiciones atómicas de preparación y métricas de tiempo de cocina
-- =====================================================================

CREATE OR REPLACE FUNCTION public.update_kds_order_status(
  p_order_id UUID,
  p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_valid_statuses TEXT[] := ARRAY['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
BEGIN
  -- 1. Validar estado permitido
  IF NOT (p_new_status = ANY(v_valid_statuses)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_STATUS',
      'message', 'Estado KDS no válido: ' || p_new_status
    );
  END IF;

  -- 2. Bloquear y verificar existencia de la orden
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND', 'message', 'Pedido no encontrado.');
  END IF;

  -- 3. Actualizar estado y fecha de actualización
  UPDATE public.orders
  SET 
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'KDS_STATUS_UPDATED',
    'message', 'Comanda de cocina actualizada a: ' || p_new_status,
    'order_id', p_order_id,
    'order_code', v_order.code,
    'previous_status', v_order.status,
    'new_status', p_new_status,
    'updated_at', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'KDS_ERROR', 'message', SQLERRM);
END;
$$;
