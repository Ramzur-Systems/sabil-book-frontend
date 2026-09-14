# Internal build contract (v1)

Frozen interfaces every agent codes against. Do not change a signature here without
updating this file. Read `DESIGN.md` for the visual system and `FRONTEND_SPEC.md` for scope.

## Already built (import, never reimplement)

### `@/components/ui/`
```ts
Button.vue      props: { variant?: 'primary'|'secondary'|'text'; type?: 'button'|'submit';
                          to?: RouteLocationRaw; disabled?: boolean; loading?: boolean; full?: boolean }
                slot: default (label)
Badge.vue       props: { label: string }
StatusPill.vue  props: { status: AnyStatus; tone?: StatusTone; label?: string }   // tone/label are escape hatches
StatRow.vue     props: { stats: { label: string; value: string|number }[] }
MiniRow.vue     props: { title: string; meta?: string; to?: RouteLocationRaw }; slot: default (trailing)
Avatar.vue      props: { name: string }
SectionHeading.vue  slot: default
EmptyState.vue  props: { title: string; body?: string }; slot: default (action)
SkeletonRows.vue props: { count?: number; height?: number }
ErrorState.vue  props: { error: unknown; title?: string }; emits: retry
ToastHost.vue   mounted once in App.vue — do not mount again
```

### `@/components/form/`
```ts
Field.vue     props: { label: string; hint?: string; error?: string; required?: boolean; forId?: string }
              default slot is SCOPED: v-slot="{ id, describedBy, invalid }"
              Usage:
                <Field label="Title" :error="errors.title">
                  <template #default="{ id, describedBy, invalid }">
                    <input :id="id" v-model="title" class="sb-control"
                           :aria-describedby="describedBy" :aria-invalid="invalid || undefined" />
                  </template>
                </Field>
FieldRow.vue  wraps 2–3 <Field>s side by side; stacks below 560px
```
`.sb-control` is the global input/textarea/select class defined in `assets/styles/main.css`.
Never style a raw input in a view.

### `@/components/layout/`
```ts
AppShell.vue   route-level wrapper for /app/* — views render inside it, never import it
PageHeader.vue props: { title: string; eyebrow?: string; subtitle?: string }; slot: action
```

### `@/lib/utils.ts`
`cn`, `formatMoney(amount, currency)`, `formatBudget(min, max, currency)`, `formatBytes(bytes)`,
`timeAgo(iso)`, `timeLeft(iso|null)`, `formatDate(iso|null)`, `initialsOf(name)`

### `@/types/status.ts`
`toneFor(status)`, `labelFor(status)`, `isInterruptStatus(orderStatus)`, types `AnyStatus`, `StatusTone`

### `@/stores/`
`useAuthStore()` → `{ accessToken, user, isAuthenticated, isProvider, setSession, setUser, clear, refresh }`
`useUiStore()`  → `{ toasts, notify(message, tone?: 'neutral'|'success'|'danger'), dismiss(id) }`

### `@/api/` — call ONLY through these; never `fetch` in a component
`auth.ts`     `login`, `register`, `refreshSession`, `me`, `updateMe`
`requests.ts` `listRequests(params)`, `getRequest(id)`, `createRequest(body)`, `updateRequest(id, body)`,
              `submitRequest(id)`, `listRequestOffers(id)`, `listCategories()`
`offers.ts`   `createOffer(requestId, body)`, `acceptOffer(offerId)`, `withdrawOffer(offerId)`, `listMyOffers()`
`orders.ts`   `listOrders(params)`, `getOrder(id)`, `payOrder(id, {method})`, `acceptDelivery(id)`,
              `requestCorrection(id, {reason})`, `openDispute(id, {reason})`, `submitReview(id, {rating, comment})`,
              `attachmentDownloadUrl(attachmentId)`
`providers.ts` `getMyProviderProfile()`, `upsertMyProviderProfile(body)`, `startKyc()`
`queryKeys.ts` `queryKeys` — every `useQuery`/`invalidateQueries` key comes from here, never a literal array

List endpoints resolve to `Paginated<T> = { results: T[]; count: number }`.

## To be built by the marketplace-components agent — FROZEN API

