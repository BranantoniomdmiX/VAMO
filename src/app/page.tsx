import Link from 'next/link'
import { User, Store, Bike, LayoutDashboard, Building2, ShieldCheck } from 'lucide-react'

export default function Home() {
  const portals = [
    {
      id: 'customer',
      title: 'Quiero pedir algo',
      subtitle: 'Entrar como Cliente',
      route: '/customer',
      icon: User,
      iconBg: 'bg-[#0056d2]/10 text-[#0056d2]',
      cardBg: 'bg-white border-[#0056d2]/20 hover:border-[#0056d2]',
      shadow: 'shadow-[0_8px_24px_rgba(0,86,210,0.06)]'
    },
    {
      id: 'biz',
      title: 'Tengo un negocio',
      subtitle: 'Entrar como Comercio Afiliado',
      route: '/stitch/v_biz_01_consola_de_pedidos_kds',
      icon: Store,
      iconBg: 'bg-[#fddf33] text-[#726200]',
      cardBg: 'bg-white border-[#fddf33]/40 hover:border-[#fddf33]',
      shadow: 'shadow-[0_8px_24px_rgba(253,223,51,0.1)]'
    },
    {
      id: 'driver',
      title: 'Quiero repartir',
      subtitle: 'Entrar como Motociclista',
      route: '/driver',
      icon: Bike,
      iconBg: 'bg-[#c3f400] text-[#161e00]',
      cardBg: 'bg-white border-[#c3f400]/50 hover:border-[#c3f400]',
      shadow: 'shadow-[0_8px_24px_rgba(195,244,0,0.12)]'
    },
    {
      id: 'base',
      title: 'Centro de Control',
      subtitle: 'Entrar a la Base de Despacho',
      route: '/base',
      icon: LayoutDashboard,
      iconBg: 'bg-[#f0eded] text-[#1c1b1b]',
      cardBg: 'bg-white border-[#e5e2e1] hover:border-[#0056d2]',
      shadow: 'shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
    },
    {
      id: 'owner',
      title: 'Administrar mi Flotilla',
      subtitle: 'Entrar como Dueño de Flota',
      route: '/owner',
      icon: Building2,
      iconBg: 'bg-[#0056d2] text-white',
      cardBg: 'bg-white border-[#0056d2]/30 hover:border-[#0056d2]',
      shadow: 'shadow-[0_8px_24px_rgba(0,86,210,0.08)]'
    },
    {
      id: 'admin',
      title: 'Sistema Global',
      subtitle: 'Panel Superadmin VAMO',
      route: '/stitch/v_sa_01_dashboard_maestro_global_actualizado',
      icon: ShieldCheck,
      iconBg: 'bg-[#1c1b1b] text-white',
      cardBg: 'bg-white border-[#e5e2e1] hover:border-[#1c1b1b]',
      shadow: 'shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
    }
  ]

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] p-4 sm:p-8 lg:p-12 font-sans flex flex-col justify-between selection:bg-[#0056d2] selection:text-white">
      <div className="max-w-7xl mx-auto w-full my-auto space-y-8 md:space-y-12">
        {/* Header V-PORTAL exacto a Stitch */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0056d2] tracking-tight flex items-center gap-2">
              ¡Hola! Bienvenido a VAMO. <span className="text-2xl sm:text-3xl">👏</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[#737785] font-semibold mt-1">
              ¿Cómo vas a usar la plataforma hoy?
            </p>
          </div>

          <Link
            href="/stitch/v_auth_01_login_universal_actualizado"
            className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold shadow-md shadow-[#0056d2]/20 active:scale-95 transition-all flex-shrink-0"
          >
            Iniciar Sesión / Registrarme
          </Link>
        </header>

        {/* Grid Responsivo V-PORTAL: 1 col (Celular) -> 2 cols (Tablet) -> 3 cols (PC) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {portals.map(portal => {
            const IconComponent = portal.icon
            return (
              <Link
                key={portal.id}
                href={portal.route}
                className={`p-6 sm:p-8 rounded-[24px] border transition-all duration-300 flex flex-col justify-between min-h-[180px] sm:min-h-[210px] ${portal.cardBg} ${portal.shadow} hover:-translate-y-1 group cursor-pointer`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-110 ${portal.iconBg}`}>
                  <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>

                <div className="mt-6 space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[#1c1b1b] group-hover:text-[#0056d2] transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-[#737785]">
                    {portal.subtitle}
                  </p>
                </div>
              </Link>
            )
          })}
        </section>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full pt-8 mt-8 border-t border-[#e5e2e1]/60 flex flex-col sm:flex-row justify-between items-center text-xs text-[#737785] font-medium gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c3f400]" />
          <span>V-PORTAL &bull; Responsivo (PC, Tablet y Celular)</span>
        </div>
        <Link href="/stitch/v_cust_01a_inicio_amigable_actualizado" className="hover:text-[#0056d2] font-bold">
          Ver Catálogo Completo (34 Screens) &rarr;
        </Link>
      </footer>
    </div>
  )
}
