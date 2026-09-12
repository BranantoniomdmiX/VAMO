import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface VamoPageHeaderProps {
  title: string
  description?: string
  badge?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  primaryAction?: React.ReactNode
  secondaryActions?: React.ReactNode
  className?: string
}

/**
 * Patrón estándar para encabezados de página en VAMO.
 * Unifica título, descripción, breadcrumbs y acciones en Superadmin, Owner, Base y Biz.
 * Totalmente responsivo (colapsa acciones verticalmente en móvil, horizontal en desktop).
 */
export const VamoPageHeader: React.FC<VamoPageHeaderProps> = ({
  title,
  description,
  badge,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  className = ''
}) => {
  return (
    <div className={`space-y-3 pb-5 border-b border-slate-200/80 dark:border-slate-800 ${className}`}>
      {/* Breadcrumbs cuando aplique */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Navegación de migas de pan" className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold flex-wrap">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1
            return (
              <React.Fragment key={crumb.label + idx}>
                {crumb.href && !isLast ? (
                  <Link 
                    href={crumb.href} 
                    className="hover:text-[#0056D2] dark:hover:text-blue-400 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-slate-900 dark:text-slate-100 font-bold' : ''}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              </React.Fragment>
            )
          })}
        </nav>
      )}

      {/* Fila principal: Título, Badge y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {/* Acciones primaria y secundarias */}
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  )
}