```ts
// @/components/marketplace/
OfferLedgerRow.vue
  props:  { offer: Offer; selected?: boolean; actionLabel?: string /* 'Accept' */;
            busy?: boolean; showAction?: boolean /* false → renders offer.status pill instead */ }
  emits:  { accept: [] }
  note:   `selected` is VISUAL ONLY (marine left bar + tint on the accepted offer). It does not
          change which event fires. Every open row gets an equal-weight secondary action on
          purpose — these are parallel human bids and the UI must not nudge toward one.

RequestRow.vue
  props:  { request: RequestT; categoryName?: string; actionLabel?: string; to?: RouteLocationRaw }
  emits:  { action: [] }

CategoryPicker.vue
  props:  { categories: Category[]; modelValue: string | null }
  emits:  { 'update:modelValue': [string] }        // radiogroup semantics, arrow-key navigable

OrderStepper.vue
  props:  { status: OrderStatus }                   // derives step state per spec §4; never takes a step index

StarRating.vue
  props:  { modelValue: number; readonly?: boolean; count?: number }   // count default 5
  emits:  { 'update:modelValue': [number] }         // radiogroup when interactive

FileCard.vue
  props:  { attachment: Attachment; downloadUrl: string }

SelectableCard.vue
  props:  { modelValue: string; value: string; label: string; description?: string; name: string }
  emits:  { 'update:modelValue': [string] }         // shared by CategoryPicker and checkout pay-methods
```

## View conventions

- Every view is `<script setup lang="ts">` + a `<template>` of shared components. If you need
  markup that isn't in the inventory, it must be plain layout (headings, grids, hairlines) — never
  a new colour, font, radius or shadow.
- Server state goes through `@tanstack/vue-query` (`useQuery` / `useMutation`), keyed via
  `queryKeys`. Invalidate related keys in `onSuccess`. Never hardcode data in a component.
- Every list surface handles all four states: loading (`SkeletonRows`), error (`ErrorState` with a
  working retry), empty (`EmptyState`), loaded.
- Mutations: disable the trigger via `:loading="mutation.isPending.value"`, toast on success via
  `useUiStore().notify`, surface failures inline or as a `danger` toast.
- Copy is direct and unhedged. No exclamation marks, no emoji, no encouragement.
- Responsive to 375px with zero horizontal scroll. Test long titles at every breakpoint.
- Strict TS: no `any`, no unused locals or params, `import type` for type-only imports
  (`verbatimModuleSyntax` is on).

---

# Public surface addendum (v2)

Guests browse freely; sign-in is demanded at the commit point, never by a route guard.

## Routes

Public (no guard): `/` home · `/requests` browse · `/requests/:id` detail · `/requests/new`
compose · `/requests/:id/offer` compose · `/experts` · `/experts/:id` · `/how-it-works`
Gated (`meta.auth`): everything under `/app` — dashboard, orders, checkout, review, my-offers,
earnings, onboarding, settings. Provider surfaces add `meta.provider`.

`SiteShell.vue` wraps everything except `/login`, `/register` and 404 (`meta.bare`). It renders
guest nav (Open requests · Experts · How it works · Sign in · Create an account) or member nav
automatically — views never think about it, and there is no second shell.

## What a guest may see

```ts
RequestT.description        // string | null — NULL for guests. Never render it raw without a check.
RequestT.descriptionPreview // string — always present, ~200 chars. Safe publicly.
RequestT.isMine             // boolean — true only for the signed-in owner.
```

- **Offers are owner-only.** `GET /requests/:id/offers` returns **403** for anyone but the owner.
  Sealed bids: public pitches would let providers undercut each other. Handle the 403 as a normal
  state, not an error banner.
- **Public provider profiles omit `userId`** (`ProviderProfile.userId` is now optional).
- `listRequests` / `getRequest` / `listCategories` / `listProviders` / `getProvider` pass
  `public: true` to the api client: the token is still sent when present, but a 401 means "guest",
  not "session died".

## Just-in-time auth — `useIntentStore()`

```ts
remember(kind, returnTo, draft)   // guest hit the commit action; persist and send to /login?next=
peek(kind, returnTo)              // restore form values on mount (non-destructive)
consume(kind, returnTo)           // read once and drop — a draft can never submit twice
clear()
// kind: 'create-request' | 'submit-offer'
```

Flow a compose view implements:
1. On mount, `peek()` and repopulate the form if a matching draft exists.
2. On submit while signed out: `remember(kind, route.fullPath, values)` then
   `router.push({ name: 'login', query: { next: route.fullPath } })`.
3. On mount while signed in, if `consume()` returns a draft with `submitOnReturn`, submit it
   automatically and tell the user what just happened.

Drafts live in `sessionStorage`, expire after 2h, and are scoped by `kind` + `returnTo`.

## Public views to build

`src/views/public/HomeView.vue`, `ExpertsView.vue`, `ExpertProfileView.vue`, `HowItWorksView.vue`.
Everything else in `src/views/` already exists — extend, don't recreate.
