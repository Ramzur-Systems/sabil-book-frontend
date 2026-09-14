# Product

## Register

product

## Users

Two roles on one account model (`user.isProvider` gates the provider half).

**Customers** — operators inside small-to-mid companies in Kazakhstan and the wider CIS:
procurement leads, ops managers, L&D coordinators. They arrive with a concrete, unglamorous
document need ("comparison of the top 5 data-observability vendors", "vendor onboarding SOP for a
40-person team", "PMP practice set"). They are at a desk, mid-workday, spending company money and
answerable for it. The job: post the need, compare a handful of real human bids, pick one, pay into
escrow, accept or reject the delivery.

**Providers** — subject-matter experts selling written work: analysts, former in-house
practitioners, certified trainers. They scan a feed of open requests, bid with a price, a delivery
window and a short pitch that has to earn trust in three sentences, then deliver a file and wait
on payout.

Both sides use this for money-bearing work with a deadline attached. Nobody is browsing for fun.

## Product Purpose

Sabil Books is a **reverse marketplace for expert-written material**. The customer posts a
request; providers bid; the customer compares offers side by side and accepts one. Money is held
in escrow from funding through a review window, and released on acceptance.

The core mechanic — and the screen the whole product is judged on — is **offer comparison** on the
request-detail view. Three to five human beings each argue, in their own voice, why they should
get the job. Everything else in the product exists to get a user to that comparison and then
safely through the transaction after it.

Success: a customer can go request → offers → accept → pay → receive → accept delivery → review
without ever wondering what state their money is in.

## Brand Personality

**Ledger, not feed.** Three words: *considered, accountable, plain-spoken.*

The visual system is a printed record — hairline rules, square structural edges, warm parchment
stock, a marine accent that marks the one thing you can act on. It reads like something an
accountant would sign, because the user is spending someone else's budget and needs the interface
to look like it takes that seriously.

The one place warmth and voice are allowed to break through is the provider's own writing: pitches
and request titles are set in Source Serif 4, because that copy is a person talking, not UI chrome.

Copy is direct and unhedged. "Confirm delivery", not "Looks good!". No exclamation marks, no
encouragement, no emoji.

## Anti-references

- **Fiverr / Upwork gig-card grids.** Bright badges, seller-rank gamification, "Level 2 Seller"
  ornament, endless identical thumbnail cards. Offers here are compared as rows in a ledger, not
  shopped as cards.
- **Generic SaaS dashboard.** Purple-to-blue gradients, glassmorphism, rounded-2xl cards floating
  on soft shadows, hero-metric tiles. Explicitly banned: no `box-shadow` anywhere in product UI.
- **Consumer fintech playfulness.** Confetti on completion, mascot illustrations, celebratory
  micro-copy. Money moving is not a delight moment here.
- **Cold enterprise gray.** Slate-on-white admin panels with cold `#E5E7EB` borders. Sabil's
  hairlines are warm (`--line: #DDD6C7`); the neutral is parchment, not gray.

## Design Principles

1. **The ledger row is the unit.** Bordered rows with a 3px left accent bar carry the structure —
   not rounded cards with shadows. Selection is a marine left-bar and a faint tint, nothing else.
2. **Serif is reserved for human writing.** Request titles, offer pitches, screen titles. Never for
   nav, buttons, prices, statuses or fields. The pairing is a semantic signal, not decoration.
3. **State is never ambiguous.** Every order shows exactly where the money is (`OrderStepper`) and
   every status renders from the backend enum through one `StatusPill`, never an ad-hoc string.
4. **Destructive actions look destructive, and only that.** The red underlined text button exists
   for "Open a dispute" and its kin. It is never used for a neutral secondary action.
5. **No new visual vocabulary in views.** A view is composition of the shared component inventory
   plus layout. A colour, font, radius or shadow outside `tokens.css` is a bug.

## Accessibility & Inclusion

- WCAG 2.1 AA target. Body text ≥4.5:1, large text ≥3:1. `--slate` (#5B6472) on `--parchment`
  (#F7F4EC) measures ~5.6:1 and is the floor for secondary text; it must not be lightened.
  `--brass` (#9C7A3C) on `--brass-bg` (#F1E6D1) is ~3.3:1, so brass text is permitted only at
  badge/pill size with weight 500+ and never for body copy.
- Status is never colour-only: every `StatusPill` carries its label as text, and the
  `OrderStepper` marks the current step with weight and label change as well as colour.
- Full keyboard operability: offer accept, category and payment-method selection are real radio
  semantics, not clickable divs. Visible focus rings everywhere (marine outline, never `outline: none`).
- `prefers-reduced-motion: reduce` honoured on every transition.
- Responsive to 375px with no horizontal scroll on any screen.
