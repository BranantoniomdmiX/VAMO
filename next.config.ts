import type { NextConfig } from "next";

// =====================================================================
// 🛡️ VAMO — Cabeceras HTTP de Seguridad (OWASP) en next.config.ts
// Nota: Content-Security-Policy se aplica por-request en middleware.ts
//       para poder ser más granular según la ruta.
// =====================================================================

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // HSTS mejorado: 2 años + preload para registro en navegadores
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Limita acceso a APIs del navegador
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()',
          },
        ],
      },
    ]
  },
};

export default nextConfig;

