import React from 'react'
import { VamoButton } from './VamoButton'

export interface VamoErrorStateProps {
  title?: string
  message: string
  retryLabel?: string
  onRetry?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
}

export const VamoErrorState: React.FC<VamoErrorStateProps> = ({
  title = 'Ocurrió un problema temporal',
  message,
  retryLabel = 'Reintentar',
  onRetry,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}) => {
  return (
    <div className={`p-6 sm:p-8 rounded-card bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-center max-w-lg mx-auto space-y-3 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 text-[#BA1A1A] dark:text-red-400 mx-auto flex items-center justify-center text-xl font-black">
        ⚠️
      </div>

      <h3 className="text-base font-extrabold text-[#BA1A1A] dark:text-red-400">
        {title}
      </h3>

      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
        {message}
      </p>

      {(onRetry || onSecondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {onRetry && (
            <VamoButton variant="primary" size="sm" onClick={onRetry}>
              {retryLabel}
            </VamoButton>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <VamoButton variant="ghost" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </VamoButton>
          )}
        </div>
      )}
    </div>
  )
}
