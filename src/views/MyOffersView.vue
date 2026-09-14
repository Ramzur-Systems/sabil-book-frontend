<script setup lang="ts">
/**
 * Provider journey → My offers. Active bids first (accepted at the top, where
 * the money is), resolved ones below. A submitted offer can still be withdrawn.
 */
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import MiniRow from '@/components/ui/MiniRow.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import StatusPill from '@/components/ui/StatusPill.vue'

import { listMyOffers, withdrawOffer } from '@/api/offers'
import { queryKeys } from '@/api/queryKeys'
import { formatMoney, timeAgo } from '@/lib/utils'
import { useUiStore } from '@/stores/ui'
import type { Offer, OfferStatus } from '@/types/entities'

const queryClient = useQueryClient()
const ui = useUiStore()

const offersQuery = useQuery({
  queryKey: queryKeys.myOffers,
  queryFn: () => listMyOffers(),
})

const offers = computed(() => offersQuery.data.value?.results ?? [])

const ACTIVE_ORDER: Partial<Record<OfferStatus, number>> = { accepted: 0, submitted: 1 }

function byRecency(a: Offer, b: Offer): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

const activeOffers = computed(() =>
  offers.value
    .filter((offer) => offer.status === 'accepted' || offer.status === 'submitted')
    .sort((a, b) => {
      const rank = (ACTIVE_ORDER[a.status] ?? 9) - (ACTIVE_ORDER[b.status] ?? 9)
      return rank !== 0 ? rank : byRecency(a, b)
    }),
)

const resolvedOffers = computed(() =>
  offers.value
    .filter((offer) => offer.status === 'rejected' || offer.status === 'withdrawn')
    .sort(byRecency),
)

function titleOf(offer: Offer): string {
  return offer.requestTitle ?? 'Untitled request'
}

function metaOf(offer: Offer): string {
  return `${formatMoney(offer.price, offer.currency)} · submitted ${timeAgo(offer.createdAt)}`
}

const dialog = ref<HTMLDialogElement | null>(null)
const pending = ref<Offer | null>(null)
let trigger: HTMLElement | null = null

function askWithdraw(offer: Offer, event: MouseEvent) {
  trigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  pending.value = offer
  dialog.value?.showModal()
}

function closeDialog() {
  dialog.value?.close()
}

function onDialogClose() {
  pending.value = null
  trigger?.focus()
  trigger = null
}

function onDialogClick(event: MouseEvent) {
  if (event.target === dialog.value) closeDialog()
}

const withdrawMutation = useMutation({
  mutationFn: (offerId: string) => withdrawOffer(offerId),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.myOffers })
    await queryClient.invalidateQueries({ queryKey: queryKeys.requests() })
    ui.notify('Offer withdrawn.', 'success')
    closeDialog()
  },
  onError: (error: unknown) => {
    ui.notify(
      error instanceof Error ? error.message : 'That offer could not be withdrawn.',
      'danger',
    )
  },
})

function confirmWithdraw() {
  const offer = pending.value
  if (!offer) return
  withdrawMutation.mutate(offer.id)
}
</script>

<template>
  <section>
    <PageHeader title="My offers" />

    <SkeletonRows v-if="offersQuery.isPending.value" :count="3" :height="64" />

    <ErrorState
      v-else-if="offersQuery.isError.value"
      :error="offersQuery.error.value"
      title="Your offers didn't load"
      @retry="() => offersQuery.refetch()"
    />

    <EmptyState
      v-else-if="offers.length === 0"
      title="You have not submitted any offers yet"
      body="Open requests are waiting in the feed. Bid on one and it will show up here."
    >
      <Button :to="{ name: 'browse' }">Browse open requests</Button>
    </EmptyState>

    <template v-else>
      <template v-if="activeOffers.length">
        <SectionHeading>Active</SectionHeading>
        <div class="offer-list">
          <MiniRow
            v-for="offer in activeOffers"
            :key="offer.id"
            :title="titleOf(offer)"
            :meta="metaOf(offer)"
          >
            <div class="offer-actions">
              <Button
                v-if="offer.status === 'submitted'"
                variant="text"
                @click="askWithdraw(offer, $event)"
              >
                Withdraw
              </Button>
              <StatusPill :status="offer.status" />
            </div>
          </MiniRow>
        </div>
      </template>

      <template v-if="resolvedOffers.length">
        <SectionHeading>Resolved</SectionHeading>
        <div class="offer-list">
          <MiniRow
            v-for="offer in resolvedOffers"
            :key="offer.id"
            :title="titleOf(offer)"
            :meta="metaOf(offer)"
          >
            <StatusPill :status="offer.status" />
          </MiniRow>
        </div>
      </template>
    </template>

    <dialog
      ref="dialog"
      class="offer-dialog"
      aria-labelledby="withdraw-title"
      @close="onDialogClose"
      @click="onDialogClick"
    >
      <div class="offer-dialog__body">
        <h2 id="withdraw-title" class="offer-dialog__title">Withdraw this offer?</h2>
        <p class="offer-dialog__text">
          <template v-if="pending">
            {{ titleOf(pending) }} will no longer be considered by the customer. You cannot
            resubmit an offer on the same request.
          </template>
        </p>
        <div class="offer-dialog__actions">
          <Button variant="secondary" @click="closeDialog">Keep the offer</Button>
          <Button :loading="withdrawMutation.isPending.value" @click="confirmWithdraw">
            Withdraw offer
          </Button>
        </div>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.offer-list :deep(.sb-mini__meta) {
  font-variant-numeric: tabular-nums;
}

.offer-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.offer-dialog {
  width: min(420px, calc(100vw - 32px));
  padding: 0;
  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--red);
}

.offer-dialog::backdrop {
  background: var(--backdrop);
}

.offer-dialog__body {
  padding: 24px;
}

.offer-dialog__title {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
}

.offer-dialog__text {
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--slate);
}

.offer-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}
</style>
