import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyFormatters = new Map<string, Intl.NumberFormat>()

function formatterFor(currency: string) {
  let fmt = currencyFormatters.get(currency)
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    })
    currencyFormatters.set(currency, fmt)
  }
  return fmt
}

export function formatMoney(amount: number, currency = 'USD'): string {
  return formatterFor(currency).format(amount)
}

export function formatBudget(min: number, max: number, currency = 'USD'): string {
  if (min === max) return formatMoney(min, currency)
  return `${formatMoney(min, currency)}–${formatMoney(max, currency).replace(/^[^\d]+/, '')}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "6 hours ago", "2 days ago" — past only. */
export function timeAgo(iso: string, now = Date.now()): string {
  const delta = now - new Date(iso).getTime()
  if (delta < MINUTE) return 'just now'
  if (delta < HOUR) return plural(Math.floor(delta / MINUTE), 'minute') + ' ago'
  if (delta < DAY) return plural(Math.floor(delta / HOUR), 'hour') + ' ago'
  return plural(Math.floor(delta / DAY), 'day') + ' ago'
}

/** "4 days left", "Due today", "Overdue" — deadline-facing. */
export function timeLeft(iso: string | null, now = Date.now()): string {
  if (!iso) return 'No deadline'
  const delta = new Date(iso).getTime() - now
  if (delta < 0) return 'Overdue'
  const days = Math.floor(delta / DAY)
  if (days === 0) return 'Due today'
  return plural(days, 'day') + ' left'
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}
