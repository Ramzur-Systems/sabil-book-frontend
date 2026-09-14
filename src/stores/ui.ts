import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastTone = 'neutral' | 'success' | 'danger'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

let nextId = 1

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function notify(message: string, tone: ToastTone = 'neutral') {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message, tone }]
    window.setTimeout(() => dismiss(id), 5000)
    return id
  }

  return { toasts, notify, dismiss }
})
