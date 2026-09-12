import React from 'react'

export interface VamoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const VamoInput = React.forwardRef<HTMLInputElement, VamoInputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id,
  className = '',
  disabled,
  ...props
}, ref) => {
  const generatedId = React.useId()
  const inputId = id || generatedId

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={`w-full text-sm font-semibold rounded-control bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border transition-all placeholder:text-slate-400 focus:outline-hidden focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-10' : 'pl-4'
          } ${rightIcon ? 'pr-10' : 'pr-4'} py-2.5 min-h-[44px] ${
            error
              ? 'border-[#BA1A1A] focus:ring-[#BA1A1A]/20 focus:border-[#BA1A1A]'
              : 'border-[#E5E2E1] dark:border-slate-800 focus:ring-[#0056D2]/20 focus:border-[#0056D2]'
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 text-slate-400 pointer-events-none flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-bold text-[#BA1A1A] flex items-center gap-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}

      {!error && hint && (
        <p className="text-[11px] font-medium text-slate-500">
          {hint}
        </p>
      )}
    </div>
  )
})

VamoInput.displayName = 'VamoInput'
