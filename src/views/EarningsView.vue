<script setup lang="ts">
/**
 * Provider journey → Earnings. Every figure here is derived from the provider's
 * own orders; nothing on this screen is a constant.
 */
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import MiniRow from '@/components/ui/MiniRow.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import StatRow from '@/components/ui/StatRow.vue'
import StatusPill from '@/components/ui/StatusPill.vue'

import { listOrders } from '@/api/orders'
import type { OrderListParams } from '@/api/orders'
import { queryKeys } from '@/api/queryKeys'
import { formatMoney } from '@/lib/utils'
import type { OrderT } from '@/types/entities'

const params: OrderListParams = { mine: true, role: 'provider' }

const ordersQuery = useQuery({
  queryKey: queryKeys.orders(params),
  queryFn: () => listOrders(params),
})

const orders = computed(() => ordersQuery.data.value?.results ?? [])

const currency = computed(() => orders.value[0]?.currency ?? 'USD')

function sum(rows: OrderT[]): number {
  return rows.reduce((total, order) => total + order.price, 0)
}

function completedThisMonth(order: OrderT): boolean {
  if (order.status !== 'completed' || !order.completedAt) return false
  const completed = new Date(order.completedAt)
  const now = new Date()
  return (
    completed.getFullYear() === now.getFullYear() && completed.getMonth() === now.getMonth()
  )
}

const totalEarned = computed(() =>
  sum(orders.value.filter((order) => order.status === 'completed')),
)

const pendingPayout = computed(() =>
  sum(
    orders.value.filter(
      (order) => order.payoutStatus === 'pending' || order.payoutStatus === 'initiated',
    ),
  ),
)

const thisMonth = computed(() => sum(orders.value.filter(completedThisMonth)))

const stats = computed(() => [
  { label: 'Total earned', value: formatMoney(totalEarned.value, currency.value) },
  { label: 'Pending payout', value: formatMoney(pendingPayout.value, currency.value) },
  { label: 'This month', value: formatMoney(thisMonth.value, currency.value) },
])

const PAYOUT_METHOD_LABELS: Record<string, string> = {
  card: 'card',
  local_bank_kz: 'local bank',
  local_bank: 'local bank',
  payoneer: 'Payoneer',
  bank_transfer: 'bank transfer',
}

function payoutMethodLabel(method: string): string {
  return PAYOUT_METHOD_LABELS[method] ?? method.replace(/_/g, ' ')
}

function metaOf(order: OrderT): string {
  if (!order.payoutMethod) return 'Payout method not set'
  return `Payout via ${payoutMethodLabel(order.payoutMethod)}`
}

function titleOf(order: OrderT): string {
  return order.requestTitle ?? 'Untitled request'
}
</script>

<template>
  <section>
    <PageHeader title="Earnings" />

    <SkeletonRows v-if="ordersQuery.isPending.value" :count="4" :height="64" />

    <ErrorState
      v-else-if="ordersQuery.isError.value"
      :error="ordersQuery.error.value"
      title="Your earnings didn't load"
      @retry="() => ordersQuery.refetch()"
    />

    <EmptyState
      v-else-if="orders.length === 0"
      title="No earnings yet"
      body="Once a customer accepts one of your offers and funds the order, it appears here with its payout."
    >
      <Button :to="{ name: 'browse' }">Browse open requests</Button>
    </EmptyState>

    <template v-else>
      <StatRow :stats="stats" />
      <div class="earnings-list">
        <MiniRow
          v-for="order in orders"
          :key="order.id"
          :title="titleOf(order)"
          :meta="metaOf(order)"
        >
          <StatusPill v-if="order.payoutStatus" :status="order.payoutStatus" />
        </MiniRow>
      </div>
    </template>
  </section>
</template>

<style scoped>
.earnings-list :deep(.sb-mini__meta) {
  font-variant-numeric: tabular-nums;
}
</style>
