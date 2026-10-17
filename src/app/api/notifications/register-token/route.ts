import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTrustedAuthContext } from '@/lib/auth/contextResolver'

// POST /api/notifications/register-token
// Registra o actualiza el token Push (FCM / Web Push) del dispositivo
export async function POST(req: NextRequest) {
  try {
    const authContext = await getTrustedAuthContext()
    if (!authContext) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', error: 'Sesión no válida o ausente.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { deviceToken, platform, deviceInfo } = body

    if (!deviceToken) {
      return NextResponse.json({ error: 'deviceToken es requerido' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Identidad y rol se derivan ESTRICTAMENTE de la sesión autenticada
    const effectiveUserId = authContext.userId
    const effectiveRole = authContext.role

    const { error: sbError } = await supabase
      .from('device_push_tokens')
      .upsert(
        {
          user_id: effectiveUserId,
          role: effectiveRole,
          device_token: deviceToken,
          platform: platform || 'web',
          device_info: deviceInfo || {},
          is_active: true,
          last_seen_at: new Date().toISOString()
        },
        { onConflict: 'device_token' }
      )

    if (sbError) {
      console.error('[RegisterToken API] Error en Supabase upsert:', sbError)
    }

    // Registrar en PostgreSQL Dokploy usando el pool con credenciales administrativas si procede
    // o fallback informativo (la función register_device_token no está en vamo_app)
    try {
      const { query } = await import('@/lib/db/postgres')
      await query(
        'SELECT public.register_device_token($1, $2, $3);',
        [effectiveUserId, deviceToken, platform || 'web']
      )
    } catch (pgErr) {
      // Si vamo_app no tiene acceso directo a register_device_token, se registra en Supabase
      console.warn('[RegisterToken] Dokploy direct sync notice:', pgErr)
    }

    return NextResponse.json({ success: true, message: 'Token push registrado con éxito.' })
  } catch (err) {
    console.error('[RegisterToken API] Error procesando solicitud:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/notifications/register-token
// Desactiva el token cuando el usuario cierra sesión (Protegido por sesión del usuario)
export async function DELETE(req: NextRequest) {
  try {
    const authContext = await getTrustedAuthContext()
    if (!authContext) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', error: 'Sesión no válida o ausente.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { deviceToken } = body

    if (!deviceToken) {
      return NextResponse.json({ error: 'deviceToken es requerido' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Solo permitir desactivar el token si pertenece al usuario en sesión (o si es superadmin/master)
    let queryBuilder = supabase
      .from('device_push_tokens')
      .update({ is_active: false })
      .eq('device_token', deviceToken)

    if (authContext.role !== 'superadmin' && authContext.role !== 'master') {
      queryBuilder = queryBuilder.eq('user_id', authContext.userId)
    }

    const { error: delError } = await queryBuilder

    if (delError) {
      console.error('[RegisterToken API] Error desactivando token en Supabase:', delError)
    }

    return NextResponse.json({ success: true, message: 'Token desactivado correctamente' })
  } catch (err) {
    console.error('[RegisterToken API] Error eliminando token:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
