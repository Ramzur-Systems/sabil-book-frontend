import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastTone = 'neutral' | 'success' | 'danger'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

let nextId = 1

/** How long a dismissible toast stays up when nothing is holding it open. */
const TOAST_MS = 5000

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])

  /** Live timers, and the remaining time for a toast whose timer is paused. */
  const timers = new Map<number, number>()
  const remaining = new Map<number, number>()
  const startedAt = new Map<number, number>()

  function clearTimer(id: number) {
    const handle = timers.get(id)
    if (handle !== undefined) {
      window.clearTimeout(handle)
      timers.delete(id)
    }
  }

  function dismiss(id: number) {
    clearTimer(id)
    remaining.delete(id)
    startedAt.delete(id)
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function arm(id: number, ms: number) {
    clearTimer(id)
    remaining.set(id, ms)
    startedAt.set(id, Date.now())
    timers.set(id, window.setTimeout(() => dismiss(id), ms))
  }

  /**
   * Hold a toast open while the pointer is over it or focus is inside it.
   * Without this, a five-second window is the only chance a user has to read a
   * failure — WCAG 2.2.1 requires the ability to extend it.
   */
  function pause(id: number) {
    if (!timers.has(id)) return
    const began = startedAt.get(id) ?? Date.now()
    const left = (remaining.get(id) ?? TOAST_MS) - (Date.now() - began)
    clearTimer(id)
    remaining.set(id, Math.max(left, 600))
  }

  /** Resume a paused countdown. A toast with no timer (danger) stays put. */
  function resume(id: number) {
    if (timers.has(id)) return
    const left = remaining.get(id)
    if (left === undefined) return
    arm(id, left)
  }

  /**
   * `danger` never auto-dismisses. "Payment failed", "dispute opened" and
   * "accept failed" reach the user through this channel alone, and a result
   * that irreversible must not expire on its own — the Dismiss button ends it.
   */
  function notify(message: string, tone: ToastTone = 'neutral') {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message, tone }]
    if (tone !== 'danger') arm(id, TOAST_MS)
    return id
  }

  return { toasts, notify, dismiss, pause, resume }
})
