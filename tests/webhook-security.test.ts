/**
 * Test de regresión de seguridad: Validación estricta de Webhook de Conekta (CRITICAL-03)
 */
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/payments/webhook/route'

export async function testWebhookSecurityRegression(): Promise<{ success: boolean; details: string[] }> {
  const details: string[] = []
  
  // 1. Webhook apócrifo sin cabecera de firma
  const forgedPayload = JSON.stringify({
    type: 'order.paid',
    data: { object: { id: 'ord_forged_attack_9999' } }
  })

  const reqNoSig = new NextRequest('http://localhost:3333/api/payments/webhook', {
    method: 'POST',
    body: forgedPayload,
    headers: { 'content-type': 'application/json' }
  })

  const resNoSig = await POST(reqNoSig)
  if (resNoSig.status !== 401) {
    throw new Error(`FALLO REGRESIÓN: Se esperaba 401 para webhook sin firma, se obtuvo ${resNoSig.status}`)
  }
  details.push('PASS: Rechazado webhook sin firma criptográfica (401 Unauthorized)')

  // 2. Webhook apócrifo con firma manipulada
  const reqBadSig = new NextRequest('http://localhost:3333/api/payments/webhook', {
    method: 'POST',
    body: forgedPayload,
    headers: {
      'content-type': 'application/json',
      'x-conekta-signature': 'invalid_forged_base64_sig_here=='
    }
  })

  const resBadSig = await POST(reqBadSig)
  if (resBadSig.status !== 401) {
    throw new Error(`FALLO REGRESIÓN: Se esperaba 401 para firma inválida, se obtuvo ${resBadSig.status}`)
  }
  details.push('PASS: Rechazado webhook con firma falsa/manipulada (401 Unauthorized)')

  return { success: true, details }
}
