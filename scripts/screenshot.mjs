/**
 * Visual + responsive smoke test.
 *
 * Walks all twelve routes at 1280px and 375px against the MSW-backed dev
 * server, and fails loudly on: console errors, uncaught page errors, an empty
 * <main>, or any horizontal overflow. Screenshots land in .screenshots/.
 *
 * Usage: `npm run dev` in one shell, then `npm run shots`.
 */
import { chromium } from 'playwright'

const OUT = process.env.SHOT_DIR ?? new URL('../.screenshots/', import.meta.url).pathname
const BASE = 'http://localhost:5173'

const browser = await chromium.launch()
const errors = []

async function shot(name, path, width = 1280) {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${name}] console: ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`))
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  if (path !== '/login' && page.url().includes('/login')) {
    errors.push(`[${name}@${width}] GUEST WAS REDIRECTED TO /login from ${path}`)
  }
  const bodyText = (await page.evaluate(() => document.body.innerText)) ?? ''
  if (bodyText.trim().length < 40) errors.push(`[${name}@${width}] PAGE LOOKS EMPTY`)
  // horizontal-overflow probe
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      ? { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }
      : null,
  )
  if (overflow) errors.push(`[${name}@${width}] HORIZONTAL OVERFLOW ${overflow.scroll} > ${overflow.client}`)
  await page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: true })
  await ctx.close()
}

// Log in first, then persist storage for the app routes.
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push(`[login] pageerror: ${e.message}`))
await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/00-login-1280.png`, fullPage: true })
await page.fill('input[type=email]', 'nurlan@example.kz')
await page.fill('input[type=password]', 'password123')
await page.click('button[type=submit]')
await page.waitForURL('**/app', { timeout: 15000 }).catch(() => errors.push('[login] did not redirect to /app'))
await page.waitForTimeout(1500)
const storage = await ctx.storageState()
await ctx.close()

const routes = [
  ['01-dashboard', '/app'],
  ['02-create-request', '/requests/new'],
  ['03-request-detail', '/requests/req-observability'],
  ['04-checkout', '/app/orders/ord-pmp/pay'],
  ['05-order-status', '/app/orders/ord-pmp'],
  ['06-review', '/app/orders/ord-pmp/review'],
  ['07-browse', '/requests'],
  ['08-submit-offer', '/requests/req-okr/offer'],
  ['09-my-offers', '/app/offers'],
  ['10-earnings', '/app/earnings'],
  ['11-settings', '/app/settings'],
  ['12-onboarding', '/app/providers/onboarding'],
]

/** Everything a signed-out stranger can reach. */
const publicRoutes = [
  ['p0-home', '/'],
  ['p1-browse', '/requests'],
  ['p2-request-detail', '/requests/req-observability'],
  ['p3-experts', '/experts'],
  ['p4-expert-profile', '/experts/prv-nurlan'],
  ['p5-how-it-works', '/how-it-works'],
  ['p6-create-request', '/requests/new'],
  ['p7-submit-offer', '/requests/req-okr/offer'],
]

async function shotAuthed(name, path, width) {
  const c = await browser.newContext({ storageState: storage, viewport: { width, height: 1000 }, deviceScaleFactor: 2 })
  const p = await c.newPage()
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`[${name}] console: ${m.text()}`) })
  p.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`))
  await p.goto(BASE + path, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1400)
  const overflow = await p.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      ? { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth } : null)
  if (overflow) errors.push(`[${name}@${width}] HORIZONTAL OVERFLOW ${overflow.scroll} > ${overflow.client}`)
  const empty = await p.evaluate(() => (document.querySelector('main')?.innerText ?? '').trim().length < 20)
  if (empty) errors.push(`[${name}@${width}] MAIN LOOKS EMPTY`)
  await p.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: true })
  await c.close()
}

// Signed-out first: these must render with no session at all.
for (const [name, path] of publicRoutes) await shot(name, path, 1280)
for (const [name, path] of publicRoutes) await shot(name, path, 375)
await shot('00-login', '/login', 375)

for (const [name, path] of routes) await shotAuthed(name, path, 1280)
for (const [name, path] of routes) await shotAuthed(name, path, 375)

await browser.close()
console.log(errors.length ? 'ISSUES:\n' + errors.join('\n') : 'NO ISSUES DETECTED')
