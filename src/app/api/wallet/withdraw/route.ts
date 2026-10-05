import { NextResponse, type NextRequest } from 'next/server'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { profileId: requestedProfileId, amount, clabe } = await request.json().catch(() => ({}))

    if (!amount || !clabe) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', message: 'Se requieren amount y clabe obligatorios.' },
        { status: 400 }
      )
    }

    if (clabe.length !== 18) {
      return NextResponse.json(
        { success: false, code: 'INVALID_CLABE', message: 'La cuenta CLABE debe contener exactamente 18 dígitos.' },
        { status: 400 }
      )
    }

    const authResult = await withTrustedAuthContext(async (authContext, client) => {
      // El perfil DEBE ser el del usuario autenticado, a menos que sea superadmin/master
      let effectiveProfileId = authContext.userId
      if (authContext.role !== 'superadmin' && authContext.role !== 'master') {
        if (requestedProfileId && requestedProfileId !== authContext.userId) {
          return {
            status: 403,
            body: { success: false, code: 'FORBIDDEN_PROFILE_MISMATCH', message: 'No puede solicitar retiros para una cuenta ajena.' },
          }
        }
        effectiveProfileId = authContext.userId
      } else if (requestedProfileId) {
        effectiveProfileId = requestedProfileId
      }

      const res = await client.query<{ request_wallet_withdrawal: any }>(
        'SELECT public.request_wallet_withdrawal($1, $2, $3) as request_wallet_withdrawal;',
        [effectiveProfileId, amount, clabe]
      )

      const result = res.rows[0]?.request_wallet_withdrawal

      if (!result?.success) {
        return {
          status: 400,
          body: result || { success: false, message: 'Fondos insuficientes.' },
        }
      }

      return {
        status: 200,
        body: result,
      }
    })

    if (!authResult) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'Sesión no válida o ausente.' },
        { status: 401 }
      )
    }

    return NextResponse.json(authResult.body, { status: authResult.status })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: error.message || 'Error al solicitar el retiro.' },
      { status: 500 }
    )
  }
}
