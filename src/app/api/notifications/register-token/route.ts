import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/notifications/register-token
// Registra o actualiza el token Push (FCM / Web Push) del dispositivo

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, role, deviceToken, platform, deviceInfo } = body

    if (!deviceToken) {
      return NextResponse.json({ error: 'deviceToken es requerido' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('device_push_tokens')
      .upsert(
        {
          user_id: userId || null,
          role: role || 'customer',
          device_token: deviceToken,
          platform: platform || 'web',
          device_info: deviceInfo || {},
          is_active: true,
          last_seen_at: new Date().toISOString()
        },
        { onConflict: 'device_token' }
      )
      .select()

    if (error) {
      console.error('[RegisterToken API] Error en upsert:', error)
      return NextResponse.json({ error: 'Error guardando token' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[RegisterToken API] Error procesando solicitud:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/notifications/register-token
// Desactiva el token cuando el usuario cierra sesión
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { deviceToken } = body

    if (!deviceToken) {
      return NextResponse.json({ error: 'deviceToken es requerido' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase
      .from('device_push_tokens')
      .update({ is_active: false })
      .eq('device_token', deviceToken)

    return NextResponse.json({ success: true, message: 'Token desactivado correctamente' })
  } catch (err) {
    console.error('[RegisterToken API] Error eliminando token:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
