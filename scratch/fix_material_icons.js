const fs = require('fs')
const path = require('path')

const stitchBaseDir = path.join(__dirname, '..', '..', 'UX-yo', 'stitch_vamo_friendly_logistics_saas')

// Mapa de corrección estricta de iconos de Material Symbols que fueron corruptos por reemplazos de texto
const iconFixes = [
  [/<span class="material-symbols-outlined"([^>]*)>Historial<\/span>/gi, '<span class="material-symbols-outlined"$1>history</span>'],
  [/<span class="material-symbols-outlined"([^>]*)>Cerrar Sesión<\/span>/gi, '<span class="material-symbols-outlined"$1>logout</span>'],
  [/<span class="material-symbols-outlined"([^>]*)>Pedidos<\/span>/gi, '<span class="material-symbols-outlined"$1>assignment_turned_in</span>'],
  [/<span class="material-symbols-outlined"([^>]*)>Productos<\/span>/gi, '<span class="material-symbols-outlined"$1>inventory_2</span>'],
  [/<span class="material-symbols-outlined"([^>]*)>Finanzas<\/span>/gi, '<span class="material-symbols-outlined"$1>payments</span>'],
  [/<span class="material-symbols-outlined"([^>]*)>Catálogo<\/span>/gi, '<span class="material-symbols-outlined"$1>store</span>'],
  [/<span class="material-symbols-outlined"([^>]*)>Billetera<\/span>/gi, '<span class="material-symbols-outlined"$1>account_balance_wallet</span>'],
  [/<span class="material-symbols-outlined"([^>]*)>Perfil<\/span>/gi, '<span class="material-symbols-outlined"$1>person</span>'],
  [/<span class="material-symbols-outlined"([^>]*)>Inicio<\/span>/gi, '<span class="material-symbols-outlined"$1>home</span>']
]

let fixedCount = 0

if (fs.existsSync(stitchBaseDir)) {
  const folders = fs.readdirSync(stitchBaseDir).filter(f => fs.statSync(path.join(stitchBaseDir, f)).isDirectory())

  folders.forEach(folder => {
    const htmlPath = path.join(stitchBaseDir, folder, 'code.html')
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf-8')

      let changed = false
      iconFixes.forEach(([pattern, replacement]) => {
        if (pattern.test(html)) {
          html = html.replace(pattern, replacement)
          changed = true
        }
      })

      if (changed) {
        fs.writeFileSync(htmlPath, html, 'utf-8')
        fixedCount++
        console.log(`[✓] Iconos restaurados en: ${folder}`)
      }
    }
  })
}

console.log(`\n¡CORRECCIÓN EXITOSA! Iconos de Material Symbols reparados en ${fixedCount} pantallas.`)
