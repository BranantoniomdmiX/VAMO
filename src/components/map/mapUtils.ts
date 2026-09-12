/**
 * VAMO Map Constants & Pure Helpers
 * Separado de dependencias directas de CSS para testing aislado en Node.js
 */

export const MARKER_DENSITY_THRESHOLD = 25

export type WebGLState =
  | 'WEBGL_AVAILABLE'
  | 'WEBGL_DEGRADED'
  | 'WEBGL_CONTEXT_LOST'
  | 'WEBGL_RESTORED'
  | 'WEBGL_UNAVAILABLE'

export function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return Boolean(gl && gl instanceof WebGLRenderingContext)
  } catch {
    return false
  }
}

export interface NavigationUrlParams {
  destinationTitle?: string
  lat?: number
  lng?: number
  privacyMode?: 'exact' | 'approximate' | 'hidden'
}

/**
 * Genera una URL de navegación externa (Google Maps / Waze) segura:
 * - Si privacyMode es 'hidden': NO retorna URL de navegación exacta.
 * - Si privacyMode es 'approximate': usa el nombre/título de la zona, nunca coordenadas de alta precisión.
 * - Si privacyMode es 'exact': usa coordenadas autorizadas o dirección verificada.
 */
export function buildSafeNavigationUrl(params: NavigationUrlParams): string | null {
  const { destinationTitle, lat, lng, privacyMode = 'exact' } = params

  if (privacyMode === 'hidden') {
    return null
  }

  if (privacyMode === 'approximate') {
    if (destinationTitle) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationTitle)}`
    }
    return null
  }

  // exact mode
  if (typeof lat === 'number' && typeof lng === 'number') {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  }

  if (destinationTitle) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationTitle)}`
  }

  return null
}
