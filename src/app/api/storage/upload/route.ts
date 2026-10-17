import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/storage/r2Storage'
import { getTrustedAuthContext } from '@/lib/auth/contextResolver'

export async function POST(request: NextRequest) {
  try {
    const authContext = await getTrustedAuthContext()
    if (!authContext) {
      return NextResponse.json(
        { error: 'Sesión no válida o ausente. Autenticación requerida para subir archivos.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const rawFolder = (formData.get('folder') as string) || 'general'
    
    // Normalizar carpetas según estrategia de retención Cloudflare R2
    // Temporales (Auto-delete 30 días en Cloudflare): 'temporary/packaging', 'temporary/pod'
    // Permanentes (Documentos legales y activos de negocio): 'kyc', 'logos', 'menus', 'products'
    let folder = 'general'
    if (rawFolder === 'packaging' || rawFolder === 'pod' || rawFolder.startsWith('temporary')) {
      folder = rawFolder.startsWith('temporary') ? rawFolder : `temporary/${rawFolder}`
    } else if (['kyc', 'logos', 'menus', 'products', 'general'].includes(rawFolder)) {
      folder = rawFolder
    }

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo imágenes y PDFs.' }, { status: 400 })
    }

    // Tamaño máximo: 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede el límite de 10 MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const fileExtension = file.name.split('.').pop() || 'jpg'
    const uniqueFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`

    const result = await uploadToR2(buffer, uniqueFileName, file.type)

    return NextResponse.json({
      success: true,
      key: result.key,
      url: result.publicUrl,
      fileName: file.name,
      size: file.size,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error interno al subir a Cloudflare R2'
    console.error('Error en API de subida a R2:', error)
    return NextResponse.json({ error: 'Error al subir el archivo a Cloudflare R2', details: errorMsg }, { status: 500 })
  }
}
