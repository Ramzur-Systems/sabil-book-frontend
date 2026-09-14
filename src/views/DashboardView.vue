<script setup lang="ts">
/**
 * Customer workspace. Two lists over one question: what is waiting on a
 * provider, and what is waiting on me. Counts are derived from the same
 * fetched collections the lists render — never a separate stats endpoint,
 * so the number and the list can never disagree.
 */
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { listRequests } from '@/api/requests'
import { listOrders } from '@/api/orders'
import { queryKeys } from '@/api/queryKeys'
import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import MiniRow from '@/components/ui/MiniRow.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import StatRow from '@/components/ui/StatRow.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import { labelFor } from '@/types/status'
import { timeLeft } from '@/lib/utils'
import type { OrderStatus, RequestStatus } from '@/types/entities'

const OPEN_REQUEST_STATUSES: readonly RequestStatus[] = ['pending_moderation', 'published']

const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  'awaiting_payment',
  'funded',
  'delivered',
  'under_review',
  'disputed',
  'partially_resolved',
]

const requestParams = { mine: true } as const
const orderParams = { mine: true } as const

const {
  data: requestPage,
  isPending: requestsPending,
  isError: requestsFailed,
  error: requestsError,
  refetch: refetchRequests,
} = useQuery({
  queryKey: queryKeys.requests(requestParams),
  queryFn: () => listRequests(requestParams),
})

const {
  data: orderPage,
  isPending: ordersPending,
  isError: ordersFailed,
  error: ordersError,
  refetch: refetchOrders,
} = useQuery({
  queryKey: queryKeys.orders(orderParams),
  queryFn: () => listOrders(orderParams),
})

const openRequests = computed(() =>
  (requestPage.value?.results ?? []).filter((request) =>
    OPEN_REQUEST_STATUSES.includes(request.status),
  ),
)

const activeOrders = computed(() =>
  (orderPage.value?.results ?? []).filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)),
)

const completedOrders = computed(() =>
  (orderPage.value?.results ?? []).filter((order) => order.status === 'completed'),
)

const statsReady = computed(() => Boolean(requestPage.value) && Boolean(orderPage.value))

const stats = computed(() => [
  { label: 'Awaiting offers', value: openRequests.value.length },
  { label: 'Active orders', value: activeOrders.value.length },
  { label: 'Completed', value: completedOrders.value.length },
])

function offerMeta(count: number): string {
  if (count === 0) return 'No offers yet'
  return count === 1 ? '1 offer' : `${count} offers`
}
</script>

<template>
  <PageHeader title="Your workspace">
    <template #action>
      <Button :to="{ name: 'request-new' }">New request</Button>
    </template>
  </PageHeader>

  <SkeletonRows v-if="!statsReady" :count="1" :height="66" />
  <StatRow v-else :stats="stats" />

  <SectionHeading>Requests awaiting offers</SectionHeading>

  <SkeletonRows v-if="requestsPending" :count="2" />
  <ErrorState
    v-else-if="requestsFailed"
    :error="requestsError"
    title="Your requests didn't load"
    @retry="refetchRequests()"
  />
  <EmptyState
    v-else-if="openRequests.length === 0"
    title="No requests awaiting offers"
    body="Post what you need and providers will bid on it."
  >
    <Button :to="{ name: 'request-new' }">New request</Button>
  </EmptyState>
  <div v-else>
    <MiniRow
      v-for="request in openRequests"
      :key="request.id"
      :title="request.title"
      :meta="`${offerMeta(request.offerCount)} · ${timeLeft(request.deadline)}`"
      :to="{ name: 'request-detail', params: { id: request.id } }"
    >
      <StatusPill :status="request.status" />
    </MiniRow>
  </div>

  <SectionHeading>Active orders</SectionHeading>

  <SkeletonRows v-if="ordersPending" :count="2" />
  <ErrorState
    v-else-if="ordersFailed"
    :error="ordersError"
    title="Your orders didn't load"
    @retry="refetchOrders()"
  />
  <EmptyState
    v-else-if="activeOrders.length === 0"
    title="No active orders"
    body="An order starts once you accept an offer on one of your requests."
  >
    <Button variant="secondary" :to="{ name: 'request-new' }">New request</Button>
  </EmptyState>
  <div v-else>
    <MiniRow
      v-for="order in activeOrders"
      :key="order.id"
      :title="order.requestTitle ?? 'Order'"
      :meta="
        order.providerName
          ? `${order.providerName} · ${labelFor(order.status).toLowerCase()}`
          : labelFor(order.status)
      "
      :to="{ name: 'order-detail', params: { id: order.id } }"
    >
      <StatusPill :status="order.status" />
    </MiniRow>
  </div>
</template>
