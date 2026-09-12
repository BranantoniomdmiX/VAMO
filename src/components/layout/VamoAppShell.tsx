'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  User,
  ExternalLink,
  Store
} from 'lucide-react'
import { VamoRoleKey, VAMO_ROLE_CONFIGS } from './roleNavConfig'
import { VamoStatusBadge } from '@/components/ui/VamoStatusBadge'

export interface VamoAppShellProps {
  role: VamoRoleKey
  activeTab?: string
  title?: string
  subtitle?: string
  badgeLabel?: string
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'info' | 'danger'
  headerActions?: React.ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
  children: React.ReactNode
  fullWidthWorkspace?: boolean
  darkWorkspace?: boolean
  onQuickAction?: () => void
}

export function VamoAppShell({
  role,
  activeTab,
  title,
  subtitle,
  badgeLabel,
  badgeVariant,
  headerActions,
  breadcrumbs,
  children,
  fullWidthWorkspace = false,
  darkWorkspace = false,
  onQuickAction
}: VamoAppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const pathname = usePathname()
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const config = VAMO_ROLE_CONFIGS[role] || VAMO_ROLE_CONFIGS.superadmin
  const RoleIcon = config.icon

  // Cierre de Drawer al presionar tecla Escape y Focus Trap básico
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])

  // Desactivar scroll del body cuando el drawer esté abierto en móvil
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  const effectiveBadgeLabel = badgeLabel || config.badgeLabel
  const effectiveBadgeVariant = badgeVariant || config.badgeVariant || 'neutral'

  return (
    <div className={`min-h-screen ${darkWorkspace ? 'bg-[#11161d] text-white' : 'bg-[#fcf9f8] text-[#1c1b1b]'} flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white`}>
      
      {/* ========================================================================= */}
      {/* 1. COMPACT MOBILE / TABLET / SMALL LAPTOP TOPBAR (< 1280px CSS)            */}
      {/* ========================================================================= */}
      <header className={`xl:hidden sticky top-0 z-40 ${darkWorkspace ? 'bg-[#1a222d] border-slate-800' : 'bg-white border-[#e5e2e1]'} border-b px-4 py-3 flex items-center justify-between shadow-xs transition-colors`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={config.homeRoute} className="flex items-center gap-2 shrink-0">
            <img src="/logo-vamo.svg" alt="VAMO" className="h-7 w-auto object-contain" />
          </Link>
          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />
          <div className="min-w-0">
            <span className="font-extrabold text-xs sm:text-sm truncate block">
              {config.roleTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <VamoStatusBadge 
            status={effectiveBadgeVariant === 'warning' ? 'PENDIENTE' : effectiveBadgeVariant === 'info' ? 'EN_CAMINO' : 'DISPONIBLE'}
            label={effectiveBadgeLabel}
            size="sm"
          />
          <button
            ref={menuButtonRef}
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`min-h-[48px] min-w-[48px] p-2.5 rounded-2xl ${darkWorkspace ? 'bg-slate-800 text-white' : 'bg-[#f0eded] text-[#1c1b1b]'} flex items-center justify-center transition-all cursor-pointer active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#0056d2]`}
            aria-label={isDrawerOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            aria-expanded={isDrawerOpen}
          >
            {isDrawerOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BACKDROP PARA DRAWER MÓVIL / TABLET (< 1280px CSS)                      */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div 
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 xl:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* ========================================================================= */}
      {/* 3. ASIDE / SIDEBAR / DRAWER ADAPTABLE (Drawer < 1280px, Sidebar >= 1280px)  */}
      {/* ========================================================================= */}
      <aside 
        ref={drawerRef}
        role="dialog"
        aria-label="Navegación principal"
        aria-modal={isDrawerOpen}
        className={`
          fixed xl:sticky top-0 left-0 z-50 h-[100dvh] max-h-[100dvh] w-72 sm:w-80 xl:w-72
          bg-white dark:bg-[#1a222d] border-r border-[#e5e2e1] dark:border-slate-800
          p-4 sm:p-5 flex flex-col justify-between shadow-lg xl:shadow-xs transition-transform duration-300 ease-in-out
          ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
        `}
      >
        {/* PARTE SUPERIOR: BRANDING & ROLE IDENTITY */}
        <div className="space-y-4 shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0040a1] text-white flex items-center justify-center shadow-xs shrink-0">
                <RoleIcon className="w-5 h-5 text-[#c3f400]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight truncate">
                    {config.roleTitle}
                  </h2>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {config.roleSubtitle}
                </p>
              </div>
            </div>

            {/* Botón cerrar visible solo en mobile dentro del drawer */}
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="xl:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Cerrar navegación"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ACCIÓN RÁPIDA (EJ: NUEVO PEDIDO O NUEVO TELEFÓNICO) */}
          {config.quickAction && (
            <div>
              {config.quickAction.route ? (
                <Link
                  href={config.quickAction.route}
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full min-h-[48px] bg-[#0040a1] hover:bg-[#0056d2] text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <config.quickAction.icon className="w-4 h-4 text-[#c3f400]" />
                  <span>{config.quickAction.label}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false)
                    if (onQuickAction) onQuickAction()
                  }}
                  className="w-full min-h-[48px] bg-[#0056d2] hover:bg-[#0040a1] text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <config.quickAction.icon className="w-4 h-4 text-[#c3f400]" />
                  <span>{config.quickAction.label}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* PARTE MEDIA: NAVEGACIÓN PRINCIPAL SCROLLABLE */}
        <nav 
          className="flex-1 overflow-y-auto my-3 pr-1 space-y-1 scrollbar-thin focus:outline-hidden"
          aria-label="Enlaces de navegación"
        >
          {config.items.map((item) => {
            const Icon = item.icon
            const isItemActive = activeTab ? activeTab === item.id : pathname === item.route

            return (
              <Link
                key={item.id}
                href={item.route}
                onClick={() => setIsDrawerOpen(false)}
                className={`
                  flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
                  ${isItemActive 
                    ? 'bg-[#0040a1] text-white shadow-xs font-black' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-[#0056d2] dark:hover:text-blue-400'}
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isItemActive ? 'text-[#c3f400]' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-[#0056d2] dark:text-blue-300 px-2 py-0.5 rounded-full shrink-0">
                    {item.badge}
                  </span>
                )}
                {isItemActive && <ChevronRight className="w-4 h-4 text-[#c3f400] shrink-0" />}
              </Link>
            )
          })}
        </nav>

        {/* PARTE INFERIOR: SWITCH DE MODO Y CERRAR SESIÓN */}
        <div className="pt-3 border-t border-[#e5e2e1] dark:border-slate-800 space-y-2 shrink-0">
          <Link
            href="/customer/home"
            onClick={() => {
              setIsDrawerOpen(false)
              try { localStorage.setItem('vamo_active_role', 'customer') } catch {}
            }}
            className="flex items-center justify-between min-h-[44px] px-3 rounded-xl font-bold text-xs text-[#0056d2] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Modo Cliente (Comprar)</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsDrawerOpen(false)
              try {
                localStorage.removeItem('vamo_active_role')
                localStorage.removeItem('vamo_user_session')
              } catch {}
              window.location.href = '/customer/home'
            }}
            className="flex items-center justify-center gap-2 min-h-[44px] w-full px-3 rounded-2xl font-black text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 4. WORKSPACE CONTENEDOR PRINCIPAL FLUIDO                                 */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        
        {/* TOPBAR / PAGE HEADER DEL WORKSPACE */}
        {(title || headerActions || breadcrumbs) && (
          <header className={`shrink-0 ${darkWorkspace ? 'bg-[#1a222d] border-slate-800' : 'bg-white border-[#e5e2e1]'} border-b px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 transition-colors`}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span>/</span>}
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-[#0056d2] transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-300 font-bold">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                {title && (
                  <h1 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight ${darkWorkspace ? 'text-white' : 'text-slate-900'}`}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>

              {headerActions && (
                <div className="flex flex-wrap items-center gap-2.5">
                  {headerActions}
                </div>
              )}
            </div>
          </header>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <main className={`flex-1 w-full p-3 sm:p-5 md:p-6 lg:p-8 ${fullWidthWorkspace ? '' : 'max-w-7xl mx-auto'}`}>
          {children}
        </main>
      </div>

    </div>
  )
}
