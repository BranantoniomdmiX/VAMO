'use client'

import React, { useState, useEffect } from 'react'
import { SidebarBiz } from '@/components/layout/SidebarBiz'
import { Store, MapPin, Clock, Phone, Camera, Save, CheckCircle2, ShieldCheck, Sparkles, Navigation, Globe, Lock, QrCode, Printer } from 'lucide-react'
import { SupabaseImageUploader } from '@/components/ui/SupabaseImageUploader'
import { CancellationService } from '@/lib/services/cancellationService'

export default function BizSettingsPage() {
  const [storeName, setStoreName] = useState('Tortería El Pariente')
  const [category, setCategory] = useState('Comida / Restaurante 🍕')
  const [customCategory, setCustomCategory] = useState('')
  const [catalogPdfUrl, setCatalogPdfUrl] = useState('')
  const [address, setAddress] = useState('Calle 5 de Mayo #12, Centro')
  const [reference, setReference] = useState('Frente a la Plaza Principal')
  const [phone, setPhone] = useState('4611234567')
  const [prepTime, setPrepTime] = useState('12-15 min')
  const [openHours, setOpenHours] = useState('09:00 AM - 10:00 PM')
  const [isOpen, setIsOpen] = useState(true)
  const [lat, setLat] = useState(20.5230)
  const [lng, setLng] = useState(-100.8120)
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format&fit=crop')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('CIERRE_NEGOCIO')


  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamo_merchant_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.storeName) setStoreName(parsed.storeName)
        if (parsed.category) {
          if (['Comida / Restaurante 🍕', 'Farmacia & Salud 💊', 'Ferretería & Materiales 🛠️', 'Abarrotes & Supermercado 🛒', 'Ropa & Calzado 👕', 'Servicios & Refacciones 🔧'].includes(parsed.category)) {
            setCategory(parsed.category)
          } else {
            setCategory('Otro (Personalizado) 🏷️')
            setCustomCategory(parsed.category)
          }
        }
        if (parsed.customCategory) setCustomCategory(parsed.customCategory)
        if (parsed.catalogPdfUrl) setCatalogPdfUrl(parsed.catalogPdfUrl)
        if (parsed.address) setAddress(parsed.address)
        if (parsed.phone) setPhone(parsed.phone)
        if (parsed.lat) setLat(parsed.lat)
        if (parsed.lng) setLng(parsed.lng)
        if (parsed.logoUrl) setLogoUrl(parsed.logoUrl)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleGetCurrentGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
          alert(`Ubicación GPS capturada: Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`)
        },
        (err) => {
          alert('No se pudo acceder al GPS del navegador. Se mantendrán las coordenadas manuales.')
        }
      )
    }
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()

    const finalCategory = category === 'Otro (Personalizado) 🏷️' && customCategory.trim() 
      ? customCategory.trim() 
      : category

    const profileData = {
      storeName,
      category: finalCategory,
      customCategory,
      catalogPdfUrl,
      address,
      reference,
      phone,
      prepTime,
      openHours,
      isOpen,
      lat,
      lng,
      logoUrl,
      updatedAt: new Date().toISOString()
    }

    try {
      localStorage.setItem('vamo_merchant_profile', JSON.stringify(profileData))
    } catch (err) {
      console.error(err)
    }

    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
    }, 2500)
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      {/* Sidebar Responsivo */}
      <SidebarBiz activeTab="settings" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-8 py-6 md:py-10 max-w-4xl mx-auto w-full space-y-8">
          
          {/* Header Section */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-[#0056d2] text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#c3f400]" />
              <span>VISIBILIDAD EN RADAR CLIENTE VAMO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0056d2] tracking-tight">
              Perfil & Configuración de Local
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#737785]">
              Administra los datos comerciales, foto de portada y coordenadas GPS para que tus vecinos te encuentren en el Radar VAMO.
            </p>
          </div>

          {/* Formulario de Configuración del Local */}
          <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-6">
            
            {savedSuccess && (
              <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-2xl flex items-center gap-3 font-black text-xs sm:text-sm shadow-md animate-bounce">
                <CheckCircle2 className="w-6 h-6 text-[#161e00] shrink-0" />
                <span>¡PERFIL DE NEGOCIO GUARDADO! Ahora tu local es visible en el Radar Urbano.</span>
              </div>
            )}

            {/* SECCIÓN 1: DATOS COMERCIALES & IMAGEN */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Store className="w-4 h-4 text-[#0056d2]" /> 1. Datos Comerciales del Negocio
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Nombre Comercial del Negocio</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Ej. Tortería El Pariente / Ferretería La Central"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Giro / Categoría Principal</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-3 py-2.5 text-xs font-bold outline-none"
                  >
                    <option value="Comida / Restaurante 🍕">Comida / Restaurante 🍕</option>
                    <option value="Puesto Callejero / Taquería 🌮">Puesto Callejero / Taquería 🌮</option>
                    <option value="Farmacia & Salud 💊">Farmacia & Salud 💊</option>
                    <option value="Ferretería & Materiales 🛠️">Ferretería & Materiales 🛠️</option>
                    <option value="Abarrotes & Supermercado 🛒">Abarrotes & Supermercado 🛒</option>
                    <option value="Mercería, Botonería & Telas 🧵">Mercería, Botonería & Telas 🧵</option>
                    <option value="Papelería & Copias 📚">Papelería & Copias 📚</option>
                    <option value="Refaccionaria & Taller 🚗">Refaccionaria & Taller 🚗</option>
                    <option value="Ropa & Calzado 👕">Ropa & Calzado 👕</option>
                    <option value="Florería & Regalos 💐">Florería & Regalos 💐</option>
                    <option value="Panadería & Pastelería 🥖">Panadería & Pastelería 🥖</option>
                    <option value="Veterinaria & Mascotas 🐾">Veterinaria & Mascotas 🐾</option>
                    <option value="Otro (Personalizado) 🏷️">Otro (Personalizado) 🏷️</option>
                  </select>
                </div>
              </div>

              {/* Si es Otro Personalizado, input de texto libre */}
              {category === 'Otro (Personalizado) 🏷️' && (
                <div className="space-y-1 bg-[#fffde7] p-3.5 rounded-2xl border border-[#fddf33] animate-fade-in">
                  <label className="text-xs font-black text-[#726200]">Especifica tu Giro Comercial Personalizado:</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Ej. Tienda de Botones & Cierres, Venta de Semillas, Zapatería..."
                    required
                    className="w-full bg-white border border-[#fddf33] focus:border-[#0056d2] rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                  <p className="text-[10px] text-[#726200] font-semibold">
                    💡 Tu negocio aparecerá en el Radar VAMO bajo este giro exclusivo.
                  </p>
                </div>
              )}

              {/* Foto de Portada / Logo */}
              <SupabaseImageUploader
                label="Fotografía / Logotipo de Portada"
                currentImageUrl={logoUrl}
                onUploadSuccess={(url) => setLogoUrl(url)}
                bucketName="store-assets"
              />

              {/* Menú o Catálogo en PDF / Flyer */}
              <div className="bg-[#f0f4ff] p-5 rounded-[24px] border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#0056d2] flex items-center gap-1.5">
                    <span>📄 Menú o Catálogo Digital (PDF o Flyer Imagen)</span>
                  </label>
                  <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full uppercase">
                    MAX 5MB
                  </span>
                </div>

                {catalogPdfUrl ? (
                  <div className="bg-white p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0056d2] flex items-center justify-center font-black shrink-0">
                        📄
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-[#1c1b1b] block truncate">Documento de Catálogo Cargado</span>
                        <a 
                          href={catalogPdfUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[11px] text-[#0056d2] hover:underline font-bold"
                        >
                          Ver Archivo Adjunto ↗
                        </a>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCatalogPdfUrl('')}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors"
                    >
                      Quitar Archivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          
                          // Subir directamente con Supabase
                          const { createClient } = await import('@/lib/supabase/client')
                          const supabase = createClient()
                          const fileExt = file.name.split('.').pop()
                          const fileName = `catalog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
                          const filePath = `catalogs/${fileName}`

                          try {
                            const { error } = await supabase.storage
                              .from('store-assets')
                              .upload(filePath, file, { cacheControl: '3600', upsert: true })

                            if (error) {
                              const reader = new FileReader()
                              reader.onloadend = () => setCatalogPdfUrl(reader.result as string)
                              reader.readAsDataURL(file)
                              return
                            }

                            const { data: pub } = supabase.storage.from('store-assets').getPublicUrl(filePath)
                            setCatalogPdfUrl(pub.publicUrl)
                          } catch (err) {
                            const reader = new FileReader()
                            reader.onloadend = () => setCatalogPdfUrl(reader.result as string)
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#0056d2] file:text-white hover:file:bg-[#0040a1] cursor-pointer bg-white p-2 rounded-2xl border border-blue-200"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Sube tu carta en PDF o la fotografía de tu menú/volante. Tus clientes podrán consultarlo en el Radar Urbano sin costo adicional.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: UBICACIÓN FÍSICA & GPS */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-[#0056d2]" /> 2. Ubicación Física & Marcador GPS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Dirección Comercial Física</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Ej. Calle 5 de Mayo #12, Centro"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1c1b1b]">Referencia Visual para Repartidores</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Ej. Frente al Parque Principal / Portón Amarillo"
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Coordenadas GPS */}
              <div className="bg-[#fcf9f8] p-4 rounded-2xl border border-[#e5e2e1] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-[#1c1b1b] flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-[#0056d2]" /> Coordenadas GPS para Pin en el Radar
                  </span>
                  <button
                    type="button"
                    onClick={handleGetCurrentGps}
                    className="text-[11px] font-black text-[#0056d2] bg-white border border-[#0056d2]/30 px-3 py-1 rounded-full hover:bg-[#0056d2] hover:text-white transition-all cursor-pointer shadow-xs"
                  >
                    📍 Mi GPS Actual
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={lat}
                      onChange={e => setLat(parseFloat(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={lng}
                      onChange={e => setLng(parseFloat(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: OPERACIÓN & CONTACTO */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Clock className="w-4 h-4 text-[#0056d2]" /> 3. Operación & Contacto
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#1c1b1b]">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="4611234567"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-3 py-2.5 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#1c1b1b]">Horario de Atención</label>
                  <input
                    type="text"
                    value={openHours}
                    onChange={e => setOpenHours(e.target.value)}
                    placeholder="09:00 AM - 10:00 PM"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-3 py-2.5 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#1c1b1b]">Tiempo Prom. Preparación</label>
                  <input
                    type="text"
                    value={prepTime}
                    onChange={e => setPrepTime(e.target.value)}
                    placeholder="12-15 min"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl px-3 py-2.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

            {/* SECCIÓN 4: SEGURIDAD & VINCULACIÓN MULTI-INQUILINO POR QR & PIN */}
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-black text-[#0056d2] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Lock className="w-4 h-4 text-[#0056d2]" /> 4. Identificación de Local (Store Code) & Código QR de Cocina
              </h3>

              <div className="bg-[#161e00] text-white p-6 rounded-[28px] border border-[#c3f400]/40 space-y-4 shadow-sm">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-black text-[#c3f400] uppercase block">CÓDIGO DE LOCAL ÚNICO (STORE CODE):</span>
                    <p className="text-2xl font-black text-white font-mono tracking-wider mt-0.5">PARIENTE-88</p>
                    <p className="text-[11px] font-semibold text-slate-300">Identifica a este restaurante entre miles en VAMO.</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-[#c3f400] uppercase block">PIN DE SEGURIDAD DE ESTACIÓN:</span>
                    <p className="text-2xl font-black text-[#c3f400] font-mono tracking-widest mt-0.5">4 8 2 9</p>
                    <p className="text-[11px] font-semibold text-slate-300">Control de acceso para personal.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <a
                    href="http://localhost:3333/kds/auth?store=PARIENTE-88&pin=4829"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#c3f400] text-[#161e00] px-5 py-3 rounded-full text-xs font-black hover:bg-[#abd600] transition-all cursor-pointer shadow-md flex items-center gap-2 active:scale-95"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>📱 PROBAR AUTO-VINCULACIÓN QR (EN 1 SEGUNDO) ↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => alert('¡PIN de Cocina regenerado! El nuevo PIN es: ' + Math.floor(1000 + Math.random()*9000))}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border border-white/20"
                  >
                    🔄 Regenerar Nuevo PIN
                  </button>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl text-xs font-semibold text-slate-200 space-y-2 border border-white/10">
                  <strong className="text-[#c3f400] block font-black text-sm flex items-center gap-1.5">
                    <Printer className="w-4 h-4" /> 📋 INSTRUCCIONES PARA EL DUEÑO DEL RESTAURANTE:
                  </strong>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                    <li>Pídele al cocinero que abra la cámara de su celular y escanee el <strong>Código QR de la Cocina</strong>.</li>
                    <li>El celular abrirá <strong>http://localhost:3333/kds/auth?store=PARIENTE-88&pin=4829</strong> y se autorizará <strong>automáticamente en 1 segundo</strong>.</li>
                    <li>Si usan una Tablet sin cámara, el cocinero solo escribe el Código de Local <strong>PARIENTE-88</strong> y el PIN <strong>4829</strong>.</li>
                    <li>El personal de cocina <strong>NUNCA verá las ventas, finanzas ni contraseñas del restaurante</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>

              {/* Switch de Estado de Apertura */}
              <div className="bg-[#f5fff6] p-4 rounded-2xl border border-emerald-200 flex justify-between items-center">
                <div>
                  <strong className="text-xs font-extrabold text-emerald-950 block">Estado del Negocio en Tiempo Real</strong>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {isOpen ? '🟢 Tu negocio aparece ABIERTO en el Radar de Clientes' : '🔴 Tu negocio aparece CERRADO'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`px-4 py-2 rounded-full font-black text-xs transition-all shadow-sm cursor-pointer ${
                    isOpen ? 'bg-[#c3f400] text-[#161e00]' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isOpen ? 'ABIERTO 🟢' : 'CERRADO 🔴'}
                </button>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DE GUARDAR PERFIL */}
            <button
              type="submit"
              className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-4 rounded-full font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-5 h-5 text-[#c3f400]" />
              <span>GUARDAR Y PUBLICAR EN RADAR DE CLIENTES 🚀</span>
            </button>

            {/* SECCIÓN ZONA DE PELIGRO: DAR DE BAJA COMERCIO */}
            <div className="pt-6 border-t border-slate-200 text-center space-y-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="text-rose-600 hover:text-rose-700 text-xs font-black transition-colors cursor-pointer hover:underline"
              >
                ⚠️ Dar de Baja Mi Comercio / Salir de la Plataforma VAMO
              </button>
            </div>

          </form>

          {/* Modal de Cancelación Definitiva Comercio */}
          {showCancelModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#e5e2e1] animate-fade-in text-left">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black mx-auto text-xl">
                  🏪
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-base font-black text-slate-900">¿Deseas dar de baja este comercio?</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Tu tienda será retirada del radar de clientes, se cancelarán los accesos KDS de cocina y se desvinculará tu catálogo.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Motivo del Cierre / Baja</label>
                  <select
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl p-3 text-xs font-bold outline-none"
                  >
                    <option value="CIERRE_NEGOCIO">Cierre definitivo del negocio</option>
                    <option value="CAMBIO_GIRO">Cambio de giro comercial</option>
                    <option value="OTRA_PLATAFORMA">Uso de otro canal de venta</option>
                    <option value="OTRO">Otro motivo</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-full text-xs font-black"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await CancellationService.cancelAccount({
                        userId: 'biz-merchant-1',
                        role: 'merchant',
                        reason: cancelReason
                      })
                      alert('El comercio ha sido dado de baja exitosamente del sistema VAMO.')
                      window.location.href = '/customer/home'
                    }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-full text-xs font-black shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    CONFIRMAR BAJA
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

