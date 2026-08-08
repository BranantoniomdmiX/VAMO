const fs = require('fs')
const path = require('path')

const stitchBaseDir = path.join(__dirname, '..', '..', 'UX-yo', 'stitch_vamo_friendly_logistics_saas')

// Mapa de URLs de destino para interconectar los botones en todas las pantallas
const routeMap = {
  // BIZ
  'Orders': '/stitch/v_biz_01_consola_de_pedidos_kds',
  'Pedidos': '/stitch/v_biz_01_consola_de_pedidos_kds',
  'Products': '/stitch/v_biz_02_editor_de_cat_logo',
  'Productos': '/stitch/v_biz_02_editor_de_cat_logo',
  'Catalog': '/stitch/v_biz_02_editor_de_cat_logo',
  'Catálogo': '/stitch/v_biz_02_editor_de_cat_logo',
  'Earnings': '/stitch/v_biz_03_estado_de_cuenta_local',
  'Finances': '/stitch/v_biz_03_estado_de_cuenta_local',
  'Finanzas': '/stitch/v_biz_03_estado_de_cuenta_local',
  'History': '/stitch/v_biz_03_estado_de_cuenta_local',
  'Historial': '/stitch/v_biz_03_estado_de_cuenta_local',
  'Logout': '/stitch/v_auth_01_login_universal_actualizado',
  'Cerrar Sesión': '/stitch/v_auth_01_login_universal_actualizado',

  // CUST & DRV Bottom Nav
  'Home': '/stitch/v_cust_01a_inicio_amigable_actualizado',
  'Inicio': '/stitch/v_cust_01a_inicio_amigable_actualizado',
  'Wallet': '/stitch/v_drv_05_billetera_conductor',
  'Billetera': '/stitch/v_drv_05_billetera_conductor',
  'Profile': '/stitch/v_auth_01_login_universal_actualizado',
  'Perfil': '/stitch/v_auth_01_login_universal_actualizado',

  // BAS & OWN
  'Dashboard': '/stitch/v_own_01_dashboard_financiero_360',
  'Fleet Manager': '/stitch/v_own_01_dashboard_financiero_360',
  'Dispatch Console': '/stitch/v_bas_02_consola_de_despacho',
  'Cash Desk': '/stitch/v_bas_04_caja_f_sica_y_corte',
  'Warehouse': '/stitch/v_bas_05_control_de_almac_n'
}

