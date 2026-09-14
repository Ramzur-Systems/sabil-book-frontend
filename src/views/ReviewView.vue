<script setup lang="ts">
/**
 * The last step of the transaction. A rating is required because it is the
 * only signal the next customer gets; the written comment is optional.
 */
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { getOrder, submitReview } from '@/api/orders'
import { queryKeys } from '@/api/queryKeys'
import StarRating from '@/components/marketplace/StarRating.vue'
import Field from '@/components/form/Field.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import { useUiStore } from '@/stores/ui'

const COMMENT_MAX = 2000
const COMMENT_ID = 'review-comment'

const props = defineProps<{ id: string }>()

const router = useRouter()
const queryClient = useQueryClient()
const ui = useUiStore()

const rating = ref(0)
const comment = ref('')
const ratingError = ref('')
/** The star radiogroup has no id of its own, so focus is found through its wrapper. */
const starsEl = ref<HTMLElement | null>(null)

const {
  data: order,
  isPending,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: computed(() => queryKeys.order(props.id)),
  queryFn: () => getOrder(props.id),
})

/**
 * A review is the customer's one shot, and it spends the signal that the next
 * customer reads. It is only available once the delivery has been accepted and
 * the escrow released — every earlier status gets an explanation, not a form.
 */
const reviewable = computed(() => order.value?.status === 'completed')

interface BlockedState {
  title: string
  body: string
  link: { to: RouteLocationRaw; label: string }
}

/** Why this order can't be rated yet, in the order's own terms. */
const blockedState = computed<BlockedState | null>(() => {
  const current = order.value
  if (!current || reviewable.value) return null
  const orderLink = {
    to: { name: 'order-detail', params: { id: props.id } },
    label: 'View the order',
  }
  switch (current.status) {
    case 'awaiting_payment':
      return {
        title: 'This order is not funded yet',
        body: 'Nothing has been delivered. Fund the order first, and rate the delivery once you have accepted it.',
        link: { to: { name: 'checkout', params: { id: props.id } }, label: 'Pay now' },
      }
    case 'funded':
      return {
        title: 'There is nothing to rate yet',
        body: 'The amount is held in escrow and the provider has not delivered. Rating opens once you accept the delivery.',
        link: orderLink,
      }
    case 'delivered':
    case 'under_review':
      return {
        title: 'Confirm the delivery first',
        body: 'The amount is still in escrow. Accept the delivery on the order page, and rating opens straight after.',
        link: { to: orderLink.to, label: 'Review the delivery' },
      }
    case 'disputed':
      return {
        title: 'This order is in dispute',
        body: 'The escrow balance is frozen while the case is reviewed. An order that never completed cannot be rated.',
        link: orderLink,
      }
    case 'refunded':
      return {
        title: 'This order was refunded',
        body: 'The full escrow balance was returned to you. There is no accepted delivery to rate.',
        link: orderLink,
      }
    case 'partially_resolved':
      return {
        title: 'This order was partially resolved',
        body: 'The escrow balance was split by the dispute outcome, so there is no accepted delivery to rate.',
        link: orderLink,
      }
    case 'cancelled':
      return {
        title: 'This order was cancelled',
        body: 'Nothing was delivered and nothing was charged. There is nothing to rate.',
        link: { to: { name: 'dashboard' }, label: 'Back to your workspace' },
      }
  }
  return null
})

const subtitle = computed(() => {
  const current = order.value
  if (!current) return ''
  const title = current.requestTitle ?? 'This order'
  if (!current.providerName) return title
  // "completed by" is a claim about the order's state, so it is gated on it.
  return current.status === 'completed'
    ? `${title} — completed by ${current.providerName}`
    : `${title} — ${current.providerName}`
})

const counter = computed(() => `${comment.value.length} / ${COMMENT_MAX}`)

const commentError = computed(() =>
  comment.value.length > COMMENT_MAX ? `Keep the comment under ${COMMENT_MAX} characters.` : '',
)

const review = useMutation({
  mutationFn: (payload: { rating: number; comment: string }) => submitReview(props.id, payload),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.order(props.id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders({ mine: true }) })
    ui.notify('Review submitted.', 'success')
    void router.push({ name: 'dashboard' })
  },
  onError: (mutationError: Error) => {
    ui.notify(mutationError.message, 'danger')
  },
})

function submit() {
  if (!reviewable.value) return
  if (rating.value < 1) {
    ratingError.value = 'Pick a rating before submitting.'
    void nextTick(() => starsEl.value?.querySelector('input')?.focus())
    return
  }
  if (commentError.value) {
    void nextTick(() => document.getElementById(COMMENT_ID)?.focus())
    return
  }
  ratingError.value = ''
  review.mutate({ rating: rating.value, comment: comment.value.trim() })
}
</script>

<template>
  <h1 class="sb-review__title">Rate this delivery</h1>

  <SkeletonRows v-if="isPending" :count="2" :height="72" />

  <ErrorState
    v-else-if="isError"
    :error="error"
    title="This order didn't load"
    @retry="refetch()"
  />

  <EmptyState v-else-if="blockedState" :title="blockedState.title" :body="blockedState.body">
    <Button variant="secondary" :to="blockedState.link.to">{{ blockedState.link.label }}</Button>
  </EmptyState>

  <form v-else-if="order" novalidate @submit.prevent="submit">
    <p class="sb-review__subtitle">{{ subtitle }}</p>

    <div ref="starsEl" class="sb-review__stars">
      <StarRating v-model="rating" />
    </div>
    <p v-if="ratingError" class="sb-review__error" role="alert">{{ ratingError }}</p>

    <div class="sb-review__comment">
      <Field
        label="What stood out about this delivery?"
        :for-id="COMMENT_ID"
        :hint="counter"
        :error="commentError"
      >
        <template #default="{ id, describedBy, invalid }">
          <textarea
            :id="id"
            v-model="comment"
            class="sb-control"
            :maxlength="COMMENT_MAX"
            placeholder="Share detail that would help other customers"
            :aria-describedby="describedBy"
            :aria-invalid="invalid || undefined"
          />
        </template>
      </Field>
    </div>

    <Button type="submit" :loading="review.isPending.value">Submit review</Button>
  </form>
</template>

<style scoped>
.sb-review__title {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
}

.sb-review__subtitle {
  max-width: 65ch;
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--slate);
  overflow-wrap: anywhere;
}

.sb-review__stars {
  margin-bottom: 24px;
}

.sb-review__error {
  margin: -16px 0 24px;
  font-size: 12px;
  font-weight: 500;
  color: var(--red);
}

.sb-review__comment {
  max-width: 480px;
}
</style>
