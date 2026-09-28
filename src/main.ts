import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'
import { router } from './router'
import { useSessionStore } from './stores/session'
import './style.css'

<<<<<<< HEAD
async function start() {
  if (import.meta.env.VITE_USE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
=======
const queryOptions: VueQueryPluginOptions = {
  queryClientConfig: {
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
  },
}

/**
 * Should the in-browser mock API run?
 *
 *   VITE_USE_MOCKS=true   → yes
 *   VITE_USE_MOCKS=false  → no
 *   unset                 → yes, UNLESS a real backend host is configured
 *
 * The permissive default is deliberate. The marketplace endpoints do not exist
 * server-side yet, so a build that loses the env var should still produce a
 * working demo rather than an app where every request 404s and the page renders
 * empty — which is exactly what a deploy from a stale commit did.
 *
 * The escape hatch is automatic: pointing VITE_API_BASE_URL at an absolute
 * http(s) origin means someone has wired a real API, so mocks stay off even
 * with the flag unset. Nothing silently intercepts a configured backend.
 */
function mockDecision(): { on: boolean; why: string } {
  const flag = import.meta.env.VITE_USE_MOCKS
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  if (flag === 'true') return { on: true, why: 'VITE_USE_MOCKS=true' }
  if (flag === 'false') return { on: false, why: 'VITE_USE_MOCKS=false' }
  if (/^https?:\/\//i.test(base)) {
    return {
      on: false,
      why: `VITE_USE_MOCKS is unset and VITE_API_BASE_URL points at a real host (${base}), so the app is talking to that backend. Set VITE_USE_MOCKS=true to force the mock API instead.`,
    }
  }
  return { on: true, why: 'VITE_USE_MOCKS is unset and no absolute API host is configured' }
}

async function bootstrap() {
  const mocks = mockDecision()
  // Always say which data source was chosen and why. A silent choice here once
  // cost a deploy's worth of debugging: the app looked broken when it was in
  // fact faithfully calling a backend host that did not resolve.
  console.info(
    `[sabil] data source: ${mocks.on ? 'MOCK API (MSW)' : `live API at ${import.meta.env.VITE_API_BASE_URL}`} — ${mocks.why}`,
  )

  if (mocks.on) {
    const { startMockServer } = await import('./mocks/browser')
    await startMockServer()
>>>>>>> 32ed0b46e81f57dfbe5fc65f54b5f2692c261809
  }
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.use(VueQueryPlugin, {
    queryClient: new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
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
