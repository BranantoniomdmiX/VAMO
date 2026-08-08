import React from 'react'
import Link from 'next/link'
import { 
  Store, 
  ClipboardList, 
  Package, 
  Wallet, 
  History, 
  LogOut, 
  PlusCircle, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react'

interface SidebarBizProps {
  activeTab: 'kds' | 'catalog' | 'finances' | 'history'
}

export function SidebarBiz({ activeTab }: SidebarBizProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const navItems = [
    {
      id: 'kds',
      label: 'Tablero KDS (Pedidos)',
      route: '/biz/kds',
      icon: ClipboardList
    },
    {
      id: 'catalog',
      label: 'Productos & Catálogo',
      route: '/biz/catalog',
      icon: Package
    },
    {
      id: 'finances',
      label: 'Finanzas & Estado de Cuenta',
      route: '/biz/finances',
      icon: Wallet
    }
  ]

  return (
    <>
      {/* Botón Hamburguesa para Celulares */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#e5e2e1] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base text-[#0056d2]">VAMO Store Manager</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-[#f0eded] text-[#1c1b1b]"
          aria-label="Abrir Menú"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop móvil */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Principal (Celulares, Tabletas y PC) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-[#e5e2e1] 
        p-6 flex flex-col justify-between shadow-sm transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Header del Comercio */}
          <div className="flex items-center gap-3 pb-4 border-b border-[#f0eded]">
            <div className="w-12 h-12 rounded-full bg-[#0056d2] text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#0056d2] leading-tight">
                Centro de Comercio VAMO
              </h2>
              <p className="text-xs font-semibold text-[#737785]">Centro de Operaciones</p>
            </div>
          </div>

          {/* Botón Acción Principal */}
          <Link
            href="/biz/kds"
            onClick={() => setIsOpen(false)}
            className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white h-12 rounded-full font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#0056d2]/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Nuevo Pedido</span>
          </Link>

          {/* Enlaces de Navegación Nativos */}
          <nav className="space-y-2 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <Link
                  key={item.id}
                  href={item.route}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center justify-between p-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all
                    ${isActive 
                      ? 'bg-[#fddf33] text-[#726200] shadow-sm font-extrabold' 
                      : 'text-[#424654] hover:bg-[#f6f3f2] hover:text-[#0056d2]'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#726200]' : 'text-[#0056d2]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-[#726200]" />}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Sidebar: Cerrar Sesión */}
        <div className="pt-4 border-t border-[#e5e2e1]">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3.5 rounded-2xl font-bold text-xs sm:text-sm text-[#ba1a1a] hover:bg-[#ffdad6]/60 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
