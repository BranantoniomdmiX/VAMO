import React from 'react'

export type VamoStatusType = 
  | 'DISPONIBLE'
  | 'EN_SERVICIO'
  | 'EN_RUTA'
  | 'PREPARANDO'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO'
  | 'OFFLINE'
  | 'PENDIENTE'

export interface VamoStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: VamoStatusType | string
  label?: string
  size?: 'sm' | 'md'
  showDot?: boolean
}

export const VamoStatusBadge: React.FC<VamoStatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showDot = true,
  className = '',
  ...props
}) => {
  const normStatus = status.toUpperCase()

  const config: Record<string, { bg: string; text: string; dot: string; defaultLabel: string }> = {
    DISPONIBLE: {
      bg: 'bg-[#C3F400]/20 dark:bg-[#C3F400]/15',
      text: 'text-[#161E00] dark:text-[#C3F400]',
      dot: 'bg-[#15803D] dark:bg-[#C3F400]',
      defaultLabel: 'Disponible'
    },
    EN_SERVICIO: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-[#0056D2] dark:text-blue-400',
      dot: 'bg-[#0056D2] dark:bg-blue-400',
      defaultLabel: 'En Servicio'
    },
    EN_RUTA: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-400',
      dot: 'bg-indigo-600',
      defaultLabel: 'En Ruta'
    },
    PREPARANDO: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-400',
      dot: 'bg-amber-500',
      defaultLabel: 'En Cocina'
    },
    LISTO: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-800 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      defaultLabel: 'Listo'
    },
    ENTREGADO: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-900 dark:text-emerald-300',
      dot: 'bg-emerald-600',
      defaultLabel: 'Entregado'
    },
    CANCELADO: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-[#BA1A1A] dark:text-red-400',
      dot: 'bg-[#BA1A1A]',
      defaultLabel: 'Cancelado'
    },
    OFFLINE: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      dot: 'bg-slate-400',
      defaultLabel: 'Desconectado'
    },
    PENDIENTE: {
      bg: 'bg-[#FDDF33]/30 dark:bg-[#FDDF33]/15',
      text: 'text-[#726200] dark:text-[#FDDF33]',
      dot: 'bg-[#D97706]',
      defaultLabel: 'Pendiente'
    }
  }

  const current = config[normStatus] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-500',
    defaultLabel: status
  }

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-extrabold rounded-pill border border-transparent select-none ${current.bg} ${current.text} ${sizeClass} ${className}`}
      {...props}
    >
      {showDot && (
        <span className={`w-2 h-2 rounded-full shrink-0 ${current.dot} animate-pulse`} />
      )}
      <span>{label || current.defaultLabel}</span>
    </span>
  )
}
