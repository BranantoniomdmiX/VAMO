import React from 'react'

export interface VamoLoadingStateProps {
  message?: string
  subMessage?: string
  className?: string
  compact?: boolean
}

export const VamoLoadingState: React.FC<VamoLoadingStateProps> = ({
  message = 'Cargando información...',
  subMessage,
  className = '',
  compact = false
}) => {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 ${className}`}>
        <div className="w-4 h-4 border-2 border-[#0056D2] border-t-transparent rounded-full animate-spin shrink-0" />
        <span>{message}</span>
      </div>
    )
  }

  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="w-10 h-10 border-3 border-[#0056D2] border-t-transparent rounded-full animate-spin" />
      <div>
        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
          {message}
        </p>
        {subMessage && (
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  )
}
