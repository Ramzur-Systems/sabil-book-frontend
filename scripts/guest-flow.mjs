/**
 * End-to-end test of just-in-time auth: a guest composes an offer, is asked to
 * sign in at the commit point, and their work is submitted for them on return.
 * This is the behaviour the whole public surface exists to enable, so it gets
 * an explicit walk rather than a screenshot.
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const OUT = new URL('../.screenshots/', import.meta.url).pathname
const fails = []
const ok = (label) => console.log(`  PASS  ${label}`)
const bad = (label) => { fails.push(label); console.log(`  FAIL  ${label}`) }

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

// 1. A guest reaches a request detail without being asked to sign in.
await page.goto(`${BASE}/requests/req-observability`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
page.url().includes('/login') ? bad('guest reaches request detail') : ok('guest reaches request detail')

const guestBody = await page.evaluate(() => document.body.innerText)
const hasTeaser = guestBody.includes('…') || /sign in/i.test(guestBody)
const leaksOffers = /Aigerim K\.|\$520/.test(guestBody)
hasTeaser ? ok('guest sees teaser + sign-in prompt') : bad('guest sees teaser + sign-in prompt')
leaksOffers ? bad('offers must NOT leak to a guest') : ok('offers hidden from guest (sealed bids)')
await page.screenshot({ path: `${OUT}/flow-1-guest-detail.png`, fullPage: true })

// 2. A guest composes a full offer on someone else's request.
await page.goto(`${BASE}/requests/req-okr/offer`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
page.url().includes('/login') ? bad('guest reaches offer form') : ok('guest reaches offer form')

const PITCH =
  'I have built quarterly OKR templates for two marketing teams of this size and will include two worked examples plus a short facilitation guide.'
await page.fill('input[type=number] >> nth=0', '265')
await page.fill('input[type=number] >> nth=1', '5')
await page.fill('textarea', PITCH)
await page.screenshot({ path: `${OUT}/flow-2-guest-composed.png`, fullPage: true })

// 3. Commit → sign-in is demanded, and the reason is stated.
await page.click('button[type=submit]')
await page.waitForURL('**/login**', { timeout: 10000 }).catch(() => {})
page.url().includes('/login') ? ok('commit demands sign-in') : bad('commit demands sign-in')
const loginBody = await page.evaluate(() => document.body.innerText)
const statesIntent = /sign in to submit your offer/i.test(loginBody)
statesIntent ? ok('login states the pending intent') : bad('login states the pending intent')
await page.screenshot({ path: `${OUT}/flow-3-login-with-intent.png`, fullPage: true })

// 4. Sign in → returned to the form, draft intact, submitted automatically.
await page.fill('input[type=email]', 'alisher@example.kz')
await page.fill('input[type=password]', 'password123')
await page.click('button[type=submit]')
await page.waitForURL('**/app/offers**', { timeout: 20000 }).catch(() => {})
page.url().includes('/app/offers')
  ? ok('draft auto-submitted and landed on My offers')
  : bad(`draft auto-submitted (ended at ${page.url()})`)

await page.waitForTimeout(1500)
const offersBody = await page.evaluate(() => document.body.innerText)
const landed = /\$265/.test(offersBody)
landed ? ok('the guest-composed offer is really there ($265)') : bad('the guest-composed offer is really there ($265)')
await page.screenshot({ path: `${OUT}/flow-4-submitted.png`, fullPage: true })

// 5. The draft must be gone, so it can never replay.
// NB: assert on sessionStorage, not on a re-navigation. A full page load resets
// the MSW in-memory database, so a reload would drop the offer for reasons that
// have nothing to do with replay and mask the thing we actually care about.
const leftover = await page.evaluate(() => sessionStorage.getItem('sabil.intent'))
leftover === null ? ok('intent consumed, cannot replay') : bad(`intent still stored: ${leftover}`)

// Re-entering the compose form in-SPA must show an empty form, not the old draft.
await page.click('a[href="/requests"]')
await page.waitForTimeout(800)
await page.goto(`${BASE}/requests/req-intake/offer`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const pitchValue = await page.evaluate(() => document.querySelector('textarea')?.value ?? '')
pitchValue.trim() === '' ? ok('a fresh compose form starts empty') : bad('stale draft leaked into a new form')

// 6. Signed in, the full brief and the offers appear for the owner.
await page.goto(`${BASE}/requests/req-observability`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const ownerBody = await page.evaluate(() => document.body.innerText)
const seesLedger = /Aigerim K\./.test(ownerBody)
const seesBrief = /internal buy decision/.test(ownerBody)
seesLedger ? ok('owner sees the offers ledger') : bad('owner sees the offers ledger')
seesBrief ? ok('owner sees the full brief') : bad('owner sees the full brief')
await page.screenshot({ path: `${OUT}/flow-5-owner-detail.png`, fullPage: true })

// 7. In-app navigation must actually render.
// The screenshot harness only does full page loads, so it cannot see a broken
// client-side transition — a `<Transition mode="out-in">` around a lazy route
// component once left <main> empty on every in-app hop while every full load
// looked perfect. Walk the nav with real clicks.
for (const href of ['/requests', '/app', '/app/offers', '/app/earnings', '/app/settings', '/app']) {
  const link = await page.$(`nav a[href="${href}"]`)
  if (!link) { bad(`nav link ${href} exists`); continue }
  await link.click()
  await page.waitForTimeout(1400)
  const state = await page.evaluate(() => ({
    path: location.pathname,
    len: document.querySelector('main')?.innerText.trim().length ?? 0,
    title: document.title,
  }))
  if (state.path !== href) bad(`click ${href} navigated there (got ${state.path})`)
  else if (state.len < 40) bad(`click ${href} rendered content (main is empty)`)
  else if (!state.title.includes('Sabil Books')) bad(`click ${href} set a page title`)
  else ok(`in-app nav to ${href} renders`)
}

await browser.close()
if (errors.length) console.log('\nconsole/page errors:\n' + errors.join('\n'))
console.log(fails.length ? `\n${fails.length} FAILURE(S)` : '\nALL FLOW CHECKS PASSED')
process.exit(fails.length ? 1 : 0)
