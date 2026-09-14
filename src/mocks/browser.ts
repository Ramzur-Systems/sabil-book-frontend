/**
 * The mock API server.
 *
 * Imported dynamically from main.ts behind `VITE_USE_MOCKS === 'true'`, so it
 * lives in its own chunk and is never fetched when mocks are off. It runs in
 * the deployed demo build as well as in dev, because the marketplace endpoints
 * do not exist server-side yet.
 *
 * `import.meta.env.BASE_URL` is respected so the worker resolves correctly
 * when the app is served from a sub-path.
 */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export async function startMockServer(): Promise<void> {
  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: false,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
  console.info(
    '[sabil] Running on the MSW mock API. Data resets on reload. ' +
      'Set VITE_USE_MOCKS=false to point at a real backend.',
  )
}
