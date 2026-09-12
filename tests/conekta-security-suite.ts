/**
 * Suite de Pruebas de Regresión Adversarial y Eficacia de Seguridad Conekta (Fase 6)
 */
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/payments/webhook/route'

export async function testConektaWebhookSecuritySuite(): Promise<{
  passCount: number
  totalCount: number
  results: { test: string; status: 'PASS' | 'FAIL'; note?: string }[]
}> {
  const results: { test: string; status: 'PASS' | 'FAIL'; note?: string }[] = []

  const basePayload = JSON.stringify({
    type: 'order.paid',
    data: {
      object: {
        id: 'ord_adversarial_test_1',
        amount: 8500,
        currency: 'MXN'
      }
    }
  })

  // TEST 1: Sin firma -> Rechazado 401
  const req1 = new NextRequest('http://localhost:3333/api/payments/webhook', {
    method: 'POST',
    body: basePayload,
    headers: { 'content-type': 'application/json' }
  })
  const res1 = await POST(req1)
  results.push({
    test: 'NO_SIGNATURE_REJECTED',
    status: res1.status === 401 ? 'PASS' : 'FAIL',
    note: `Status obtenido: ${res1.status}`
  })

  // TEST 2: Firma inválida / manipulada -> Rechazado 401
  const req2 = new NextRequest('http://localhost:3333/api/payments/webhook', {
    method: 'POST',
    body: basePayload,
    headers: {
      'content-type': 'application/json',
      'x-conekta-signature': 'tampered_or_invalid_signature_base64=='
    }
  })
  const res2 = await POST(req2)
  results.push({
    test: 'INVALID_SIGNATURE_REJECTED',
    status: res2.status === 401 ? 'PASS' : 'FAIL',
    note: `Status obtenido: ${res2.status}`
  })

  // TEST 3: Orden inexistente -> NO marcar pagado (404 Not Found)
  const req3 = new NextRequest('http://localhost:3333/api/payments/webhook', {
    method: 'POST',
    body: JSON.stringify({
      type: 'order.paid',
      data: {
        object: {
          id: 'ord_non_existent_random_9999',
          amount: 8500,
          currency: 'MXN'
        }
      }
    }),
    headers: {
      'content-type': 'application/json',
      'x-mock-test-key': 'test-local-key' // Bypass dev local autorizado para probar lógica de negocio
    }
  })
  const res3 = await POST(req3)
  results.push({
    test: 'UNKNOWN_ORDER_REJECTED',
    status: res3.status === 404 ? 'PASS' : 'FAIL',
    note: `Status obtenido: ${res3.status}`
  })

  const passCount = results.filter(r => r.status === 'PASS').length
  return { passCount, totalCount: results.length, results }
}
