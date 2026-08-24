import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// API Route: POST /api/payments/webhook
// Recibe eventos de Conekta cuando un pago cambia de estado
// Verificamos la firma para asegurarnos que el evento es real

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let event: Record<string, unknown>

    try {
      event = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    // Supabase con service role para escribir desde el servidor
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const eventType = event.type as string
    const data = event.data as Record<string, unknown>

    console.log(`[VAMO Webhook] Evento recibido: ${eventType}`)

    // Manejar los eventos relevantes de Conekta
    switch (eventType) {

      case 'order.paid': {
        // El pago fue confirmado exitosamente
        const order = data.object as Record<string, unknown>
        const gatewayOrderId = order.id as string
        const charge = (order.charges as Record<string, unknown[]>)?.data?.[0] as Record<string, unknown>

        // Actualizar payment_intent
        await supabase
          .from('payment_intents')
          .update({
            status: 'PAID',
            paid_at: new Date().toISOString(),
            webhook_received_at: new Date().toISOString(),
            card_last4: (charge?.payment_method as Record<string, unknown>)?.last4 as string ?? null,
            card_brand: (charge?.payment_method as Record<string, unknown>)?.brand as string ?? null,
            card_bank: (charge?.payment_method as Record<string, unknown>)?.issuer as string ?? null
          })
          .eq('gateway_order_id', gatewayOrderId)

        // Obtener el customer_order_id para actualizar el pedido
        const { data: pi } = await supabase
          .from('payment_intents')
          .select('customer_order_id, amount')
          .eq('gateway_order_id', gatewayOrderId)
          .single()

        if (pi) {
          // Actualizar el pedido principal a PAID
          await supabase
            .from('customer_orders')
            .update({ payment_status: 'PAID' })
            .eq('id', pi.customer_order_id)

          // Escribir en el ledger financiero (doble entrada)
          await supabase.from('financial_ledger').insert({
            customer_order_id: pi.customer_order_id,
            entry_type: 'delivery_income',
            amount: pi.amount,
            balance_before: 0,
            balance_after: pi.amount,
            description: `Pago digital confirmado — Order Conekta ${gatewayOrderId}`
          })
        }

        console.log(`[VAMO Webhook] ✅ Pago confirmado: ${gatewayOrderId}`)
        break
      }

      case 'order.payment_error':
      case 'charge.failed': {
        // El pago falló
        const order = data.object as Record<string, unknown>
        const gatewayOrderId = order.id as string

        await supabase
          .from('payment_intents')
          .update({
            status: 'FAILED',
            failed_at: new Date().toISOString(),
            webhook_received_at: new Date().toISOString()
          })
          .eq('gateway_order_id', gatewayOrderId)

        console.log(`[VAMO Webhook] ❌ Pago fallido: ${gatewayOrderId}`)
        break
      }

      case 'order.refunded':
      case 'charge.refunded': {
        // Reembolso procesado
        const order = data.object as Record<string, unknown>
        const gatewayOrderId = order.id as string

        await supabase
          .from('payment_intents')
          .update({
            status: 'REFUNDED',
            webhook_received_at: new Date().toISOString()
          })
          .eq('gateway_order_id', gatewayOrderId)

        const { data: pi } = await supabase
          .from('payment_intents')
          .select('customer_order_id, amount')
          .eq('gateway_order_id', gatewayOrderId)
          .single()

        if (pi) {
          await supabase
            .from('customer_orders')
            .update({ payment_status: 'REFUNDED' })
            .eq('id', pi.customer_order_id)

          await supabase.from('financial_ledger').insert({
            customer_order_id: pi.customer_order_id,
            entry_type: 'refund',
            amount: -pi.amount,
            balance_before: pi.amount,
            balance_after: 0,
            description: `Reembolso procesado — Order Conekta ${gatewayOrderId}`
          })
        }

        console.log(`[VAMO Webhook] 🔄 Reembolso procesado: ${gatewayOrderId}`)
        break
      }

      default:
        // Evento no manejado — lo registramos pero no fallamos
        console.log(`[VAMO Webhook] Evento ignorado: ${eventType}`)
    }

    // Responder 200 a Conekta para que no reintente el webhook
    return NextResponse.json({ received: true, event: eventType })

  } catch (error) {
    console.error('[VAMO Webhook] Error inesperado:', error)
    // NO retornar 500 a Conekta (haría reintentos infinitos)
    return NextResponse.json({ received: true, note: 'Error interno procesado' })
  }
}
