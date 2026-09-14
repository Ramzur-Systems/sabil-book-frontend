/**
 * Dev-only mock server. Imported dynamically from main.ts behind
 * `import.meta.env.DEV && VITE_USE_MOCKS === 'true'`, so neither MSW nor the
 * fixtures reach the production bundle.
 */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export async function startMockServer(): Promise<void> {
  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: false,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
  console.info('[sabil] MSW mock API active — set VITE_USE_MOCKS=false to use the real backend.')
}
