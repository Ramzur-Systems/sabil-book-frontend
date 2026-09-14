# Sabil Books — frontend build spec (v1)

This is an execution spec, not a design brief. The visual direction is already locked — see
`sabil_design_v1.html` (10 screens, design tokens, component patterns). Your job here is to turn
that reference into a real Vue 3 codebase. Don't re-derive the design; translate it.

Companion docs (place alongside this file if available):
- `sabil_design_v1.html` — canonical visual reference, 10 screens, color/type tokens
- `Sabil_Books_Technical_Specification.docx` — DB schema, full API, state machines (summarized
  and typed below so you don't need the docx to start)

If a screen is needed that isn't in `sabil_design_v1.html` (settings, login, onboarding/KYC,
admin), run the frontend-design skill
(https://github.com/anthropics/skills/tree/main/skills/frontend-design) for that screen only,
using the token system below as a hard constraint — don't invent a new palette or type system.
Admin screens are explicitly out of scope for this spec (see "Out of scope").

## 0. Stack

- Vue 3, `<script setup>`, TypeScript, Vite
- Vue Router 4
- Pinia (state)
- TanStack Query for Vue (`@tanstack/vue-query`) for server state / caching over the REST API
- Tailwind CSS + shadcn-vue (reka-ui primitives) for the component layer
- Zod for form/API response validation
- `IBM Plex Sans` + `Source Serif 4` via Google Fonts (already wired in the mockup's `<head>`)

Do not introduce a second UI kit (Vuetify, Element Plus, etc.) for product screens — shadcn-vue
components get copied into the repo and restyled with the tokens below, not installed as a
black-box dependency.

Admin panel is a separate app/package using Vue Vben Admin, not this stack. Out of scope here.

## 1. Design tokens

Pull these verbatim into `src/assets/styles/tokens.css` as CSS custom properties, and mirror them
into `tailwind.config.ts` under `theme.extend.colors` so both plain CSS and Tailwind utilities stay
in sync with `sabil_design_v1.html`.

```css
:root {
  --ink: #12233D;       /* primary text, dark surfaces */
  --marine: #1B3A5C;     /* primary accent — buttons, links, active states */
  --marine-dark: #0F2A45;/* hover state for marine */
  --parchment: #F7F4EC;  /* page background */
  --paper: #FFFEFB;      /* card/row background */
  --brass: #9C7A3C;      /* ratings, verified/expert cues */
  --brass-bg: #F1E6D1;   /* badge backgrounds */
  --slate: #5B6472;      /* secondary text */
  --slate-bg: #E9E7DE;   /* neutral status pill */
  --line: #DDD6C7;       /* all hairline borders — warm-toned, not cold gray */
  --green: #2F6B4F;      /* success status */
  --green-bg: #E3EEE7;
  --red: #A23B32;        /* danger / dispute status */
  --red-bg: #F5E4E1;
}
```

Type: `Source Serif 4` for request/offer titles and provider pitch text only (the actual expert
writing). `IBM Plex Sans` for everything else — nav, buttons, prices, statuses, form fields. Don't
swap this pairing or use serif for UI chrome.

Layout: bordered "ledger rows" with a 3px left accent bar, not rounded cards with shadows. Corner
radius 4px on interactive controls only (buttons, inputs, badges); structural rows and cards stay
square. No `box-shadow` anywhere in the product UI.

## 2. Component inventory

Build these as the shared component layer under `src/components/`. Each is used on 2+ screens in
the mockup — treat that reuse as the contract, not a coincidence.

| Component | Used on | Notes |
|---|---|---|
| `ui/Button.vue` | everywhere | variants: `primary` (filled marine), `secondary` (outline marine), `text` (underlined, red — used only for destructive/last-resort actions like "Open a dispute") |
| `ui/Badge.vue` | request/offer screens | category pill, brass-bg + brass text |
| `ui/StatusPill.vue` | dashboard, my offers, earnings | props: `status`, `tone: 'brass' \| 'green' \| 'red' \| 'slate'` — see status → tone mapping in §4 |
| `ui/StatRow.vue` | dashboard, request detail, earnings | horizontal row of labeled stats, divided by hairlines, not cards |
| `ui/MiniRow.vue` | dashboard, my offers, earnings | compact list row: title + meta + trailing status/action |
| `marketplace/OfferLedgerRow.vue` | request detail | avatar initials, name, rating, pitch (serif italic), meta, price, action button; `selected` prop toggles the marine left-bar + tinted background |
| `marketplace/RequestRow.vue` | browse | title (serif), category badge, budget/deadline/offer-count meta, "Submit offer" action |
| `marketplace/CategoryPicker.vue` | create request wizard | 3-card row, single-select, selected state = marine left-bar |
| `marketplace/OrderStepper.vue` | order status | 4-step horizontal tracker: funded → delivered → under_review → completed; steps render `done` / `current` / future purely from the order status enum (§4) |
| `marketplace/StarRating.vue` | review | 5-star input, brass fill, read and input modes |
| `marketplace/FileCard.vue` | order status | icon, filename, size, upload time, scan status, download link |
| `form/Field.vue` | create request, submit offer, checkout | label + input/textarea slot, consistent spacing |

Build these before any view. Every view below is composition of this table plus layout, not new
one-off markup.

## 3. Screens & routes

All routes below are customer/provider-facing. Auth guard: routes under `/app/*` require a
session; `role` guard distinguishes customer vs provider views where the same user can be both.

| Route | View | Mockup section | Primary API calls |
|---|---|---|---|
| `/app` | `DashboardView.vue` | Customer journey → Dashboard | `GET /api/requests?mine=true`, `GET /api/orders?mine=true` |
| `/app/requests/new` | `CreateRequestView.vue` | Customer journey → Create request | `POST /api/requests`, `PATCH /api/requests/{id}`, `POST /api/requests/{id}/submit` |
| `/app/requests/:id` | `RequestDetailView.vue` | Customer journey → Request detail with offers | `GET /api/requests/{id}`, `GET /api/requests/{id}/offers`, `POST /api/offers/{id}/accept` |
| `/app/orders/:id/pay` | `CheckoutView.vue` | Customer journey → Checkout | `POST /api/orders/{id}/pay` |
| `/app/orders/:id` | `OrderStatusView.vue` | Customer journey → Order status | `GET /api/orders/{id}`, `POST /api/orders/{id}/accept`, `POST /api/orders/{id}/request-correction`, `POST /api/orders/{id}/dispute`, `GET /api/attachments/{id}/download` |
| `/app/orders/:id/review` | `ReviewView.vue` | Customer journey → Review | `POST /api/orders/{id}/review` |
| `/app/browse` | `BrowseView.vue` | Provider journey → Browse | `GET /api/requests?status=published` |
| `/app/requests/:id/offer` | `SubmitOfferView.vue` | Provider journey → Submit offer | `POST /api/requests/{id}/offers` |
| `/app/offers` | `MyOffersView.vue` | Provider journey → My offers | `GET /api/providers/me/offers` |
| `/app/earnings` | `EarningsView.vue` | Provider journey → Earnings | `GET /api/orders?mine=true&role=provider`, payout status per order |

Not in the mockup, needed for a working app, build plainly (no bespoke design pass needed —
standard forms using the same tokens): `/login`, `/register`, `/app/providers/onboarding`,
`/app/settings`.

## 4. Status & state machines (frontend-relevant)

Mirror these enums exactly — they're the backend's source of truth (technical spec §4). Don't
invent additional frontend-only statuses.

```ts
// src/types/entities.ts
export type RequestStatus =
  | 'draft' | 'pending_moderation' | 'published'
  | 'closed_fulfilled' | 'closed_no_offer' | 'cancelled';

export type OfferStatus = 'submitted' | 'accepted' | 'rejected' | 'withdrawn';

export type OrderStatus =
  | 'awaiting_payment' | 'funded' | 'delivered' | 'under_review'
  | 'completed' | 'disputed' | 'refunded' | 'partially_resolved' | 'cancelled';

export type PayoutStatus = 'pending' | 'initiated' | 'paid' | 'failed' | 'cancelled';
```

`StatusPill` tone mapping (extend, don't fork, this table when new statuses appear):

| Status | Tone |
|---|---|
| `published`, `pending_moderation`, `submitted`, `pending` | `brass` |
| `accepted`, `completed`, `paid`, `funded`, `delivered` | `green` |
| `rejected`, `disputed`, `failed`, `cancelled` | `red` |
| `withdrawn`, `closed_no_offer` | `slate` |

`OrderStepper` step index derives from `OrderStatus`: `funded` → step 0 done, `delivered` → step 1
done, `under_review` → step 2 current, `completed` → step 3 done. `disputed` / `refunded` /
`partially_resolved` render as a stepper interrupt state (current step turns red, label changes to
"Disputed") rather than a fifth step — don't add a step for it.

## 5. Core types

```ts
export interface User {
  id: string; email: string; isProvider: boolean; isAdmin: boolean;
  country: string; preferredLanguage: string;
}

export interface ProviderProfile {
  id: string; userId: string; bio: string; categories: string[];
  kycStatus: 'not_started' | 'pending' | 'verified' | 'rejected';
  ratingAvg: number; ratingCount: number;
}

export interface RequestT {
  id: string; title: string; description: string; categoryId: string;
  budgetMin: number; budgetMax: number; currency: string;
  deadline: string | null; status: RequestStatus;
}

export interface Offer {
  id: string; requestId: string; providerId: string;
  price: number; currency: string; deliveryDays: number;
  message: string; status: OfferStatus;
}

export interface OrderT {
  id: string; offerId: string; requestId: string;
  customerId: string; providerId: string;
  price: number; commissionAmount: number; totalCharged: number; currency: string;
  status: OrderStatus;
  fundedAt: string | null; deliveredAt: string | null;
  reviewDeadlineAt: string | null; completedAt: string | null;
}

export interface Attachment {
  id: string; orderId: string; originalFilename: string;
  mimeType: string; sizeBytes: number;
  avScanStatus: 'pending' | 'clean' | 'infected';
}
```

(`RequestT` / `OrderT` named to avoid colliding with the DOM's global `Request`.)

## 6. API client

Base URL from `VITE_API_BASE_URL` env var. Bearer JWT in an Authorization header, token held in
Pinia (`stores/auth.ts`), refreshed via `POST /api/auth/refresh` on 401. One `api/client.ts` wrapping
`fetch`, one file per resource (`api/requests.ts`, `api/offers.ts`, `api/orders.ts`, …) exporting
typed functions, consumed through `@tanstack/vue-query` composables — don't call `fetch` directly
from components.

Full endpoint list is in the technical spec §2; the table in §3 above already covers everything
needed for the ten built screens.

## 7. Folder structure

```
src/
  main.ts
  App.vue
  router/index.ts
  stores/
    auth.ts
    requests.ts
    offers.ts
    orders.ts
  api/
    client.ts
    requests.ts
    offers.ts
    orders.ts
    providers.ts
  types/
    entities.ts
  components/
    ui/          Button.vue Badge.vue StatusPill.vue StatRow.vue MiniRow.vue
    marketplace/  OfferLedgerRow.vue RequestRow.vue CategoryPicker.vue
                  OrderStepper.vue StarRating.vue FileCard.vue
    form/         Field.vue
  views/
    DashboardView.vue        CreateRequestView.vue     RequestDetailView.vue
    CheckoutView.vue         OrderStatusView.vue        ReviewView.vue
    BrowseView.vue           SubmitOfferView.vue        MyOffersView.vue
    EarningsView.vue
  assets/styles/tokens.css
```

## 8. Build order

1. Scaffold (Vite + TS + Tailwind + shadcn-vue init) + drop in `tokens.css` + Tailwind color
   mapping. Verify against `sabil_design_v1.html` side by side before building anything else.
2. Component inventory (§2), each with a throwaway local story/demo route to eyeball against the
   mockup — don't build views until these match pixel-for-pixel on spacing, border weight, color.
3. Customer journey views, in this order: Browse is provider-only so skip; do Dashboard →
   CreateRequest → RequestDetail → Checkout → OrderStatus → Review.
4. Provider journey views: Browse → SubmitOffer → MyOffers → Earnings.
5. Auth + onboarding + settings (plain forms, same tokens, no bespoke design pass).

## 9. Definition of done for v1

- All 10 mockup screens implemented as real routes, wired to live API calls (or a mock server if
  backend isn't ready yet — don't hardcode data in components).
- No screen introduces a color, font, radius, or shadow outside `tokens.css`.
- `StatusPill` and `OrderStepper` are driven purely by the enums in §4, not ad-hoc strings.
- Every shared component in §2 exists once, is imported everywhere it's used in the mockup, and
  isn't reimplemented inline in a view.
- Responsive down to 375px width without horizontal scroll on any of the 10 screens.
