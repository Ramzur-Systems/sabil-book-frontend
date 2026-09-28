import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'
import { router } from './router'
import { useSessionStore } from './stores/session'
import './style.css'

async function start() {
  if (import.meta.env.VITE_USE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
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
