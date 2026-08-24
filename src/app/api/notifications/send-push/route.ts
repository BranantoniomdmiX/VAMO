import { NextRequest, NextResponse } from 'next/server'
import { FcmServerService } from '@/lib/services/fcmServerService'

// POST /api/notifications/send-push
// Endpoint para emitir notificaciones operativas en segundo plano

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { targetType, targetId, role, title, body: messageBody, url, data } = body

    if (!title || !messageBody) {
      return NextResponse.json({ error: 'title y body son requeridos' }, { status: 400 })
    }

    const payload = {
      title,
      body: messageBody,
      url: url || '/',
      data: data || {}
    }

    if (targetType === 'user' && targetId) {
      const result = await FcmServerService.sendToUser(targetId, payload)
      return NextResponse.json(result)
    }

    if (targetType === 'role' && role) {
      const result = await FcmServerService.sendToRole(role, payload)
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'targetType debe ser "user" con targetId, o "role" con role' },
      { status: 400 }
    )
  } catch (err) {
    console.error('[SendPush API] Error inesperado:', err)
    return NextResponse.json({ error: 'Error enviando notificación' }, { status: 500 })
  }
}
