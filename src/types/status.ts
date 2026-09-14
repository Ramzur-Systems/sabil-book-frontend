import type { KycStatus, OfferStatus, OrderStatus, PayoutStatus, RequestStatus } from './entities'

export type StatusTone = 'brass' | 'green' | 'red' | 'slate'

export type AnyStatus = RequestStatus | OfferStatus | OrderStatus | PayoutStatus | KycStatus

/**
 * Single source of truth for status → tone (spec §4). Extend this map when the
 * backend adds a status; never fork it or pass an ad-hoc tone at a call site.
 */
const TONE_BY_STATUS: Record<AnyStatus, StatusTone> = {
  // brass — in flight, waiting on someone
  published: 'brass',
  pending_moderation: 'brass',
  submitted: 'brass',
  pending: 'brass',
  awaiting_payment: 'brass',
  under_review: 'brass',
  initiated: 'brass',
  draft: 'brass',

  // KYC
  not_started: 'slate',
  verified: 'green',

  // green — money or work has moved forward successfully
  accepted: 'green',
  completed: 'green',
  paid: 'green',
  funded: 'green',
  delivered: 'green',
  closed_fulfilled: 'green',

  // red — something went wrong
  rejected: 'red',
  disputed: 'red',
  failed: 'red',
  cancelled: 'red',
  refunded: 'red',
  partially_resolved: 'red',

  // slate — inert, no longer actionable
  withdrawn: 'slate',
  closed_no_offer: 'slate',
}

const LABEL_BY_STATUS: Partial<Record<AnyStatus, string>> = {
  pending_moderation: 'In moderation',
  awaiting_payment: 'Awaiting payment',
  under_review: 'Under review',
  closed_fulfilled: 'Fulfilled',
  closed_no_offer: 'No offers',
  partially_resolved: 'Partially resolved',
  not_started: 'Not started',
}

export function toneFor(status: AnyStatus): StatusTone {
  return TONE_BY_STATUS[status] ?? 'slate'
}

export function labelFor(status: AnyStatus): string {
  const explicit = LABEL_BY_STATUS[status]
  if (explicit) return explicit
  const words = status.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Order statuses that interrupt the stepper rather than advancing it. */
export const INTERRUPT_ORDER_STATUSES = [
  'disputed',
  'refunded',
  'partially_resolved',
] as const satisfies readonly OrderStatus[]

export function isInterruptStatus(status: OrderStatus): boolean {
  return (INTERRUPT_ORDER_STATUSES as readonly string[]).includes(status)
}
