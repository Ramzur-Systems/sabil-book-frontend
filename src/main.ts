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

async function bootstrap() {
  /*
   * The mock API is gated on VITE_USE_MOCKS alone, NOT on import.meta.env.DEV.
   * The marketplace endpoints don't exist server-side yet, so the deployed
   * demo build runs against MSW too — gating on DEV would ship a production
   * bundle where every request 404s and the app renders empty.
   *
   * The import stays dynamic, so when VITE_USE_MOCKS is "false" the mock
   * module and its fixtures are never fetched and Rollup keeps them in a
   * separate chunk, out of the main bundle.
   */
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { startMockServer } = await import('./mocks/browser')
    await startMockServer()
  }

  createApp(App).use(createPinia()).use(router).use(VueQueryPlugin, queryOptions).mount('#app')
}

void bootstrap()
