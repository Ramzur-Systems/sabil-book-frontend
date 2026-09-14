<script setup lang="ts">
/**
 * Provider journey → Submit offer. One request, one bid: price, delivery
 * window and the pitch that has to earn the job in a few sentences.
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { z } from 'zod'

import Field from '@/components/form/Field.vue'
import FieldRow from '@/components/form/FieldRow.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'

import { getRequest } from '@/api/requests'
import { createOffer } from '@/api/offers'
import type { OfferDraft } from '@/api/offers'
import { queryKeys } from '@/api/queryKeys'
import { formatBudget } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useIntentStore } from '@/stores/intent'
import { useUiStore } from '@/stores/ui'
import type { RequestStatus } from '@/types/entities'

const props = defineProps<{ id: string }>()

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const auth = useAuthStore()
const intent = useIntentStore()
const ui = useUiStore()

/** The intent is scoped by where it was written, which is this exact address. */
const returnTo = route.fullPath

const MESSAGE_MIN = 40
const MESSAGE_MAX = 2000

const requestQuery = useQuery({
  queryKey: computed(() => queryKeys.request(props.id)),
  queryFn: () => getRequest(props.id),
})

const request = computed(() => requestQuery.data.value)
const isOpen = computed(() => request.value?.status === 'published')
/** Owner-side reachability: the URL is public, so the block lives here. */
const isOwnRequest = computed(() => request.value?.isMine === true)
/** The only condition under which the form may be shown or an offer sent. */
const canBid = computed(() => isOpen.value && !isOwnRequest.value)

const CLOSED_REASON: Record<RequestStatus, string> = {
  draft: 'The customer has not published it yet.',
  pending_moderation: 'It is still in moderation. Published requests appear in the feed.',
  published: '',
  closed_fulfilled: 'The customer has already accepted an offer.',
  closed_no_offer: 'It closed without an accepted offer.',
  cancelled: 'The customer cancelled it.',
}

/** Why this request can't be bid on right now, in its own terms. */
const blockedState = computed(() => {
  const current = request.value
  if (!current || canBid.value) return null
  if (current.isMine) {
    return {
      title: 'This is your own request',
      body: "This is your own request. You can't bid on it.",
      own: true,
    }
  }
  return {
    title: 'This request is not taking offers',
    body: CLOSED_REASON[current.status],
    own: false,
  }
})

const budgetLabel = computed(() =>
  request.value
    ? formatBudget(request.value.budgetMin, request.value.budgetMax, request.value.currency)
    : '',
)

interface OfferDraftValues extends Record<string, unknown> {
  price: string
  deliveryDays: string
  message: string
}

/**
 * `v-model` on `<input type="number">` hands back a number, not a string, as
 * soon as the field parses — so these hold either, and every reader coerces.
 */
const priceInput = ref<string | number>('')
const deliveryInput = ref<string | number>('')
const message = ref('')
/** Fields the user has left. A field shows its error once blurred or once submitted. */
const touched = ref(new Set<string>())
/** Flipped by the first failed submit; from then on every error is surfaced. */
const submitAttempted = ref(false)
/** A restored draft waiting for the request to load before it submits itself. */
const armed = ref(false)

const FIELD_IDS = {
  price: 'offer-price',
  deliveryDays: 'offer-delivery',
  message: 'offer-message',
} as const

type FieldName = keyof typeof FIELD_IDS

const FIELD_ORDER: readonly FieldName[] = ['price', 'deliveryDays', 'message']

function touch(field: FieldName) {
  touched.value.add(field)
}

function toNumber(value: string | number): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

const schema = z.object({
  price: z
    .number({ required_error: 'Enter your price.', invalid_type_error: 'Enter your price.' })
    .int('Price must be a whole number.')
    .positive('Price must be more than zero.'),
  deliveryDays: z
    .number({
      required_error: 'Enter a delivery time.',
      invalid_type_error: 'Enter a delivery time.',
    })
    .int('Delivery time must be a whole number of days.')
    .min(1, 'Delivery time must be at least 1 day.')
    .max(60, 'Delivery time cannot exceed 60 days.'),
  message: z
    .string()
    .trim()
    .min(MESSAGE_MIN, `Write at least ${MESSAGE_MIN} characters.`)
    .max(MESSAGE_MAX, `Keep the message under ${MESSAGE_MAX} characters.`),
})

const parsed = computed(() =>
  schema.safeParse({
    price: toNumber(priceInput.value),
    deliveryDays: toNumber(deliveryInput.value),
    message: message.value,
  }),
)

/** Every rule that currently fails, regardless of whether it is shown yet. */
const allErrors = computed<Record<string, string>>(() => {
  const result = parsed.value
  if (result.success) return {}
  const out: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !(key in out)) out[key] = issue.message
  }
  return out
})

