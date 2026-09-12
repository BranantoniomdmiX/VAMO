import React from 'react'

export interface VamoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'touch'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const VamoButton: React.FC<VamoButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-extrabold transition-all select-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-98'

  const variantStyles = {
    primary: 'bg-[#0056D2] hover:bg-[#0040A1] text-white border border-[#0056D2] shadow-sm focus-visible:ring-[#0056D2]',
    secondary: 'bg-[#FDDF33] hover:bg-[#F0D123] text-[#726200] border border-[#726200]/20 shadow-xs focus-visible:ring-[#FDDF33]',
    accent: 'bg-[#C3F400] hover:bg-[#B2DE00] text-[#161E00] border border-[#161E00]/20 shadow-sm focus-visible:ring-[#C3F400]',
    danger: 'bg-[#BA1A1A] hover:bg-[#9E1414] text-white border border-[#BA1A1A] shadow-sm focus-visible:ring-[#BA1A1A]',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-transparent focus-visible:ring-slate-400'
  }

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-control gap-1.5 h-8',
    md: 'text-sm px-4 py-2 rounded-control gap-2 h-10',
    lg: 'text-base px-6 py-2.5 rounded-control gap-2.5 h-12',
    touch: 'text-base px-6 py-3 rounded-pill gap-2.5 min-h-[48px] touch-target'
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
}
