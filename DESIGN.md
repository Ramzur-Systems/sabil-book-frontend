# Design

Visual system for Sabil Books. Canonical reference: `sabil_design_v1.html`. This document
describes that reference; where they disagree, the HTML wins and this file gets corrected.

## Theme

**Light, warm, printed.** A parchment ground with warm hairlines and a deep marine accent — an
accounting ledger or a legal instrument rather than an app. Chosen deliberately over dark mode:
the user is at a desk in an office, mid-workday, under overhead light, spending company budget on
a document they will have to defend. The interface should look like a record of that, not like a
tool. No dark theme in v1.

Colour strategy: **restrained.** Tinted warm neutrals carry the surface; marine appears only on
the single actionable element per region; brass, green and red are status-only.

## Color Palette

All values are hex verbatim from `sabil_design_v1.html`, defined as CSS custom properties in
`src/assets/styles/tokens.css` and mirrored into `tailwind.config.ts` under `theme.extend.colors`.
No colour outside this table may appear in product UI.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#12233D` | Primary text; dark surfaces (topbar) |
| `--marine` | `#1B3A5C` | Primary accent — buttons, links, active/selected states |
| `--marine-dark` | `#0F2A45` | Hover state for marine |
| `--parchment` | `#F7F4EC` | Page background |
| `--paper` | `#FFFEFB` | Card / row background |
| `--paper-tint` | `#FBFAF5` | Selected-row background (was inline in the mockup) |
| `--brass` | `#9C7A3C` | Ratings, category badges, verified/expert cues |
| `--brass-bg` | `#F1E6D1` | Badge / avatar background |
| `--slate` | `#5B6472` | Secondary text, labels, meta |
| `--slate-bg` | `#E9E7DE` | Neutral status pill |
| `--line` | `#DDD6C7` | Structural hairlines — warm-toned, never cold gray. Not for control borders. |
| `--line-control` | `#8F8368` | Input / select / textarea boundaries (needs 3:1 per 1.4.11) |
| `--green` | `#2F6B4F` | Success status, completed stepper dots |
| `--green-bg` | `#E3EEE7` | Success pill background |
| `--red` | `#A23B32` | Danger / dispute status, destructive text button |
| `--red-bg` | `#F5E4E1` | Danger pill background |
| `--topnav` | `#C9CFD8` | Inactive nav links on the ink topbar |

Contrast — measured, not estimated. `npm run contrast` recomputes every pair below from
`tokens.css` and exits non-zero on any AA failure; run it after touching the palette.

| Pair | Ratio | Floor | Note |
|---|---|---|---|
| `--slate` on `--parchment` | 5.44:1 | 4.5 | Secondary text. Do not lighten. |
| `--slate` on `--paper` | 5.93:1 | 4.5 | Meta, pitch text |
| `--brass-text` on `--brass-bg` | 4.91:1 | 4.5 | **All** brass text: pills, badges, ratings |
| `--brass-text` on `--paper` | 6.02:1 | 4.5 | Provider rating |
| `--marine` on `--paper` | 11.53:1 | 4.5 | Links, secondary buttons |
| `--ink` on `--parchment` | 14.33:1 | 4.5 | Body |
| `--line-control` on `--paper` | 3.71:1 | 3.0 | Input boundary (WCAG 1.4.11) |