const errors = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  for (const field of FIELD_ORDER) {
    const text = allErrors.value[field]
    if (text && (submitAttempted.value || touched.value.has(field))) out[field] = text
  }
  return out
})

/**
 * The error summary is a snapshot of the last failed submit, not a live view:
 * it must not re-announce itself on every keystroke while the user fixes it.
 */
const summary = ref<{ id: string; message: string }[]>([])
const summaryEl = ref<HTMLElement | null>(null)

/** Shown after a failed submit; focus moves here so the failure is announced. */
async function reportFailure() {
  submitAttempted.value = true
  summary.value = FIELD_ORDER.filter((field) => allErrors.value[field]).map((field) => ({
    id: FIELD_IDS[field],
    message: allErrors.value[field],
  }))
  await nextTick()
  if (summaryEl.value) {
    summaryEl.value.focus()
    return
  }
  const first = summary.value[0]
  if (first) document.getElementById(first.id)?.focus()
}

const submitLabel = computed(() => (auth.isAuthenticated ? 'Submit offer' : 'Sign in to submit'))

const messageLength = computed(() => message.value.trim().length)

const counterLabel = computed(
  () => `${messageLength.value} of ${MESSAGE_MAX} characters · ${MESSAGE_MIN} minimum`,
)

const outsideBudget = computed(() => {
  const price = toNumber(priceInput.value)
  const current = request.value
  if (price === undefined || !current) return false
  return price < current.budgetMin || price > current.budgetMax
})

const offerMutation = useMutation({
  mutationFn: (body: OfferDraft) => createOffer(props.id, body),
  onSuccess: async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.myOffers }),
      queryClient.invalidateQueries({ queryKey: queryKeys.requests() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.request(props.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.requestOffers(props.id) }),
    ])
    ui.notify('Your offer was submitted.', 'success')
    void router.push({ name: 'my-offers' })
  },
  onError: (error: unknown) => {
    ui.notify(
      error instanceof Error ? error.message : 'Your offer could not be submitted.',
      'danger',
    )
  },
})

/** What the form holds right now, in the shape the draft is stored in. */
function currentValues(): OfferDraftValues {
  return {
    price: String(priceInput.value),
    deliveryDays: String(deliveryInput.value),
    message: message.value,
  }
}

function applyDraft(draft: Record<string, unknown>) {
  if (typeof draft.price === 'string') priceInput.value = draft.price
  if (typeof draft.deliveryDays === 'string') deliveryInput.value = draft.deliveryDays
  if (typeof draft.message === 'string') message.value = draft.message
}

function send() {
  const result = parsed.value
  if (!result.success) {
    void reportFailure()
    return
  }
  summary.value = []
  offerMutation.mutate({
    price: result.data.price,
    deliveryDays: result.data.deliveryDays,
    message: result.data.message,
    currency: request.value?.currency,
  })
}

/**
 * A provider profile is what an offer is submitted from. The route no longer
 * guards this page, so the redirect lives here — and the draft is deliberately
 * left in the store, so finishing onboarding returns to a filled form.
 */
function sendToOnboarding() {
  ui.notify('Set up your provider profile to submit offers. Your draft is kept.')
  void router.push({ name: 'provider-onboarding' })
}

function onSubmit() {
  const result = parsed.value
  if (!result.success) {
    void reportFailure()
    return
  }
  summary.value = []

  // The commit point, and the only place sign-in is asked for.
  if (!auth.isAuthenticated) {
    intent.remember('submit-offer', returnTo, currentValues())
    void router.push({ name: 'login', query: { next: returnTo } })
    return
  }

  if (!auth.isProvider) {
    intent.remember('submit-offer', returnTo, currentValues())
    sendToOnboarding()
    return
  }

  send()
}

/**
 * Runs during setup, before the watcher below: a draft restored from the
 * sign-in round trip must be armed before the request query can settle.
 */
function restoreDraft() {
  const saved = intent.peek('submit-offer', returnTo)
  if (!saved) return
  applyDraft(saved.draft)

  if (!saved.submitOnReturn || !auth.isAuthenticated) return

  if (!auth.isProvider) {
    onMounted(sendToOnboarding)
    return
  }

  armed.value = true
}

restoreDraft()

/**
 * The auto-submit waits for the request to load: bidding on a request that
 * closed while they were signing in should explain itself, not fail with a
 * conflict. `consume` drops the draft as it reads it, so the round trip can
 * never submit the same offer twice.
 */
watch(
  () => (requestQuery.isSuccess.value ? canBid.value : null),
  (open) => {
    if (!armed.value || open === null) return
    armed.value = false
    const taken = intent.consume('submit-offer', returnTo)
    if (!taken) return
    if (!open) {
      ui.notify(
        isOwnRequest.value
          ? "This is your own request. You can't bid on it."
          : 'This request stopped taking offers while you were signing in.',
        'danger',
      )
      return
    }
    ui.notify('You are signed in. Submitting the offer you drafted.')
    send()
  },
  { immediate: true },
)
</script>

