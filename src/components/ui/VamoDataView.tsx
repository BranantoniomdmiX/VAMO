import React from 'react'

/**
 * Contrato de Diseño de VamoDataView (Evolución Responsiva de Tablas VAMO)
 * Desktop: Tabla de alta densidad con encabezados y ordenamiento.
 * Tablet: Tabla condensada con columnas prioritarias.
 * Mobile: Tarjetas táctiles individuales con campos de prioridad y drawer de detalle.
 */

export interface VamoColumn<T> {
  key: string
  header: string
  priority?: 'high' | 'medium' | 'low' // Controla visibilidad en pantallas reducidas
  render?: (item: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

export interface VamoDataViewProps<T> {
  data: T[]
  columns: VamoColumn<T>[]
  keyExtractor: (item: T) => string
  renderMobileCard?: (item: T) => React.ReactNode
  emptyMessage?: string
  isLoading?: boolean
  onRowClick?: (item: T) => void
  className?: string
}

export function VamoDataView<T>({
  data,
  columns,
  keyExtractor,
  renderMobileCard,
  emptyMessage = 'No hay registros disponibles por el momento',
  isLoading = false,
  onRowClick,
  className = ''
}: VamoDataViewProps<T>) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs font-bold text-slate-500">
        <div className="w-5 h-5 border-2 border-[#0056D2] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Cargando datos...
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white dark:bg-slate-900 rounded-card border border-slate-200 dark:border-slate-800">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Vista Móvil: Tarjetas */}
      <div className="block md:hidden space-y-3">
        {data.map(item => {
          const key = keyExtractor(item)
          if (renderMobileCard) {
            return <div key={key}>{renderMobileCard(item)}</div>
          }

          // Render por defecto en tarjeta compacta
          return (
            <div
              key={key}
              onClick={() => onRowClick?.(item)}
              className={`bg-white dark:bg-slate-900 p-4 rounded-card border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 ${
                onRowClick ? 'active:scale-98 cursor-pointer' : ''
              }`}
            >
              {columns
                .filter(col => col.priority !== 'low')
                .map(col => (
                  <div key={col.key} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">{col.header}</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                    </span>
                  </div>
                ))}
            </div>
          )
        })}
      </div>

      {/* Vista Desktop / Tablet: Tabla Responsiva */}
      <div className="hidden md:block overflow-x-auto rounded-card border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`p-3.5 font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.priority === 'low' ? 'hidden lg:table-cell' : ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-800 dark:text-slate-200">
            {data.map(item => {
              const key = keyExtractor(item)
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`p-3.5 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${col.priority === 'low' ? 'hidden lg:table-cell' : ''}`}
                    >
                      {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
