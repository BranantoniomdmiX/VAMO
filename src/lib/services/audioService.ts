/**
 * VAMO Audio Notification Service
 * Utiliza Web Audio API nativo del navegador para reproducir chimes y tonos de alerta
 * sin depender de archivos de audio externos.
 */

class AudioNotificationService {
  private audioCtx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
    return this.audioCtx
  }

  /**
   * Tono de Nueva Orden Recibida (Chime de 3 notas ascendentes)
   */
  playNewOrderChime() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + index * 0.12)

      gain.gain.setValueAtTime(0.01, now + index * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.3, now + index * 0.12 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + index * 0.12)
      osc.stop(now + index * 0.12 + 0.35)
    })
  }

  /**
   * Tono de Cambio de Estado / Repartidor en Camino (Doble Beep Amigable)
   */
  playStatusUpdateTone() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [587.33, 880] // D5, A5

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + index * 0.1)

      gain.gain.setValueAtTime(0.01, now + index * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.1 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.2)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + index * 0.1)
      osc.stop(now + index * 0.1 + 0.22)
    })
  }

  /**
   * Tono de Entrega Exitosa (Fanfarria corta)
   */
  playDeliveredFanfare() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      const startTime = now + index * 0.1
      const duration = index === 3 ? 0.5 : 0.15

      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.01, startTime)
      gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration + 0.05)
    })
  }
}

export const audioService = new AudioNotificationService()
