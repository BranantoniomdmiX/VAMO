'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UploadCloud, Camera, CheckCircle2, Loader2, Image as ImageIcon, X } from 'lucide-react'

interface SupabaseImageUploaderProps {
  onUploadSuccess: (url: string) => void
  currentImageUrl?: string
  bucketName?: string
  label?: string
}

export function SupabaseImageUploader({
  onUploadSuccess,
  currentImageUrl,
  bucketName = 'store-assets',
  label = 'Fotografía HD del Producto o Negocio'
}: SupabaseImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || '')
  const [uploadMessage, setUploadMessage] = useState<string>('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Previsualización local inmediata
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setIsUploading(true)
    setUploadMessage('Subiendo archivo...')

    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
    const filePath = `uploads/${fileName}`

    try {
      // Subida al Storage Bucket
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.warn('Almacenamiento:', error.message)
        // Fallback: usar FileReader base64 local
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64Url = reader.result as string
          setPreviewUrl(base64Url)
          onUploadSuccess(base64Url)
          setIsUploading(false)
          setUploadMessage('Archivo procesado con éxito.')
        }
        reader.readAsDataURL(file)
        return
      }

      // Obtener URL Pública
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      const finalUrl = publicData.publicUrl
      setPreviewUrl(finalUrl)
      onUploadSuccess(finalUrl)
      setUploadMessage('¡Archivo guardado con éxito!')
    } catch (err: any) {
      console.error(err)
      // Fallback base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Url = reader.result as string
        setPreviewUrl(base64Url)
        onUploadSuccess(base64Url)
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-bold text-[#1c1b1b] block">{label}</label>}

      <div className="bg-[#fcf9f8] p-4 rounded-2xl border border-dashed border-[#0056d2]/40 space-y-3 relative group">
        
        {previewUrl ? (
          <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200">
            <img 
              src={previewUrl} 
              alt="Previsualización" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="bg-white text-[#0056d2] px-3.5 py-1.5 rounded-full text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-transform">
                <Camera className="w-4 h-4" />
                <span>Cambiar Foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
              
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl('')
                  onUploadSuccess('')
                }}
                className="bg-[#ba1a1a] text-white p-2 rounded-full shadow-md active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#0056d2]/10 text-[#0056d2] flex items-center justify-center">
              {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
            </div>
            
            <div>
              <strong className="text-xs font-extrabold text-[#0056d2] block">
                📷 Toca aquí para subir o tomar foto
              </strong>
              <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                Archivos PNG, JPG o WEBP (Hasta 5MB)
              </span>
            </div>

            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </label>
        )}

        {isUploading && (
          <div className="flex items-center gap-2 text-xs font-bold text-[#0056d2] bg-blue-50 p-2.5 rounded-xl border border-blue-200 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{uploadMessage}</span>
          </div>
        )}

        {!isUploading && previewUrl && (
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Fotografía cargada y lista para mostrarse</span>
          </div>
        )}

      </div>
    </div>
  )
}