**`--brass` (#9C7A3C) is a display colour only — never set text in it.** It measures 3.23:1 on
`--brass-bg`, and the 3:1 large-text allowance starts at 24px regular / 18.66px bold, so a 12–13px
pill needs the full 4.5:1. An earlier version of this document claimed brass text was acceptable
"at badge size with weight 500+"; that rule was wrong and every brass glyph now uses
`--brass-text` (#7A5E28) instead.

**`--line` is a structural hairline only.** At 1.43:1 on `--paper` it cannot be the sole boundary
of a form control; inputs, selects and textareas use `--line-control`.

## Typography

Two families, paired on a real contrast axis (transitional serif + neo-grotesque sans), loaded
from Google Fonts with `display=swap`.

- **Source Serif 4** — `serif`. Used *only* for human writing and screen titles: request titles,
  offer pitches (italic 400), the `Sabil Books` wordmark, `h2.screen-title`. Never for nav,
  buttons, prices, statuses or form fields.
- **IBM Plex Sans** — everything else. Weights 400 / 500 / 600.

Scale (px, from the mockup):

| Role | Size / weight / family |
|---|---|
| Wordmark | 22 / 600 / serif |
| Request title (h1) | 30 / 500 / serif, line-height 1.3, max-width 640px |
| Screen title (h2) | 22 / 500 / serif |
| Order title (h1 variant) | 24 / 500 / serif |
| Request row title | 18 / 500 / serif |
| Section subhead | 16 / 600 / sans |
| Price | 20 / 600 / sans, `font-variant-numeric: tabular-nums` |
| Stat value | 18 / 500 / sans |
| Provider name | 15 / 600 / sans |
| Body / input | 15 / 400 / sans |
| Mini-row title, file name | 15 / 500 / sans |
| Button, nav, download link | 14 / 500 / sans |
| Pitch | 14 / 400 italic / serif, line-height 1.5, max-width 520px |
| Meta, label, rating, badge | 13 / 400 / sans |
| Stat label, status pill, file meta | 12 / 400–500 / sans |

Prose caps at 65–75ch; pitch and description blocks carry explicit max-widths. `text-wrap: balance`
on request and screen titles.

## Layout

- Content column: `max-width: 960px`, centred, `padding: 0 32px`. Below 640px the gutter drops to
  20px and to 16px below 400px; no horizontal scroll at 375px.
- Topbar: full-bleed `--ink`, 20px vertical padding, wordmark left / nav right, baseline-aligned.
- **Ledger rows, not cards.** `background: --paper`, `1px solid --line`, `border-left: 3px solid
  --line`. Selected: left bar becomes `--marine`, background `--paper-tint`. The 3px left bar is
  the *only* sanctioned heavy side border in this system — it is a structural selection affordance,
  not decoration, and must not be repeated as a coloured accent stripe elsewhere.
- **StatRow** is hairline-divided, not a card grid: `border-top`/`border-bottom` on the strip,
  `border-right` between stats, no background. Below 640px it stacks to two columns and drops the
  vertical rules.
- **MiniRow** is a flat list row: `padding: 16px 0`, `border-bottom: 1px solid --line`, last child
  borderless. Trailing status/action collapses under the title below 480px.
- Radius: **4px on interactive controls only** — buttons, inputs, badges, status pills. Structural
  rows, cards, stat strips and file cards stay square (0).
- **No `box-shadow` anywhere.** Depth is expressed by border weight and background tint.
- Vertical rhythm: 12px between sibling rows, 20–24px within a row, 32px between a subhead and its
  content, 48–56px between major sections.
- z-index scale (semantic, no magic numbers): `--z-dropdown: 10`, `--z-sticky: 20`,
  `--z-backdrop: 30`, `--z-modal: 40`, `--z-toast: 50`, `--z-tooltip: 60`.

## Components

Shared layer under `src/components/`; see `FRONTEND_SPEC.md` §2 for the reuse contract.

- **Button** — `primary` (filled marine, white text, hover `--marine-dark`), `secondary` (1px
  marine outline on transparent, hover `--paper-tint`), `text` (borderless underlined `--red`,
  13px — destructive/last-resort only). All 4px radius, 9px/18px padding, 14px/500. Visible marine
  focus ring; `disabled` drops to 45% opacity with `cursor: not-allowed`.
- **Badge** — category pill, `--brass` on `--brass-bg`, 13px, 4px radius.
- **StatusPill** — 12px/500, 4px radius, four tones (`brass` / `green` / `red` / `slate`) mapped
  from the backend enum in spec §4. Label always rendered as text.
- **StatRow / MiniRow / OfferLedgerRow / RequestRow / CategoryPicker / OrderStepper / StarRating /
  FileCard / Field** — as specified in §2, styled exactly per the mockup.
- **Avatar** — 40px circle, `--brass-bg` ground, `--brass` initials, 14px/600.
- **OrderStepper** — 4 steps, 2px connector rules, 12px dots. `done` = green fill, `current` =
  marine fill + ink bold label, future = `--line` outline on `--paper`. Interrupt state
  (`disputed` / `refunded` / `partially_resolved`) turns the current dot and label red with the
  label "Disputed"; no fifth step is ever added.

## Motion

Motion is functional and quiet — this is a money surface, not a showcase.

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart). No bounce, no elastic.
- Durations: 120ms for hover/focus tints, 180ms for selection and pill changes, 240ms for the
  stepper advancing.
- Sanctioned motion: button and row hover tint, selection left-bar and background crossfade,
  stepper dot/line fill on status change, a single staggered fade-up (60ms step, ≤6 items) on
  first paint of an offer list — the one place motion earns its keep, because it stages a
  comparison the user is about to make.
- Content is visible by default; reveals animate an already-rendered element and never gate
  visibility on a JS class, so headless renders and background tabs are never blank.
- `@media (prefers-reduced-motion: reduce)` collapses every transition to a 1ms crossfade and
  removes the stagger entirely.
