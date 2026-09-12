import React from 'react'
import {
  Globe,
  Inbox,
  MapPin,
  Radio,
  CreditCard,
  Building2,
  PlusCircle,
  Activity,
  TrendingUp,
  Sliders,
  Wallet,
  Handshake,
  ShieldCheck,
  PhoneCall,
  DollarSign,
  Package,
  Store,
  ClipboardList,
  LucideIcon
} from 'lucide-react'

export type VamoRoleKey = 'superadmin' | 'owner' | 'base' | 'fleet' | 'merchant'

export interface RoleNavigationItem {
  id: string
  label: string
  route: string
  icon: LucideIcon
  badge?: string
  mobilePriority?: boolean
  section?: string
  description?: string
}

export interface RoleNavigationConfig {
  role: VamoRoleKey
  roleTitle: string
  roleSubtitle: string
  badgeLabel: string
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'info' | 'danger'
  homeRoute: string
  icon: LucideIcon
  themeAccent?: string
  quickAction?: {
    label: string
    route?: string
    icon: LucideIcon
    onClickId?: string
  }
  items: RoleNavigationItem[]
}

export const VAMO_ROLE_CONFIGS: Record<VamoRoleKey, RoleNavigationConfig> = {
  superadmin: {
    role: 'superadmin',
    roleTitle: 'VAMO SuperAdmin',
    roleSubtitle: 'Panel Maestro Global',
    badgeLabel: 'Master Root',
    badgeVariant: 'warning',
    homeRoute: '/admin/dashboard',
    icon: ShieldCheck,
    items: [
      { id: 'dashboard', label: 'Dashboard Maestro Global', route: '/admin/dashboard', icon: Globe, mobilePriority: true },
      { id: 'requests', label: 'Bandeja de Solicitudes & KYC', route: '/admin/requests', icon: Inbox, mobilePriority: true },
      { id: 'map', label: 'Mapa Nacional de Plazas', route: '/admin/map', icon: MapPin },
      { id: 'control-tower', label: 'Torre de Control (Meituan Style)', route: '/admin/control-tower', icon: Radio },
      { id: 'clearing', label: 'VAMO Clearing & Ledger', route: '/admin/clearing', icon: CreditCard },
      { id: 'fleets', label: 'Gestión de Plazas & Códigos', route: '/admin/fleets', icon: Building2, mobilePriority: true },
      { id: 'new-fleet', label: 'Alta Nueva Plaza ($0 Setup)', route: '/admin/new-fleet', icon: PlusCircle },
      { id: 'infrastructure', label: 'Monitor de Infraestructura', route: '/admin/infrastructure', icon: Activity }
    ]
  },
  owner: {
    role: 'owner',
    roleTitle: 'Socio Comercial',
    roleSubtitle: 'Panel de Plaza & Franquicia',
    badgeLabel: 'Franquicia',
    badgeVariant: 'info',
    homeRoute: '/owner/dashboard',
    icon: Building2,
    items: [
      { id: 'dashboard', label: 'Dashboard Financiero 360°', route: '/owner/dashboard', icon: TrendingUp, mobilePriority: true },
      { id: 'analytics', label: 'Analytics & Rendimiento', route: '/owner/analytics', icon: Sliders },
      { id: 'billing', label: 'Finanzas & Split 50/50', route: '/owner/billing', icon: CreditCard, mobilePriority: true },
      { id: 'wallets', label: 'Billeteras de Motociclistas', route: '/owner/wallets', icon: Wallet, mobilePriority: true },
      { id: 'rates', label: 'Motor de Tarifas', route: '/owner/rates', icon: Sliders },
      { id: 'payments', label: 'Esquemas de Pago', route: '/owner/payments', icon: CreditCard },
      { id: 'agreements', label: 'Convenios Comerciales', route: '/owner/agreements', icon: Handshake },
      { id: 'kyc', label: 'Aprobación KYC', route: '/owner/kyc', icon: ShieldCheck, mobilePriority: true }
    ]
  },
  base: {
    role: 'base',
    roleTitle: 'Centro de Despacho',
    roleSubtitle: 'Base Operativa VAMO',
    badgeLabel: 'Base Control',
    badgeVariant: 'success',
    homeRoute: '/base/dispatch',
    icon: Radio,
    quickAction: {
      label: '+ NUEVO PEDIDO TELEFÓNICO',
      route: '/base/call-register',
      icon: PhoneCall
    },
    items: [
      { id: 'dispatch', label: 'Consola de Despacho', route: '/base/dispatch', icon: Radio, mobilePriority: true },
      { id: 'radar', label: 'Radar Operativo Macro', route: '/base/radar', icon: MapPin },
      { id: 'routes-tracking', label: 'Seguimiento de Rutas 📍', route: '/base/routes-tracking', icon: ShieldCheck, mobilePriority: true },
      { id: 'call', label: 'Central Telefónica (Call Center)', route: '/base/call-register', icon: PhoneCall, mobilePriority: true },
      { id: 'cashier', label: 'Caja Física y Corte (COD)', route: '/base/cashier', icon: DollarSign, mobilePriority: true },
      { id: 'warehouse', label: 'Control de Almacén', route: '/base/warehouse', icon: Package }
    ]
  },
  fleet: {
    role: 'fleet',
    roleTitle: 'Gestión de Flota',
    roleSubtitle: 'Panel de Unidades & Choferes',
    badgeLabel: 'Flota Aliada',
    badgeVariant: 'info',
    homeRoute: '/admin/fleets',
    icon: Building2,
    items: [
      { id: 'fleets', label: 'Unidades & Vehículos', route: '/admin/fleets', icon: Building2, mobilePriority: true },
      { id: 'new-fleet', label: 'Registrar Unidad', route: '/admin/new-fleet', icon: PlusCircle, mobilePriority: true },
      { id: 'routes-tracking', label: 'Rastreo de Unidades', route: '/base/routes-tracking', icon: ShieldCheck, mobilePriority: true },
      { id: 'wallets', label: 'Liquidación de Flota', route: '/owner/wallets', icon: Wallet, mobilePriority: true }
    ]
  },
  merchant: {
    role: 'merchant',
    roleTitle: 'Centro de Comercio',
    roleSubtitle: 'Operación & Pedidos',
    badgeLabel: 'Local / Comercio',
    badgeVariant: 'neutral',
    homeRoute: '/biz',
    icon: Store,
    quickAction: {
      label: '+ Nuevo Pedido',
      icon: PlusCircle,
      onClickId: 'OPEN_NEW_ORDER'
    },
    items: [
      { id: 'hub', label: 'Inicio (Centro de Comercio)', route: '/biz', icon: Store, mobilePriority: true, section: 'principal' },
      { id: 'catalog', label: 'Catálogo & Menú Rápido', route: '/biz/catalog', icon: Package, mobilePriority: true, section: 'principal' },
      { id: 'settings', label: 'Configuración & Horarios', route: '/biz/settings', icon: Store, section: 'principal' },
      { id: 'finances', label: 'Finanzas & Ganancias', route: '/biz/finances', icon: Wallet, mobilePriority: true, section: 'principal' },
      { id: 'kds', label: 'Pantalla KDS (Cocina / Barra)', route: '/biz/kds', icon: ClipboardList, mobilePriority: true, section: 'terminal' },
      { id: 'manager', label: 'Caja & Gerencia (Dueño)', route: '/biz/manager', icon: Store, mobilePriority: true, section: 'terminal' },
      { id: 'simple', label: 'Modo Callejero / Taquero (2 Botones)', route: '/biz/simple', icon: Store, section: 'terminal' },
      { id: 'pharmacy', label: 'Modo Farmacia & Recetas', route: '/biz/pharmacy', icon: Package, section: 'terminal' },
      { id: 'hardware', label: 'Modo Ferretería & Carga', route: '/biz/hardware', icon: Package, section: 'terminal' }
    ]
  }
}
