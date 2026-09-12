/**
 * Utilidades de formato para VAMO (es-MX)
 * Garantiza consistencia monetaria, numérica y de fechas en toda la plataforma.
 */

/**
 * Formatea un número o string a divisa oficial mexicana (MXN).
 * Ejemplo: 1500 -> "$1,500.00 MXN"
 */
export function formatCurrencyMXN(amount: number | string | null | undefined, includeCode: boolean = true): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : Number(amount || 0)
  const safe = isNaN(numeric) ? 0 : numeric

  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safe)

  return includeCode ? `${formatted} MXN` : formatted
}

/**
 * Formatea cantidades enteras con separador de miles es-MX.
 * Ejemplo: 12450 -> "12,450"
 */
export function formatNumberMX(val: number | string | null | undefined): string {
  const numeric = typeof val === 'string' ? parseFloat(val) : Number(val || 0)
  const safe = isNaN(numeric) ? 0 : numeric

  return new Intl.NumberFormat('es-MX').format(safe)
}

/**
 * Formateador de fecha legible para usuarios en México.
 * Ejemplo: "11 de sept. de 2026, 18:00"
 */
export function formatDateMX(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'Fecha no disponible'
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return 'Fecha inválida'

    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d)
  } catch {
    return 'Fecha no disponible'
  }
}
