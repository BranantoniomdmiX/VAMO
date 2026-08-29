-- =====================================================================
-- ⚡ VAMO DISPATCH ENGINE: ASIGNACIÓN ATÓMICA CON ROW-LEVEL LOCKING
-- Impide colisiones y condiciones de carrera (Race Conditions)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.assign_order_atomic(
  p_order_id UUID,
  p_driver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_record RECORD;
  v_driver_record RECORD;
  v_result JSONB;
BEGIN
  -- 1. Validar existencia y estado del conductor
  SELECT * INTO v_driver_record
  FROM public.drivers
  WHERE id = p_driver_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'DRIVER_NOT_FOUND',
      'message', 'El conductor no existe o no tiene perfil registrado.'
    );
  END IF;

  -- 2. Bloquear la fila de la orden en modo exclusivo (FOR UPDATE)
  -- Si otro conductor intenta leer la misma fila en este instante, esperará a que termine esta transacción
  SELECT * INTO v_order_record
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDER_NOT_FOUND',
      'message', 'El pedido especificado no fue encontrado.'
    );
  END IF;

  -- 3. Verificar si la orden ya fue tomada por otro conductor
  IF v_order_record.driver_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDER_ALREADY_TAKEN',
      'message', 'Lo sentimos, este pedido ya fue aceptado por otro repartidor.'
    );
  END IF;

  -- 4. Verificar que el estado del pedido permita asignación
  IF v_order_record.status NOT IN ('PENDING', 'ACCEPTED_BIZ', 'PREPARING', 'READY_BIZ') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_ORDER_STATUS',
      'message', 'El pedido ya no se encuentra disponible para asignación (Estado: ' || v_order_record.status || ').'
    );
  END IF;

  -- 5. Ejecutar la asignación atómica
  UPDATE public.orders
  SET 
    driver_id = p_driver_id,
    status = 'DRIVER_ASSIGNED',
    updated_at = NOW()
  WHERE id = p_order_id;

  -- 6. Actualizar el estado del conductor a OCUPADO
  UPDATE public.drivers
  SET 
    status = 'BUSY'
  WHERE id = p_driver_id;

  -- 7. Retornar éxito con detalles de la orden
  RETURN jsonb_build_object(
    'success', true,
    'code', 'ORDER_ASSIGNED_SUCCESSFULLY',
    'message', '¡Pedido asignado exitosamente! Inicia tu ruta.',
    'order_id', p_order_id,
    'order_code', v_order_record.code,
    'origin_address', v_order_record.origin_address,
    'destination_address', v_order_record.destination_address,
    'total', v_order_record.total
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', 'TRANSACTION_ERROR',
    'message', SQLERRM
  );
END;
$$;
