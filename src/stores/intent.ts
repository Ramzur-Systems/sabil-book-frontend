/**
 * Just-in-time auth.
 *
 * A guest composes freely — the whole request wizard, a full offer draft — and
 * only meets sign-in at the commit point. This store carries what they were
 * doing across the sign-in round trip so nothing is retyped: the guest-cart
 * behaviour, applied to composing rather than buying.
 *
 * The draft is held in sessionStorage (not localStorage): it is in-flight work
 * for this tab, not a saved document, and it should not outlive the browser
 * session on a shared machine.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

export type IntentKind = 'create-request' | 'submit-offer'

export interface PendingIntent {
  kind: IntentKind
  /** Where to send them back to, e.g. /requests/req-1/offer. */
  returnTo: string
  /** The in-progress form values, shaped by whichever view wrote it. */
  draft: Record<string, unknown>
  /** Set once sign-in completes, so the view knows to submit rather than just restore. */
  submitOnReturn: boolean
  savedAt: number
}

const KEY = 'sabil.intent'
/** A draft older than this is stale enough that silently submitting it would surprise. */
const MAX_AGE_MS = 2 * 60 * 60 * 1000

function read(): PendingIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingIntent
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function write(value: PendingIntent | null) {
  try {
    if (value === null) sessionStorage.removeItem(KEY)
    else sessionStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    /* storage blocked — the draft simply won't survive the round trip */
  }
}

export const useIntentStore = defineStore('intent', () => {
  const pending = ref<PendingIntent | null>(read())

  /** Called from a compose view when a guest hits the commit action. */
  function remember(kind: IntentKind, returnTo: string, draft: Record<string, unknown>) {
    const intent: PendingIntent = {
      kind,
      returnTo,
      draft,
      submitOnReturn: true,
      savedAt: Date.now(),
    }
    pending.value = intent
    write(intent)
  }

  /** Non-destructive peek, used to restore form values on mount. */
  function peek(kind: IntentKind, returnTo: string): PendingIntent | null {
    const current = pending.value
    if (!current || current.kind !== kind) return null
    if (current.returnTo !== returnTo) return null
    return current
  }

  /** Read once and drop it, so a draft can never be submitted twice. */
  function consume(kind: IntentKind, returnTo: string): PendingIntent | null {
    const found = peek(kind, returnTo)
    if (found) clear()
    return found
  }

  function clear() {
    pending.value = null
    write(null)
  }

  return { pending, remember, peek, consume, clear }
})
