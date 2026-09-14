import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, type VueQueryPluginOptions } from '@tanstack/vue-query'

import App from './App.vue'
import { router } from './router'
import './assets/styles/main.css'

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
function shouldUseMocks(): boolean {
  const flag = import.meta.env.VITE_USE_MOCKS
  if (flag === 'true') return true
  if (flag === 'false') return false
  return !/^https?:\/\//i.test(import.meta.env.VITE_API_BASE_URL ?? '')
}

async function bootstrap() {
  if (shouldUseMocks()) {
    const { startMockServer } = await import('./mocks/browser')
    await startMockServer()
  }

  createApp(App).use(createPinia()).use(router).use(VueQueryPlugin, queryOptions).mount('#app')
}

void bootstrap()
