import React from 'react'

export interface VamoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'standard' | 'elevated' | 'kpi' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const VamoCard: React.FC<VamoCardProps> = ({
  variant = 'standard',
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-card transition-all overflow-hidden'

  const variantStyles = {
    standard: 'bg-white dark:bg-slate-900 border border-[#E5E2E1] dark:border-slate-800 shadow-xs',
    elevated: 'bg-white dark:bg-slate-900 border border-[#E5E2E1] dark:border-slate-800 shadow-md',
    kpi: 'bg-[#1C1B1B] text-white border border-slate-800 shadow-lg',
    interactive: 'bg-white dark:bg-slate-900 border border-[#E5E2E1] dark:border-slate-800 shadow-xs hover:shadow-md hover:border-[#0056D2] cursor-pointer active:scale-[0.99]'
  }

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
