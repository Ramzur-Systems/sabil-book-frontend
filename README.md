# Sabil Books — frontend

Vue 3 + TypeScript SPA for a reverse marketplace for expert-written material. A customer posts a
request, providers bid, the customer compares offers side by side and accepts one; money sits in
escrow from funding until the delivery is accepted.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

The dev server boots with **MSW mocks on** (`VITE_USE_MOCKS=true` in `.env`), seeded with the exact
content from `sabil_design_v1.html`, so all ten screens are walkable end to end without a backend.
The signed-in fixture user is both customer and provider, so the customer and provider journeys are
both reachable from one session.

To point at the real Django API instead:

```bash
VITE_USE_MOCKS=false VITE_API_BASE_URL=http://localhost:8000/api npm run dev
```

Note: as of this build the backend exposes only `/api/users/`. The marketplace endpoints in
`FRONTEND_SPEC.md` §3 are not implemented server-side yet — the api client is written against
those URLs and will work unchanged once they land.

```bash
npm run typecheck   # vue-tsc --noEmit
npm run build       # typecheck + production bundle
npm run preview     # serve the built bundle
npm run shots       # visual + responsive smoke test (dev server must be running)
npm run flow        # end-to-end guest → sign-in → auto-submit walk
```

`npm run shots` walks every public and member route at 1280px and 375px in headless Chromium
and fails on console errors, uncaught exceptions, an empty `<main>`, or any
horizontal overflow — and asserts a signed-out visitor is never bounced to `/login`.
`npm run flow` walks the just-in-time auth round trip end to end. Screenshots go to
`.screenshots/` (gitignored).

## Public vs. signed-in

A stranger can read the whole marketplace without an account. Sign-in is demanded at the
commit point, never by a route guard.

| Public | Signed in (`/app/*`) |
|---|---|
| `/` home · `/requests` · `/requests/:id` · `/experts` · `/experts/:id` · `/how-it-works` | dashboard, orders, checkout, review, my offers, earnings, onboarding, settings |
| Composing a request or an offer — the whole form | Submitting either one |

Two things stay private on purpose:

- **Offers are sealed.** `GET /requests/:id/offers` answers 403 to anyone but the customer who
  posted the request. Public pitches and prices would let providers undercut each other and
  destroy the comparison the product is built around.
- **Full briefs are gated.** A guest gets `descriptionPreview` (200 chars) and
  `description: null`; signing in reveals the body. A brief shorter than the preview limit is
  fully visible, and the UI says so rather than claiming an excerpt (`descriptionTruncated`).

Work survives the sign-in round trip: `stores/intent.ts` holds a guest's in-progress request or
offer in `sessionStorage`, and the destination view submits it on return, exactly once.

## Documents

| File | What it is |
|---|---|
| `FRONTEND_SPEC.md` | The execution spec: stack, component inventory, routes, enums, folder layout |
| `sabil_design_v1.html` | Canonical visual reference — 10 screens. When code and this disagree, this wins |
| `PRODUCT.md` | Register, users, purpose, brand personality, anti-references, design principles |
| `DESIGN.md` | The visual system: palette, type scale, layout rules, component specs, motion |
| `CONTRACTS.md` | Frozen internal interfaces — component props/emits, api functions, view conventions |

## Architecture

```
src/
  api/          typed fetch wrappers, one file per resource + queryKeys.ts
  components/
    ui/         Button Badge StatusPill StatRow MiniRow Avatar SectionHeading
                EmptyState SkeletonRows ErrorState ToastHost
    marketplace/ OfferLedgerRow RequestRow CategoryPicker SelectableCard
                 OrderStepper StarRating FileCard
    form/       Field FieldRow
    layout/     AppShell PageHeader
  mocks/        MSW handlers + in-memory db (dev only, tree-shaken from prod)
  router/       routes with auth + provider guards
  stores/       auth (Pinia, persisted to localStorage), ui (toasts)
  types/        entities.ts (backend enums verbatim), status.ts (status → tone map)
  views/        one per route
  assets/styles/ tokens.css (the single source of colour/type/motion), main.css
```

Rules the codebase holds itself to:

- **No colour, font, radius or shadow outside `tokens.css`.** `box-shadow` is banned outright —
  Tailwind's shadow core plugin is disabled so it cannot be reintroduced by a utility class.
- **Status is never an ad-hoc string.** `StatusPill` and `OrderStepper` derive everything from the
  backend enums in `types/entities.ts` through the one tone map in `types/status.ts`.
- **Components never call `fetch`.** Server state flows through TanStack Query composables over the
  typed functions in `src/api/`, keyed via `queryKeys` so invalidation can't miss a cache entry.
- **Every shared component exists once.** A view is composition plus layout, never new one-off markup.

## Design system in one paragraph

A printed ledger, not an app. Parchment ground (`#F7F4EC`), warm hairlines (`#DDD6C7`, never cold
gray), deep marine (`#1B3A5C`) reserved for the one actionable element in a region, brass
(`#9C7A3C`) for expertise cues. Structure is bordered rows with a 3px left accent bar — the bar
turning marine is how selection is expressed. Square corners on structure, 4px only on interactive
controls. Source Serif 4 is reserved for human writing (request titles, offer pitches, screen
titles); IBM Plex Sans carries all UI chrome. Motion is quiet and functional, and every transition
has a `prefers-reduced-motion` alternative.
