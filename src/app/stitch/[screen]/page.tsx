import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { ArrowLeft, Home, Monitor, Smartphone } from 'lucide-react'

interface PageProps {
  params: Promise<{ screen: string }>
}

export default async function StitchScreenViewer({ params }: PageProps) {
  const resolvedParams = await params
  const requestedScreen = resolvedParams.screen

  const stitchBaseDir = path.join(process.cwd(), '..', 'UX-yo', 'stitch_vamo_friendly_logistics_saas')

  // Find exact matching folder in Stitch export
  let targetFolder = requestedScreen
  try {
    if (fs.existsSync(stitchBaseDir)) {
      const folders = fs.readdirSync(stitchBaseDir).filter(f => {
        return fs.statSync(path.join(stitchBaseDir, f)).isDirectory()
      })

      const exactOrPartial = folders.find(f => f === requestedScreen || f.startsWith(requestedScreen) || requestedScreen.startsWith(f))
      if (exactOrPartial) {
        targetFolder = exactOrPartial
      }
    }
  } catch (err) {
    console.error('Error finding Stitch folder:', err)
  }

  const htmlPath = path.join(stitchBaseDir, targetFolder, 'code.html')

  let rawHtml = ''
  try {
    if (fs.existsSync(htmlPath)) {
      rawHtml = fs.readFileSync(htmlPath, 'utf-8')
      
      // FORZAR QUE TODOS LOS ENLACES DE LA PANTALLA CAMBIEN LA VENTANA PRINCIPAL (NUNCA ANIDAR IFRAMES)
      if (rawHtml.includes('<head>')) {
        rawHtml = rawHtml.replace('<head>', '<head><base target="_top">')
      } else {
        rawHtml = `<base target="_top">` + rawHtml
      }
    } else {
      rawHtml = `<!DOCTYPE html><html><head><base target="_top"></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>Pantalla "${requestedScreen}" no encontrada</h1></body></html>`
    }
  } catch {
    rawHtml = `<!DOCTYPE html><html><head><base target="_top"></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>Error al cargar ${requestedScreen}</h1></body></html>`
  }

  // Detect Mobile-First vs Responsive Desktop
  const isMobileOnly = targetFolder.includes('v_drv') || targetFolder.includes('v_auth_01') || targetFolder.includes('v_auth_02') || targetFolder.includes('v_cust_01a')

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-[#0056d2] text-white px-4 md:px-6 py-2.5 flex items-center justify-between shadow-md text-xs font-bold">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3.5 py-1.5 rounded-full transition-colors">
            <Home className="w-4 h-4" /> Inicio V-PORTAL
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono bg-white/10 px-3 py-1 rounded-full text-[11px] truncate max-w-xs">
            {targetFolder}
          </span>
          <span className="flex items-center gap-1 bg-[#c3f400] text-[#161e00] px-3 py-1 rounded-full text-[10px] uppercase font-black">
            {isMobileOnly ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
            {isMobileOnly ? 'App Móvil Conductor' : 'Responsive Omnicanal'}
          </span>
        </div>
      </header>

      {/* Frame Viewer */}
      <main className="flex-1 w-full flex items-center justify-center p-2 md:p-4">
        {isMobileOnly ? (
          <div className="w-full max-w-[420px] h-[860px] bg-white rounded-[40px] border-8 border-[#e5e2e1] shadow-[0_25px_60px_-15px_rgba(0,86,210,0.2)] overflow-hidden relative my-4">
            <iframe 
              srcDoc={rawHtml}
              title={targetFolder}
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div className="w-full w-[98vw] max-w-[1600px] h-[92vh] bg-white rounded-[24px] border-2 border-[#e5e2e1] shadow-[0_20px_50px_rgba(0,86,210,0.08)] overflow-hidden my-1">
            <iframe 
              srcDoc={rawHtml}
              title={targetFolder}
              className="w-full h-full border-none"
            />
          </div>
        )}
      </main>
    </div>
  )
}
