<script setup lang="ts">
/**
 * Funding an accepted offer. The money moves into escrow here, so the page
 * states the three numbers plainly and puts the live total on the button.
 * Any order that isn't awaiting payment gets an explanation, not a form.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { getOrder, payOrder } from '@/api/orders'
import type { PaymentMethod } from '@/api/orders'
import { queryKeys } from '@/api/queryKeys'
import SelectableCard from '@/components/marketplace/SelectableCard.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import { useUiStore } from '@/stores/ui'
import { formatMoney } from '@/lib/utils'

const props = defineProps<{ id: string }>()

const router = useRouter()
const queryClient = useQueryClient()
const ui = useUiStore()

const method = ref<PaymentMethod>('card')

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

const payable = computed(() => order.value?.status === 'awaiting_payment')

const summaryLine = computed(() => {
  const current = order.value
  if (!current) return ''
  const title = current.requestTitle ?? 'Request'
  return current.providerName ? `${current.providerName} — ${title}` : title
})

const total = computed(() =>
  order.value ? formatMoney(order.value.totalCharged, order.value.currency) : '',
)

/** Why this order can't be funded right now, in the order's own terms. */
const blockedState = computed(() => {
  const current = order.value
  if (!current || current.status === 'awaiting_payment') return null
  switch (current.status) {
    case 'cancelled':
      return {
        title: 'This order was cancelled',
        body: 'Nothing was charged. Post a new request or accept another offer to start again.',
      }
    case 'refunded':
    case 'partially_resolved':
      return {
        title: 'This order has been resolved',
        body: 'The escrow balance was already returned. There is nothing left to pay.',
      }
    default:
      return {
        title: 'This order is already funded',
        body: 'The amount is held in escrow. Track the delivery on the order page.',
      }
  }
})

const pay = useMutation({
  mutationFn: (payload: { id: string; method: PaymentMethod }) =>
    payOrder(payload.id, { method: payload.method }),
  onSuccess: (paid) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.order(paid.id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders({ mine: true }) })
    ui.notify('Payment held in escrow. The provider can start work.', 'success')
    void router.push({ name: 'order-detail', params: { id: paid.id } })
  },
  onError: (mutationError: Error) => {
    ui.notify(mutationError.message, 'danger')
  },
})

function submit() {
  if (!payable.value) return
  pay.mutate({ id: props.id, method: method.value })
}
</script>

<template>
  <h1 class="sb-checkout__title">Confirm and pay</h1>

  <SkeletonRows v-if="isPending" :count="2" :height="88" />

  <ErrorState
    v-else-if="isError"
    :error="error"
    title="This order didn't load"
    @retry="refetch()"
  />

  <EmptyState v-else-if="blockedState" :title="blockedState.title" :body="blockedState.body">
    <Button variant="secondary" :to="{ name: 'order-detail', params: { id: props.id } }">
      View the order
    </Button>
  </EmptyState>

  <form v-else-if="order" novalidate @submit.prevent="submit">
    <div class="sb-summary">
      <div class="sb-summary__line">
        <span class="sb-summary__label">{{ summaryLine }}</span>
        <span class="sb-summary__amount">{{ formatMoney(order.price, order.currency) }}</span>
      </div>
      <div class="sb-summary__line">
        <span class="sb-summary__label">Service fee</span>
        <span class="sb-summary__amount">
          {{ formatMoney(order.commissionAmount, order.currency) }}
        </span>
      </div>
      <div class="sb-summary__line sb-summary__line--total">
        <span class="sb-summary__label">Total</span>
        <span class="sb-summary__amount">{{ total }}</span>
      </div>
    </div>

    <SectionHeading>Payment method</SectionHeading>

    <fieldset class="sb-methods">
      <legend class="sr-only">Payment method</legend>
      <SelectableCard v-model="method" value="card" label="Card" name="payment-method" />
      <SelectableCard
        v-model="method"
        value="local_bank_kz"
        label="Local bank (KZ)"
        name="payment-method"
      />
    </fieldset>

    <Button type="submit" :loading="pay.isPending.value">Pay {{ total }}</Button>
  </form>
</template>

<style scoped>
.sb-checkout__title {
  margin: 0 0 24px;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
}

.sb-summary {
  max-width: 480px;
  padding: 24px;
  margin-bottom: 24px;
  background: var(--paper);
  border: 1px solid var(--line);
}

.sb-summary__line {
  display: flex;
  gap: 20px;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
  border-bottom: 1px solid var(--line);
}
.sb-summary__line:last-child {
  border-bottom: none;
}

.sb-summary__line--total {
  padding-top: 16px;
  font-size: 17px;
  font-weight: 600;
}

.sb-summary__label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.sb-summary__amount {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.sb-methods {
  display: flex;
  gap: 12px;
  max-width: 480px;
  padding: 0;
  margin: 0 0 32px;
  border: none;
}

.sb-methods > :deep(*) {
  flex: 1;
  min-width: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (max-width: 480px) {
  .sb-methods {
    flex-direction: column;
  }
}
</style>
