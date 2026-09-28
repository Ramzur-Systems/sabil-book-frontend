import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'
import { router } from './router'
import { useSessionStore } from './stores/session'
import './style.css'

/**
 * Should the in-browser mock API run?
 *
 *   VITE_USE_MOCKS=true   → yes
 *   VITE_USE_MOCKS=false  → no
 *   unset                 → yes, UNLESS a real backend host is configured
 */
function mockDecision(): { on: boolean; why: string } {
  const flag = import.meta.env.VITE_USE_MOCKS
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  if (flag === 'true') return { on: true, why: 'VITE_USE_MOCKS=true' }
  if (flag === 'false') return { on: false, why: 'VITE_USE_MOCKS=false' }
  if (/^https?:\/\//i.test(base)) {
    return {
      on: false,
      why: `VITE_USE_MOCKS is unset and VITE_API_BASE_URL points at a real host (${base}). Set VITE_USE_MOCKS=true to force the mock API instead.`,
    }
  }
  return { on: true, why: 'VITE_USE_MOCKS is unset and no absolute API host is configured' }
}

async function start() {
  const mocks = mockDecision()
  console.info(
    `[sabil] data source: ${mocks.on ? 'MOCK API (MSW)' : `live API at ${import.meta.env.VITE_API_BASE_URL}`} — ${mocks.why}`,
  )
  if (mocks.on) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.use(VueQueryPlugin, {
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          refetchOnWindowFocus: false,
          retry: (failureCount, error) => {
            const status = (error as { status?: number }).status
            if (status && status >= 400 && status < 500) return false
            return failureCount < 2
          },
        },
      },
    }),
  })
  await useSessionStore(pinia).restore()
  await router.isReady()
  app.mount('#app')
}

start().catch((error: unknown) => {
  console.error('Sabil Qalam could not start', error)
  document.querySelector('#app')!.textContent =
    'Could not start the site. Check the browser console and MSW worker setup.'
})
