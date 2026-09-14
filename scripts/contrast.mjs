/**
 * WCAG contrast guard over the real token values.
 *
 * Parses src/assets/styles/tokens.css and scores every foreground/background
 * pair the product actually renders, at the size and weight it renders them.
 * Exits non-zero on any AA failure, so a palette change can't quietly drop a
 * pair below the line. Run: npm run contrast
 */
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/assets/styles/tokens.css', import.meta.url), 'utf8')

function token(name) {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`token --${name} not found or not a plain hex`)
  return m[1]
}

const channel = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => channel(v / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(fg, bg) {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

/** WCAG "large text" is >=24px regular or >=18.66px bold. Everything else needs 4.5. */
const floorFor = (px, weight) => (px >= 24 || (px >= 18.66 && weight >= 700) ? 3 : 4.5)

const pairs = [
  ['body text', 'ink', 'parchment', 15, 400],
  ['secondary text', 'slate', 'parchment', 15, 400],
  ['meta on card', 'slate', 'paper', 13, 400],
  ['meta on selected row', 'slate', 'paper-tint', 13, 400],
  ['StatusPill slate', 'slate', 'slate-bg', 12, 500],
  ['StatusPill brass', 'brass-text', 'brass-bg', 12, 500],
  ['Badge brass', 'brass-text', 'brass-bg', 13, 500],
  ['provider rating', 'brass-text', 'paper', 13, 400],
  ['brass on page', 'brass-text', 'parchment', 13, 400],
  ['StatusPill green', 'green', 'green-bg', 12, 500],
  ['StatusPill red', 'red', 'red-bg', 12, 500],
  ['destructive button', 'red', 'paper', 13, 500],
  ['field error', 'red', 'parchment', 12, 500],
  ['error body', 'red-ink', 'red-bg', 14, 400],
  ['link / marine', 'marine', 'paper', 14, 500],
  ['focus ring on page', 'marine', 'parchment', 14, 400],
  ['nav link', 'topnav', 'ink', 14, 400],
  ['nav active', 'on-dark', 'ink', 14, 500],
  ['primary button label', 'on-dark', 'marine', 14, 500],
]

/** Non-text contrast (WCAG 1.4.11) — control boundaries need 3:1. */
const nonText = [['input border', 'line-control', 'paper']]

let failed = 0
console.log('pair                       fg        bg         ratio   need  verdict')
for (const [label, fg, bg, px, weight] of pairs) {
  const r = ratio(token(fg), token(bg))
  const need = floorFor(px, weight)
  const pass = r >= need
  if (!pass) failed++
  console.log(
    `${label.padEnd(26)} ${token(fg)}   ${token(bg)}   ${r.toFixed(2).padStart(5)}   ${need}   ${pass ? 'pass' : 'FAIL'}`,
  )
}
for (const [label, fg, bg] of nonText) {
  const r = ratio(token(fg), token(bg))
  const pass = r >= 3
  if (!pass) failed++
  console.log(
    `${label.padEnd(26)} ${token(fg)}   ${token(bg)}   ${r.toFixed(2).padStart(5)}   3.0   ${pass ? 'pass' : 'FAIL'} (1.4.11)`,
  )
}

console.log(failed ? `\n${failed} CONTRAST FAILURE(S)` : '\nAll pairs meet WCAG AA')
process.exit(failed ? 1 : 0)
