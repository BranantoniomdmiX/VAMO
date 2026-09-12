import { NextResponse, type NextRequest } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTrustedAuthContext } from '@/lib/auth/contextResolver'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authContext = await getTrustedAuthContext()
    if (!authContext) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'Sesión no válida o ausente.' },
        { status: 401 }
      )
    }

    const { profileId: requestedProfileId, amount, clabe } = await request.json().catch(() => ({}))

    if (!amount || !clabe) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', message: 'Se requieren amount y clabe obligatorios.' },
        { status: 400 }
      )
    }

    // El perfil DEBE ser el del usuario autenticado, a menos que sea superadmin
    let effectiveProfileId = authContext.userId
    if (authContext.role !== 'superadmin' && authContext.role !== 'master') {
      if (requestedProfileId && requestedProfileId !== authContext.userId) {
        return NextResponse.json(
          { success: false, code: 'FORBIDDEN_PROFILE_MISMATCH', message: 'No puede solicitar retiros para una cuenta ajena.' },
          { status: 403 }
        )
      }
      effectiveProfileId = authContext.userId
    } else if (requestedProfileId) {
      effectiveProfileId = requestedProfileId
    }

    if (clabe.length !== 18) {
      return NextResponse.json(
        { success: false, code: 'INVALID_CLABE', message: 'La cuenta CLABE debe contener exactamente 18 dígitos.' },
        { status: 400 }
      )
    }

    const res = await query<{ request_wallet_withdrawal: any }>(
      'SELECT public.request_wallet_withdrawal($1, $2, $3) as request_wallet_withdrawal;',
      [effectiveProfileId, amount, clabe]
    )

    const result = res.rows[0]?.request_wallet_withdrawal

    if (!result?.success) {
      return NextResponse.json(result || { success: false, message: 'Fondos insuficientes.' }, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: error.message || 'Error al solicitar el retiro.' },
      { status: 500 }
    )
  }
}
