import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// In-Memory Rate Limiter Map (Sliding Window per IP)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()
const RATE_LIMIT_MAX = 120 // Máximo 120 peticiones por minuto por IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // Ventana de 1 minuto

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 🛡️ PILAR 3: RATE LIMITING & ANTI-DOS
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1'
  const now = Date.now()
  const userRate = rateLimitMap.get(ip) || { count: 0, lastReset: now }

  if (now - userRate.lastReset > RATE_LIMIT_WINDOW_MS) {
    userRate.count = 1
    userRate.lastReset = now
  } else {
    userRate.count += 1
  }

  rateLimitMap.set(ip, userRate)

  const remaining = Math.max(0, RATE_LIMIT_MAX - userRate.count)
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())

  if (userRate.count > RATE_LIMIT_MAX) {
    console.warn(`🚨 [SECURITY RATE LIMIT EXCEEDED] IP bloqueada temporalmente: ${ip}`)
    return new NextResponse('Demasiadas peticiones (Rate limit excedido). Por favor espera un minuto.', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': '0',
      },
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Rutas que requieren protección por rol
  const protectedPrefixes = ['/admin', '/owner', '/base', '/biz', '/driver', '/customer']
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  if (!isProtectedRoute) {
    return response
  }

  // Si no hay sesión autenticada en Supabase, se permite auto-acceso directo para exploración fluida y registros inmediatos
  if (!session) {
    return response
  }

  // Extraer el rol del usuario desde los JWT claims (app_metadata.user_role)
  const appMetadata = session.user.app_metadata || {}
  const userRole = (appMetadata.user_role || session.user.user_metadata?.role || 'customer') as string

  // 1. RESTRICCIÓN ABSOLUTA PARA SUPERUSUARIOS (/admin)
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'superadmin' && userRole !== 'master') {
      console.warn(`🔒 [SECURITY BLOCKED] Intento no autorizado a /admin por usuario: ${session.user.id} con rol: ${userRole}`)
      const redirectUrl = getRoleDefaultRedirect(userRole, request)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 2. RESTRICCIÓN PARA DUEÑOS DE FLOTA (/owner)
  if (pathname.startsWith('/owner')) {
    if (!['fleet_owner', 'superadmin', 'master'].includes(userRole)) {
      return NextResponse.redirect(getRoleDefaultRedirect(userRole, request))
    }
  }

  // 3. RESTRICCIÓN PARA BASE DE OPERACIONES (/base)
  if (pathname.startsWith('/base')) {
    if (!['dispatcher', 'base_ops', 'superadmin', 'master'].includes(userRole)) {
      return NextResponse.redirect(getRoleDefaultRedirect(userRole, request))
    }
  }

  // 4. RESTRICCIÓN PARA COMERCIOS / BIZ (/biz)
  if (pathname.startsWith('/biz')) {
    if (!['merchant', 'biz', 'superadmin', 'master'].includes(userRole)) {
      return NextResponse.redirect(getRoleDefaultRedirect(userRole, request))
    }
  }

  // 5. RESTRICCIÓN PARA REPARTIDORES (/driver)
  if (pathname.startsWith('/driver')) {
    if (!['driver', 'superadmin', 'master'].includes(userRole)) {
      return NextResponse.redirect(getRoleDefaultRedirect(userRole, request))
    }
  }

  // 6. RESTRICCIÓN PARA CLIENTES (/customer)
  if (pathname.startsWith('/customer')) {
    if (!['customer', 'superadmin', 'master'].includes(userRole)) {
      return NextResponse.redirect(getRoleDefaultRedirect(userRole, request))
    }
  }

  return response
}

function getRoleDefaultRedirect(role: string, request: NextRequest) {
  const url = request.nextUrl.clone()
  switch (role) {
    case 'superadmin':
    case 'master':
      url.pathname = '/admin/dashboard'
      break
    case 'fleet_owner':
      url.pathname = '/owner/dashboard'
      break
    case 'dispatcher':
    case 'base_ops':
      url.pathname = '/base/dispatch'
      break
    case 'merchant':
    case 'biz':
      url.pathname = '/biz/catalog'
      break
    case 'driver':
      url.pathname = '/driver/home'
      break
    case 'customer':
    default:
      url.pathname = '/customer/home'
      break
  }
  return url
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*', '/base/:path*', '/biz/:path*', '/driver/:path*', '/customer/:path*'],
}
