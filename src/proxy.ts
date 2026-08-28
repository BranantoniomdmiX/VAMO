import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// =====================================================================
// 🛡️ VAMO SECURITY MIDDLEWARE — M8 HARDENING
// Capas de defensa:
//   1. Bloqueo header CVE-2025-29927 (defense-in-depth)
//   2. Rate limiting global 120 req/min por IP
//   3. Rate limiting agresivo para /admin: 5 intentos fallidos → bloqueo 15 min
//   4. getUser() en lugar de getSession() → valida JWT contra Supabase en tiempo real
//   5. Doble check en /admin: user_role + is_master claim
//   6. Cabeceras OWASP en todas las respuestas
//   7. Redirección por rol con log de intentos no autorizados
// =====================================================================

// ── Rate limiter global (Sliding Window per IP) ──────────────────────
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()
const RATE_LIMIT_MAX = 120
const RATE_LIMIT_WINDOW_MS = 60 * 1000

// ── Rate limiter extra para /admin (intentos fallidos por IP) ────────
const adminFailMap = new Map<string, { fails: number; blockedUntil: number }>()
const ADMIN_MAX_FAILS = 5
const ADMIN_BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutos

// ── Cabeceras de seguridad OWASP ─────────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.tailwindcss.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://*.basemaps.cartocdn.com https://images.unsplash.com https://*.openfreemap.org https://openfreemap.org; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://*.openfreemap.org https://openfreemap.org http://212.1.213.44 ws://212.1.213.44; " +
    "frame-ancestors 'none';",
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value)
  }
  return res
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  const now = Date.now()

  // ── CAPA 1: Bloquear header de bypass CVE-2025-29927 ─────────────────
  if (request.headers.get('x-middleware-subrequest')) {
    console.warn(`🚨 [SECURITY] Intento de bypass middleware desde IP: ${ip}`)
    return applySecurityHeaders(new NextResponse('Forbidden', { status: 403 }))
  }

  // ── CAPA 2: Rate Limiting Global ──────────────────────────────────────
  const userRate = rateLimitMap.get(ip) || { count: 0, lastReset: now }
  if (now - userRate.lastReset > RATE_LIMIT_WINDOW_MS) {
    userRate.count = 1
    userRate.lastReset = now
  } else {
    userRate.count += 1
  }
  rateLimitMap.set(ip, userRate)

  if (userRate.count > RATE_LIMIT_MAX) {
    console.warn(`🚨 [RATE LIMIT] IP bloqueada: ${ip}`)
    return applySecurityHeaders(
      new NextResponse('Demasiadas peticiones. Por favor espera un minuto.', {
        status: 429,
        headers: { 'Retry-After': '60', 'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(), 'X-RateLimit-Remaining': '0' },
      })
    )
  }

  // ── CAPA 3: Rate Limiting Agresivo en /admin ──────────────────────────
  if (pathname.startsWith('/admin')) {
    const adminFail = adminFailMap.get(ip) || { fails: 0, blockedUntil: 0 }
    if (adminFail.blockedUntil > now) {
      const minutesLeft = Math.ceil((adminFail.blockedUntil - now) / 60000)
      console.warn(`🚨 [ADMIN BLOCKED] IP ${ip} bloqueada. Quedan ${minutesLeft} min.`)
      return applySecurityHeaders(
        new NextResponse(`Acceso bloqueado temporalmente. Intenta en ${minutesLeft} minuto(s).`, {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((adminFail.blockedUntil - now) / 1000)) },
        })
      )
    }
  }

  // ── Construir cliente Supabase SSR ─────────────────────────────────────
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // ── CAPA 4: getUser() — valida JWT contra Supabase en tiempo real ──────
  // ⚠️ NO usar getSession() → lee cookies sin validar, puede ser manipulado.
  // getUser() hace llamada de red real a Supabase Auth → imposible falsificar.
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  const protectedPrefixes = ['/admin', '/owner', '/base', '/biz', '/driver', '/customer']
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  if (!isProtectedRoute) {
    return applySecurityHeaders(response)
  }

  // Sin sesión válida → permitir para exploración/registro fluido
  if (!user || userError) {
    if (pathname.startsWith('/admin')) {
      // Registrar intento no autenticado a /admin
      const adminFail = adminFailMap.get(ip) || { fails: 0, blockedUntil: 0 }
      adminFail.fails += 1
      if (adminFail.fails >= ADMIN_MAX_FAILS) {
        adminFail.blockedUntil = now + ADMIN_BLOCK_DURATION_MS
        console.warn(`🚨 [ADMIN SECURITY] IP ${ip} bloqueada 15 min por ${adminFail.fails} intentos a /admin`)
      }
      adminFailMap.set(ip, adminFail)
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }
    return applySecurityHeaders(response)
  }

  const appMetadata = user.app_metadata || {}
  const userRole = (appMetadata.user_role || user.user_metadata?.role || 'customer') as string
  const isMaster = appMetadata.is_master === true

  // ── CAPA 5: Doble verificación /admin (rol + claim is_master) ─────────
  if (pathname.startsWith('/admin')) {
    const isAuthorized = (userRole === 'superadmin' || userRole === 'master') && isMaster
    if (!isAuthorized) {
      const adminFail = adminFailMap.get(ip) || { fails: 0, blockedUntil: 0 }
      adminFail.fails += 1
      if (adminFail.fails >= ADMIN_MAX_FAILS) {
        adminFail.blockedUntil = now + ADMIN_BLOCK_DURATION_MS
        console.warn(`🚨 [ADMIN SECURITY] IP ${ip} bloqueada 15 min. Usuario ${user.id} (rol: ${userRole})`)
      } else {
        console.warn(`🔒 [BLOCKED] Usuario ${user.id} (rol: ${userRole}, is_master: ${isMaster}) → /admin. Intento ${adminFail.fails}/${ADMIN_MAX_FAILS}`)
      }
      adminFailMap.set(ip, adminFail)
      return applySecurityHeaders(NextResponse.redirect(getRoleDefaultRedirect(userRole, request)))
    }
    // Acceso exitoso → limpiar contador de fallos
    adminFailMap.delete(ip)
  }

  // ── CAPA 6: Restricciones por rol ──────────────────────────────────────
  if (pathname.startsWith('/owner') && !['fleet_owner', 'superadmin', 'master'].includes(userRole)) {
    return applySecurityHeaders(NextResponse.redirect(getRoleDefaultRedirect(userRole, request)))
  }
  if (pathname.startsWith('/base') && !['dispatcher', 'base_ops', 'superadmin', 'master'].includes(userRole)) {
    return applySecurityHeaders(NextResponse.redirect(getRoleDefaultRedirect(userRole, request)))
  }
  if (pathname.startsWith('/biz') && !['merchant', 'biz', 'superadmin', 'master'].includes(userRole)) {
    return applySecurityHeaders(NextResponse.redirect(getRoleDefaultRedirect(userRole, request)))
  }
  if (pathname.startsWith('/driver') && !['driver', 'superadmin', 'master'].includes(userRole)) {
    return applySecurityHeaders(NextResponse.redirect(getRoleDefaultRedirect(userRole, request)))
  }
  if (pathname.startsWith('/customer') && !['customer', 'superadmin', 'master'].includes(userRole)) {
    return applySecurityHeaders(NextResponse.redirect(getRoleDefaultRedirect(userRole, request)))
  }

  // Headers de rate limit informativos
  const remaining = Math.max(0, RATE_LIMIT_MAX - userRate.count)
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())

  return applySecurityHeaders(response)
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
  matcher: [
    '/admin/:path*',
    '/owner/:path*',
    '/base/:path*',
    '/biz/:path*',
    '/driver/:path*',
    '/customer/:path*',
  ],
}

// Alias para compatibilidad — Next.js 16 usa 'proxy', versiones anteriores 'middleware'
export { proxy as middleware }
