'use client'

/**
 * Servicio de Autenticación Biométrica Nativa FIDO2 / WebAuthn (Passkeys)
 * Soporta Face ID, Touch ID y Sensor de Huellas dactilares en móviles y escritorio.
 */

// Utilidad para convertir Buffer a Base64URL
function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i])
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Utilidad para convertir Base64URL a Buffer
function base64URLToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const binStr = atob(base64)
  const bytes = new Uint8Array(binStr.length)
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i)
  }
  return bytes.buffer
}

export class PasskeyService {
  /**
   * Verifica si el dispositivo y navegador actual soportan autenticación biométrica (WebAuthn)
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create)
  }

  /**
   * Registra una nueva Passkey biométrica vinculada a la identidad del usuario
   */
  static async registerPasskey(user: { id: string; email: string; name: string }): Promise<{
    success: boolean
    credentialId?: string
    publicKey?: string
    error?: string
  }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Este dispositivo no soporta biometría WebAuthn / Passkeys.' }
    }

    try {
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      const userIdBuffer = new TextEncoder().encode(user.id)

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'VAMO SaaS Logística Urbana',
          id: window.location.hostname
        },
        user: {
          id: userIdBuffer,
          name: user.email,
          displayName: user.name
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Face ID / Huella del dispositivo
          userVerification: 'required',
          residentKey: 'required'
        },
        timeout: 60000,
        attestation: 'none'
      }

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      })) as PublicKeyCredential

      if (!credential) {
        return { success: false, error: 'No se completó el registro biométrico.' }
      }

      const credentialId = bufferToBase64URL(credential.rawId)
      
      // Guardar localmente para acceso rápido offline/PWA
      localStorage.setItem('vamo_passkey_credential_id', credentialId)
      localStorage.setItem('vamo_passkey_user_email', user.email)

      return {
        success: true,
        credentialId
      }
    } catch (err: any) {
      console.error('Error registrando Passkey:', err)
      return {
        success: false,
        error: err.name === 'NotAllowedError' 
          ? 'Operación biométrica cancelada o denegada por el usuario.' 
          : err.message || 'Error al registrar biometría.'
      }
    }
  }

  /**
   * Autenticación Biométrica en 1-Tap (Face ID / Huella)
   */
  static async authenticateWithPasskey(): Promise<{
    success: boolean
    credentialId?: string
    error?: string
  }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Biometría no disponible en este navegador.' }
    }

    try {
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      const savedCredentialId = localStorage.getItem('vamo_passkey_credential_id')

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        rpId: window.location.hostname,
        userVerification: 'required',
        allowCredentials: savedCredentialId
          ? [
              {
                id: base64URLToBuffer(savedCredentialId),
                type: 'public-key',
                transports: ['internal']
              }
            ]
          : []
      }

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      })) as PublicKeyCredential

      if (!assertion) {
        return { success: false, error: 'No se completó la verificación biométrica.' }
      }

      const credentialId = bufferToBase64URL(assertion.rawId)
      return {
        success: true,
        credentialId
      }
    } catch (err: any) {
      console.error('Error autenticando con Passkey:', err)
      return {
        success: false,
        error: err.name === 'NotAllowedError'
          ? 'Verificación biométrica cancelada.'
          : err.message || 'Error en autenticación biométrica.'
      }
    }
  }
}
