import React from 'react'

export interface VamoIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'surface'
  size?: 'sm' | 'md' | 'touch'
  label: string // Para lectores de pantalla (Accesibilidad obligatoria)
}

export const VamoIconButton: React.FC<VamoIconButtonProps> = ({
  variant = 'ghost',
  size = 'md',
  label,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-control transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0056D2] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-[#0056D2] hover:bg-[#0040A1] text-white shadow-xs',
    secondary: 'bg-[#FDDF33] hover:bg-[#F0D123] text-[#726200] shadow-xs',
    accent: 'bg-[#C3F400] hover:bg-[#B2DE00] text-[#161E00] shadow-xs',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
    surface: 'bg-white dark:bg-slate-900 border border-[#E5E2E1] dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 shadow-xs'
  }

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    touch: 'w-12 h-12 text-base touch-target'
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