<template>
  <section>
    <SkeletonRows v-if="requestQuery.isPending.value" :count="3" :height="72" />

    <ErrorState
      v-else-if="requestQuery.isError.value"
      :error="requestQuery.error.value"
      title="This request didn't load"
      @retry="() => requestQuery.refetch()"
    />

    <EmptyState v-else-if="blockedState" :title="blockedState.title" :body="blockedState.body">
      <Button
        v-if="blockedState.own"
        variant="secondary"
        :to="{ name: 'request-detail', params: { id: props.id } }"
      >
        View the request
      </Button>
      <Button v-else variant="secondary" :to="{ name: 'browse' }">Back to open requests</Button>
    </EmptyState>

    <template v-else-if="request">
      <p class="offer-eyebrow">Responding to</p>
      <h1 class="offer-title">{{ request.title }}</h1>

      <form class="offer-form" novalidate @submit.prevent="onSubmit">
        <div
          v-if="summary.length"
          ref="summaryEl"
          class="offer-errors"
          role="alert"
          tabindex="-1"
        >
          <h2 class="offer-errors__title">Fix these before submitting</h2>
          <ul class="offer-errors__list">
            <li v-for="item in summary" :key="item.id">
              <a :href="`#${item.id}`">{{ item.message }}</a>
            </li>
          </ul>
        </div>

        <FieldRow>
          <Field
            label="Your price, $"
            required
            :for-id="FIELD_IDS.price"
            :hint="`Customer's budget ${budgetLabel}`"
            :error="errors.price"
          >
            <template #default="{ id, describedBy, invalid }">
              <input
                :id="id"
                v-model="priceInput"
                class="sb-control offer-number"
                type="number"
                inputmode="numeric"
                min="1"
                step="1"
                :aria-describedby="describedBy"
                :aria-invalid="invalid || undefined"
                @blur="touch('price')"
              />
            </template>
          </Field>
          <Field
            label="Delivery time, days"
            required
            :for-id="FIELD_IDS.deliveryDays"
            :error="errors.deliveryDays"
          >
            <template #default="{ id, describedBy, invalid }">
              <input
                :id="id"
                v-model="deliveryInput"
                class="sb-control offer-number"
                type="number"
                inputmode="numeric"
                min="1"
                max="60"
                step="1"
                :aria-describedby="describedBy"
                :aria-invalid="invalid || undefined"
                @blur="touch('deliveryDays')"
              />
            </template>
          </Field>
        </FieldRow>

        <p v-if="outsideBudget" class="offer-warning" role="status">
          Your price is outside the customer's budget of {{ budgetLabel }}. You can still submit
          it, but say why in your message.
        </p>

        <Field
          label="Message to the customer"
          required
          :for-id="FIELD_IDS.message"
          :error="errors.message"
        >
          <template #default="{ id, describedBy, invalid }">
            <textarea
              :id="id"
              v-model="message"
              class="sb-control offer-message"
              rows="6"
              :maxlength="MESSAGE_MAX"
              placeholder="Explain your approach and what makes your delivery reliable"
              :aria-describedby="describedBy"
              :aria-invalid="invalid || undefined"
              @blur="touch('message')"
            />
            <p class="offer-counter" aria-live="polite">{{ counterLabel }}</p>
          </template>
        </Field>

        <Button type="submit" :loading="offerMutation.isPending.value">{{ submitLabel }}</Button>

        <p v-if="!auth.isAuthenticated" class="offer-gate">
          Write the offer first. Sign-in is asked for when you submit, and what you typed is kept.
        </p>
      </form>
    </template>
  </section>
</template>

<style scoped>
.offer-eyebrow {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--slate);
}

.offer-title {
  max-width: 640px;
  margin: 0 0 24px;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
}

.offer-form {
  max-width: 560px;
}

.offer-errors {
  padding: 16px 20px;
  margin: 0 0 24px;
  background: var(--red-bg);
  border: 1px solid var(--red);
}

.offer-errors:focus-visible {
  outline-offset: 0;
}

.offer-errors__title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--red-ink);
}

.offer-errors__list {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
}

.offer-errors__list li + li {
  margin-top: 4px;
}

.offer-errors__list a {
  color: var(--red-ink);
}

.offer-number {
  font-variant-numeric: tabular-nums;
}

.offer-message {
  min-height: 140px;
}

.offer-warning {
  margin: -10px 0 22px;
  font-size: 13px;
  color: var(--brass-text);
}

.offer-gate {
  max-width: 60ch;
  margin: 16px 0 0;
  padding-top: 16px;
  font-size: 13px;
  color: var(--slate);
  border-top: 1px solid var(--line);
}

.offer-counter {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--slate);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
