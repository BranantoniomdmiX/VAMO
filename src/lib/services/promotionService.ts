import { createClient } from '@/lib/supabase/client'

export interface MerchantPromotion {
  id: string
  merchant_id?: string
  store_name: string
  category: string
  title: string
  image_url: string
  discount_badge: string
  code: string
  description: string
  valid_until: string
  badge_type?: string
  is_active?: boolean
  created_at?: string
}

/**
  * Obtiene todas las promociones activas (desde Supabase con fallback a localStorage).
  */
export async function getActivePromotions(): Promise<MerchantPromotion[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('merchant_promotions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      return data as MerchantPromotion[]
    }
  } catch (err) {
    console.warn('Fallback a localStorage para promociones:', err)
  }

  // Fallback a localStorage
  try {
    const local = localStorage.getItem('vamo_merchant_custom_promos')
    if (local) {
      return JSON.parse(local)
    }
  } catch (e) {
    console.error(e)
  }

  return []
}

/**
  * Guarda una nueva promoción publicada por un Comercio.
  */
export async function publishMerchantPromotion(promo: Omit<MerchantPromotion, 'id'>): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = createClient()
  
  // Guardar en Supabase
  try {
    const { data, error } = await supabase
      .from('merchant_promotions')
      .insert({
        store_name: promo.store_name,
        category: promo.category,
        title: promo.title,
        image_url: promo.image_url,
        discount_badge: promo.discount_badge,
        code: promo.code,
        description: promo.description,
        valid_until: promo.valid_until,
        badge_type: promo.badge_type || 'POPULAR',
        is_active: true
      })
      .select()
      .single()

    if (!error && data) {
      return { success: true, data }
    }
  } catch (err: any) {
    console.warn('Persistencia en Supabase no disponible, usando localStorage:', err)
  }

  // Fallback LocalStorage
  try {
    const newPromo = { id: `custom_${Date.now()}`, ...promo }
    const existing = localStorage.getItem('vamo_merchant_custom_promos')
    const parsed = existing ? JSON.parse(existing) : []
    const updated = [newPromo, ...parsed]
    localStorage.setItem('vamo_merchant_custom_promos', JSON.stringify(updated))
    return { success: true, data: newPromo }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
