import React from 'react'
import { VamoButton } from './VamoButton'

export interface VamoEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const VamoEmptyState: React.FC<VamoEmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-3 ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-panel bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mb-1 text-2xl">
          {icon}
        </div>
      )}
      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="pt-2">
          <VamoButton variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </VamoButton>
        </div>
      )}
    </div>
  )
}
