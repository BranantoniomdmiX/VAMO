import { NextRequest, NextResponse } from 'next/server'

// API Route: POST /api/payments/create-order
// Crea un Order en Conekta y devuelve la URL de pago al cliente
// La API Key NUNCA llega al browser — solo vive en el servidor

const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY!
const CONEKTA_API_BASE = 'https://api.conekta.io'

interface CreateOrderBody {
  orderId: string          // ID del pedido en VAMO (customer_orders.id)
  amount: number           // Total en MXN (ej. 85.50)
  paymentMethod: 'card' | 'oxxo_cash' | 'spei' | 'cash'
  customerName: string
  customerEmail: string
  customerPhone: string
  description: string      // Ej. "Envío VAMO #V-1042 — Centro → Juárez"
}

export async function POST(req: NextRequest) {
  try {
    // Validar que la clave privada esté configurada
    if (!CONEKTA_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Pasarela de pagos no configurada. Contacta al administrador.' },
        { status: 503 }
      )
    }

    const body: CreateOrderBody = await req.json()
    const { orderId, amount, paymentMethod, customerName, customerEmail, customerPhone, description } = body

    // Si el método es efectivo, no necesitamos pasar por la pasarela
    if (paymentMethod === 'cash') {
      return NextResponse.json({
        success: true,
        paymentMethod: 'cash',
        redirectUrl: `/customer/tracking/${orderId}`,
        message: 'Pedido confirmado — pago en efectivo al repartidor'
      })
    }

    // Convertir MXN a centavos para Conekta (requiere entero)
    const amountCents = Math.round(amount * 100)

    // Construir el body del Order de Conekta según su API v2.1
    const conektaOrderBody: Record<string, unknown> = {
      currency: 'MXN',
      customer_info: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      },
      line_items: [
        {
          name: description,
          unit_price: amountCents,
          quantity: 1
        }
      ],
      metadata: {
        vamo_order_id: orderId,
        platform: 'VAMO SaaS'
      }
    }

    // Configurar el método de pago según la selección
    if (paymentMethod === 'card') {
      // Checkout hosted — Conekta genera una URL de pago segura
      conektaOrderBody.checkout = {
        type: 'Integration',
        allowed_payment_methods: ['card'],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/payment/${orderId}/success`,
        failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/payment/${orderId}/failed`,
        on_demand_enabled: false
      }
    } else if (paymentMethod === 'oxxo_cash') {
      conektaOrderBody.charges = [
        {
          payment_method: {
            type: 'cash',
            expires_at: Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60) // 3 días
          }
        }
      ]
    } else if (paymentMethod === 'spei') {
      conektaOrderBody.charges = [
        {
          payment_method: {
            type: 'spei',
            expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
          }
        }
      ]
    }

    // Llamar a la API de Conekta
    const conektaRes = await fetch(`${CONEKTA_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONEKTA_PRIVATE_KEY}`,
        'Accept': 'application/vnd.conekta-v2.1.0+json',
        'Accept-Language': 'es'
      },
      body: JSON.stringify(conektaOrderBody)
    })

    if (!conektaRes.ok) {
      const errorData = await conektaRes.json()
      console.error('[VAMO Payments] Error Conekta:', errorData)
      return NextResponse.json(
        { error: 'Error al procesar el pago. Intenta de nuevo.' },
        { status: 400 }
      )
    }

    const conektaOrder = await conektaRes.json()

    // Extraer datos relevantes según el método de pago
    let responseData: Record<string, unknown> = {
      success: true,
      paymentMethod,
      gatewayOrderId: conektaOrder.id
    }

    if (paymentMethod === 'card' && conektaOrder.checkout) {
      responseData.checkoutUrl = conektaOrder.checkout.url
      responseData.checkoutId = conektaOrder.checkout.id
    } else if (paymentMethod === 'oxxo_cash') {
      const charge = conektaOrder.charges?.data?.[0]
      responseData.reference = charge?.payment_method?.reference
      responseData.barcode = charge?.payment_method?.barcode
      responseData.barcodeUrl = charge?.payment_method?.barcode_url
      responseData.expiresAt = charge?.payment_method?.expires_at
      responseData.store = 'OXXO'
    } else if (paymentMethod === 'spei') {
      const charge = conektaOrder.charges?.data?.[0]
      responseData.clabe = charge?.payment_method?.clabe
      responseData.bank = charge?.payment_method?.bank
      responseData.reference = charge?.payment_method?.reference
      responseData.expiresAt = charge?.payment_method?.expires_at
    }

    // Guardar en Supabase (usando service role para escritura desde servidor)
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from('payment_intents').insert({
      customer_order_id: orderId,
      gateway: 'conekta',
      gateway_order_id: conektaOrder.id,
      gateway_payment_url: (responseData.checkoutUrl as string) ?? null,
      amount,
      currency: 'MXN',
      status: 'PENDING',
      payment_method_type: paymentMethod,
      payment_reference: (responseData.reference as string) ?? null,
      payment_expires_at: (responseData.expiresAt as string)
        ? new Date((responseData.expiresAt as number) * 1000).toISOString()
        : null
    })

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('[VAMO Payments] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor de pagos.' },
      { status: 500 }
    )
  }
}
