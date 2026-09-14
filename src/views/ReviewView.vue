<script setup lang="ts">
/**
 * The last step of the transaction. A rating is required because it is the
 * only signal the next customer gets; the written comment is optional.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { getOrder, submitReview } from '@/api/orders'
import { queryKeys } from '@/api/queryKeys'
import StarRating from '@/components/marketplace/StarRating.vue'
import Field from '@/components/form/Field.vue'
import Button from '@/components/ui/Button.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import { useUiStore } from '@/stores/ui'

const COMMENT_MAX = 2000

const props = defineProps<{ id: string }>()

const router = useRouter()
const queryClient = useQueryClient()
const ui = useUiStore()

const rating = ref(0)
const comment = ref('')
const ratingError = ref('')

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

const subtitle = computed(() => {
  const current = order.value
  if (!current) return ''
  const title = current.requestTitle ?? 'This order'
  return current.providerName ? `${title} — completed by ${current.providerName}` : title
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
  if (rating.value < 1) {
    ratingError.value = 'Pick a rating before submitting.'
    return
  }
  if (commentError.value) return
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

  <form v-else novalidate @submit.prevent="submit">
    <p class="sb-review__subtitle">{{ subtitle }}</p>

    <div class="sb-review__stars">
      <StarRating v-model="rating" />
    </div>
    <p v-if="ratingError" class="sb-review__error">{{ ratingError }}</p>

    <div class="sb-review__comment">
      <Field
        label="What stood out about this delivery?"
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
