import { NextRequest, NextResponse } from 'next/server'
import { FcmServerService } from '@/lib/services/fcmServerService'
import { getTrustedAuthContext } from '@/lib/auth/contextResolver'

// POST /api/notifications/send-push
// Endpoint para emitir notificaciones operativas en segundo plano
// 🛡️ Protegido: Solo accesible por roles autorizados (superadmin, master, dispatcher) o clave interna de backend

export async function POST(req: NextRequest) {
  try {
    const internalSecret = req.headers.get('x-internal-push-secret')
    const configuredSecret = process.env.INTERNAL_PUSH_SECRET

    // 🛡️ REGLA CANÓNICA:
    // NO reutilizar SUPABASE_SERVICE_ROLE_KEY como secreto HTTP interno.
    // Usar INTERNAL_PUSH_SECRET dedicado y fail-closed si no está configurado.
    const isValidInternal = Boolean(
      configuredSecret && 
      configuredSecret.length >= 16 && 
      internalSecret && 
      internalSecret === configuredSecret
    )

    if (!isValidInternal) {
      const authContext = await getTrustedAuthContext()
      if (!authContext) {
        return NextResponse.json(
          { error: 'Sesión no válida o ausente.' },
          { status: 401 }
        )
      }

      if (!['superadmin', 'master', 'dispatcher'].includes(authContext.role)) {
        return NextResponse.json(
          { error: `El rol ${authContext.role} no tiene autorización para emitir notificaciones push.` },
          { status: 403 }
        )
      }
    }

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
