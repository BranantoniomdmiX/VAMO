const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

const env = dotenv.parse(fs.readFileSync('.env.local'));
const client = new Client({ connectionString: env.DATABASE_ADMIN_URL, ssl: false });

async function syncKds() {
  await client.connect();
  await client.query(`
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
      v_valid_statuses TEXT[] := ARRAY['PENDING', 'ACCEPTED_BIZ', 'PREPARING', 'READY_BIZ', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
    BEGIN
      IF NOT (p_new_status = ANY(v_valid_statuses)) THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATUS', 'message', 'Estado KDS no válido: ' || p_new_status);
      END IF;

      SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
      IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND', 'message', 'Pedido no encontrado.');
      END IF;

      UPDATE public.orders SET status = p_new_status, updated_at = NOW() WHERE id = p_order_id;

      RETURN jsonb_build_object(
        'success', true,
        'code', 'KDS_STATUS_UPDATED',
        'message', 'Comanda de cocina actualizada a: ' || p_new_status,
        'order_id', p_order_id,
        'new_status', p_new_status
      );
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'code', 'KDS_ERROR', 'message', SQLERRM);
    END;
    $$;
  `);
  console.log('✅ update_kds_order_status sincronizado con READY_BIZ.');
  await client.end();
}

syncKds().catch(console.error);
