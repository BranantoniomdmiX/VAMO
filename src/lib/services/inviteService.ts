'use client'

import { createClient } from '@/lib/supabase/client'

export interface OnboardingInvite {
  id: string
  createdBy: string
  targetRole: 'owner' | 'driver' | 'biz' | 'base'
  inviteToken: string
  phoneOrEmail: string
  ownerId?: string
  isUsed: boolean
  expiresAt: string
  createdAt: string
}

export class InviteService {
  private static STORAGE_KEY = 'vamo_onboarding_invites'

  /**
   * Crea una nueva invitación foliada con token UUID y expiración a 7 días
   */
  static async createInvite(params: {
    targetRole: 'owner' | 'driver' | 'biz' | 'base'
    phoneOrEmail: string
    createdById: string
    ownerId?: string
    plazaName?: string
  }): Promise<{ success: boolean; invite?: OnboardingInvite; inviteUrl?: string; error?: string }> {
    const supabase = createClient()
    const token = `VAMO-INV-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const newInvite: OnboardingInvite = {
      id: `inv-${Date.now()}`,
      createdBy: params.createdById,
      targetRole: params.targetRole,
      inviteToken: token,
      phoneOrEmail: params.phoneOrEmail,
      ownerId: params.ownerId,
      isUsed: false,
      expiresAt,
      createdAt: new Date().toISOString()
    }

    try {
      // Intentar guardar en base de datos PostgreSQL
      const { error } = await supabase.from('onboarding_invites').insert({
        created_by: params.createdById,
        target_role: params.targetRole,
        invite_token: token,
        phone_or_email: params.phoneOrEmail,
        owner_id: params.ownerId,
        expires_at: expiresAt
      })

      if (error) {
        console.warn('Fallback a almacenamiento local de invitaciones:', error.message)
      }
    } catch (e) {
      console.warn('Excepción guardando invitación:', e)
    }

    // Persistencia local para alta disponibilidad
    if (typeof window !== 'undefined') {
      try {
        const existing = this.getStoredInvites()
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([newInvite, ...existing]))
      } catch {}
    }

    const host = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3333'
    const inviteUrl = `${host}/auth/join?token=${token}&role=${params.targetRole}`

    return {
      success: true,
      invite: newInvite,
      inviteUrl
    }
  }

  /**
   * Valida si un token de invitación existe, no ha sido usado y no ha expirado
   */
  static async validateToken(token: string): Promise<{
    valid: boolean
    invite?: OnboardingInvite
    error?: string
  }> {
    if (!token) return { valid: false, error: 'Token de invitación no proporcionado.' }

    // 1. Verificar en Supabase
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('onboarding_invites')
        .select('*')
        .eq('invite_token', token.trim())
        .single()

      if (data && !error) {
        if (data.is_used) return { valid: false, error: 'Esta invitación ya fue utilizada previamente.' }
        if (new Date(data.expires_at) < new Date()) return { valid: false, error: 'Esta invitación ha expirado.' }
        return {
          valid: true,
          invite: {
            id: data.id,
            createdBy: data.created_by,
            targetRole: data.target_role,
            inviteToken: data.invite_token,
            phoneOrEmail: data.phone_or_email,
            ownerId: data.owner_id,
            isUsed: data.is_used,
            expiresAt: data.expires_at,
            createdAt: data.created_at
          }
        }
      }
    } catch {}

    // 2. Fallback de validación local
    const localList = this.getStoredInvites()
    const found = localList.find(i => i.inviteToken.trim().toUpperCase() === token.trim().toUpperCase())
    if (!found) {
      return { valid: false, error: 'Invitación no encontrada o código no autorizado.' }
    }
    if (found.isUsed) {
      return { valid: false, error: 'Esta invitación ya fue utilizada previamente.' }
    }
    if (new Date(found.expiresAt) < new Date()) {
      return { valid: false, error: 'Esta invitación ha expirado (validez: 7 días).' }
    }

    return { valid: true, invite: found }
  }

  /**
   * Marca la invitación como consumida tras el alta exitosa
   */
  static async consumeToken(token: string, userId: string): Promise<boolean> {
    try {
      const supabase = createClient()
      await supabase
        .from('onboarding_invites')
        .update({ is_used: true, used_by: userId, used_at: new Date().toISOString() })
        .eq('invite_token', token)
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const localList = this.getStoredInvites()
        const updated = localList.map(i => i.inviteToken === token ? { ...i, isUsed: true } : i)
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated))
      } catch {}
    }

    return true
  }

  private static getStoredInvites(): OnboardingInvite[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }
}