// Diccionario exhaustivo de traducción al español mexicano (VAMO Tone & Voice)
const dictionary = [
  // Generales / Auth
  [/Welcome back\. Let's get moving\./gi, "¡Bienvenido de vuelta! Vamos a empezar."],
  [/Welcome back/gi, "¡Bienvenido de vuelta!"],
  [/Log In/gi, "Iniciar Sesión"],
  [/Email Address/gi, "Correo Electrónico"],
  [/Password/gi, "Contraseña"],
  [/Forgot Password\?/gi, "¿Olvidaste tu contraseña?"],
  [/Don't have an account yet\?/gi, "¿Aún no tienes cuenta en VAMO?"],
  [/Create Account/gi, "Crear mi cuenta gratis"],
  [/Sign Up/gi, "Registrarme"],

  // BIZ / Local
  [/Neighborhood Hub/gi, "Centro de Comercio VAMO"],
  [/Operational Center/gi, "Centro de Operaciones"],
  [/VAMO Store Manager/gi, "VAMO Store Manager"],
  [/New Order/gi, "+ Nuevo Pedido"],
  [/Orders/gi, "Pedidos"],
  [/Products/gi, "Productos"],
  [/Earnings/gi, "Finanzas"],
  [/History/gi, "Historial"],
  [/Logout/gi, "Cerrar Sesión"],
  [/Catalog Editor/gi, "Editor de Catálogo"],
  [/Manage your neighborhood offerings and promotions\./gi, "Administra tus productos y promociones del local."],
  [/New Product/gi, "+ Nuevo Producto"],
  [/All Products/gi, "Todos los Productos"],
  [/Promotions & Loyalty/gi, "Promociones & Lealtad"],
  [/Out of Stock/gi, "Agotados"],
  [/In Stock/gi, "En Stock"],
  [/Low Stock/gi, "Poco Stock"],
  [/Add New Item/gi, "Agregar Producto"],
  [/Expand your catalog with new neighborhood favorites\./gi, "Amplía tu catálogo con nuevos productos locales."],
  [/10% Off Morning Bread/gi, "10% De Descuento en Pan Temprano"],
  [/For frequent neighbors\. Automatically applied for users with 5\+ orders this month\./gi, "Para vecinos frecuentes. Se aplica automáticamente a usuarios con 5+ pedidos este mes."],
  [/Edit Promo/gi, "Editar Promo"],
  [/Organic Tomatoes/gi, "Tomates Orgánicos"],
  [/Local Wildflower Honey/gi, "Miel de Abeja Artesanal"],
  [/Artisan Granola/gi, "Granola Artesanal"],
  [/available/gi, "disponibles"],

  // CUST / Cliente
  [/What do you need today\?/gi, "¿Qué necesitas hoy?"],
  [/Send something/gi, "Llevar algo"],
  [/Buy and deliver/gi, "Comprar y llevar"],
  [/Multiple stops/gi, "Varias paradas"],
  [/Explore VAMO Radar/gi, "Explorar Radar VAMO"],
  [/Find local partners near you/gi, "Encuentra socios cerca de ti"],
  [/Home/gi, "Inicio"],
  [/Wallet/gi, "Billetera"],
  [/Profile/gi, "Perfil"],

  // DRV / Motociclista
  [/Hi, Rider/gi, "¡Hola, Rider!"],
  [/Ready to ride today\?/gi, "¿Listo para rodar hoy?"],
  [/AVAILABLE/gi, "DISPONIBLE"],
  [/NOT AVAILABLE/gi, "NO DISPONIBLE"],
  [/Current Balance/gi, "Saldo Actual en Caja"],
  [/Today's Earnings/gi, "Ganancias de Hoy"],
  [/Completed Trips/gi, "Viajes Realizados"],
  [/NEXT GOAL/gi, "PRÓXIMA META"],
  [/Weekend Bonus/gi, "Bono Fin de Semana"],
  [/Progress/gi, "Progreso"],
  [/ACCEPT TRIP/gi, "ACEPTAR VIAJE"],
  [/REJECT/gi, "RECHAZAR"],
  [/ARRIVED AT ORIGIN/gi, "LLEGUÉ AL ORIGEN"],
  [/PICKED UP/gi, "RECOGIDO"],
  [/DELIVERED TO CUSTOMER/gi, "LLEGUÉ CON CLIENTE"],

  // OWN / Dueño
  [/Financial Dashboard 360°/gi, "Dashboard Financiero 360°"],
  [/Overview of your fleet's financial health\./gi, "Resumen financiero general de tu flotilla."],
  [/Total Sales/gi, "Ventas Totales"],
  [/Pending Payments/gi, "Pagos Pendientes"],
  [/Cash in Base/gi, "Efectivo en Base"],
  [/Net Utility/gi, "Utilidad Neta"],
  [/Driver Wallets/gi, "Billeteras de Motociclistas"],
  [/Fare Engine/gi, "Motor de Tarifas"],
  [/Payment Schemes/gi, "Esquemas de Pago"],
  [/Commercial Agreements/gi, "Convenios Comerciales"],
  [/KYC Approval/gi, "Aprobación KYC"]
]

let processedCount = 0

if (fs.existsSync(stitchBaseDir)) {
  const folders = fs.readdirSync(stitchBaseDir).filter(f => fs.statSync(path.join(stitchBaseDir, f)).isDirectory())

  folders.forEach(folder => {
    const htmlPath = path.join(stitchBaseDir, folder, 'code.html')
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf-8')

      // 1. Limpiar cualquier comentario JSX tipo {/* ... */} o sintaxis rota className
      html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      html = html.replace(/className=/g, 'class=')

      // 2. Aplicar el diccionario de traducción masiva
      dictionary.forEach(([pattern, replacement]) => {
        html = html.replace(pattern, replacement)
      })

      // 3. Forzar que todos los botones e enlaces se interconecten con URLs válidas
      Object.entries(routeMap).forEach(([textKey, targetRoute]) => {
        // Reemplazar href="#" en elementos que contengan la palabra clave por la ruta real
        const regexA = new RegExp(`<a([^>]*?)href=["']#["']([^>]*?>[\\s\\S]*?${textKey}[\\s\\S]*?<\/a>)`, 'gi')
        html = html.replace(regexA, `<a$1href="${targetRoute}"$2`)
      })

      // 4. Asegurar que los hipervínculos no aniden el iframe
      if (!html.includes('<base target="_top">')) {
        if (html.includes('<head>')) {
          html = html.replace('<head>', '<head>\n<base target="_top">')
        } else {
          html = `<base target="_top">\n` + html
        }
      }

      fs.writeFileSync(htmlPath, html, 'utf-8')
      processedCount++
      console.log(`[✓] Procesada pantalla: ${folder}`)
    }
  })
}

console.log(`\n¡ÉXITO TOTAL! ${processedCount} pantallas procesadas y traducidas masivamente al Español de México.`)
