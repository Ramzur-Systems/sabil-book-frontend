<script setup lang="ts">
/**
 * The comparison screen — the mechanic the whole product is judged on.
 * Offers are rows in a ledger, read top to bottom against one another.
 * Accepting spends money and cannot be undone, so it passes through an
 * explicit confirmation naming the provider and the price.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { getRequest, listCategories, listRequestOffers } from '@/api/requests'
import { acceptOffer } from '@/api/offers'
import { ApiError } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import { setDocumentTitle } from '@/router'
import OfferLedgerRow from '@/components/marketplace/OfferLedgerRow.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import StatRow from '@/components/ui/StatRow.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { formatBudget, formatMoney, timeLeft } from '@/lib/utils'
import type { Offer } from '@/types/entities'

const props = defineProps<{ id: string }>()

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const auth = useAuthStore()
const ui = useUiStore()

const {
  data: request,
  isPending: requestPending,
  isError: requestFailed,
  error: requestError,
  refetch: refetchRequest,
} = useQuery({
  queryKey: computed(() => queryKeys.request(props.id)),
  queryFn: () => getRequest(props.id),
})

/**
 * Three viewer classes share this page. The owner reads the ledger; a signed-in
 * stranger sees the offer count but never the bids; a guest sees the teaser.
 */
const isOwner = computed(() => request.value?.isMine === true)

/* Name the tab after the request — two money screens shared one title (WCAG 2.4.2). */
watch(
  () => request.value?.title,
  (title) => {
    if (title) setDocumentTitle(title)
  },
  { immediate: true },
)
const isGuest = computed(() => !auth.isAuthenticated)

/**
 * Offers are sealed. `GET /requests/:id/offers` answers 403 to anyone but the
 * owner, so the query is never allowed to fire for anyone else.
 */
const {
  data: offerPage,
  isPending: offersPending,
  isError: offersFailed,
  error: offersError,
  refetch: refetchOffers,
} = useQuery({
  queryKey: computed(() => queryKeys.requestOffers(props.id)),
  queryFn: () => listRequestOffers(props.id),
  enabled: isOwner,
})

/** A 403 here is the sealed-bid rule working, not a failure worth a banner. */
const offersForbidden = computed(
  () => offersError.value instanceof ApiError && offersError.value.status === 403,
)

const offerSummary = computed(() => {
  const count = request.value?.offerCount ?? 0
  if (count === 0) return 'No offers have been submitted yet.'
  return count === 1 ? 'One offer has been submitted.' : `${count} offers have been submitted.`
})

const signInTarget = computed(() => ({
  name: 'login' as const,
  query: { next: route.fullPath },
}))

const { data: categoryPage } = useQuery({
  queryKey: queryKeys.categories,
  queryFn: () => listCategories(),
})

const categoryName = computed(() => {
  const id = request.value?.categoryId
  if (!id) return null
  return categoryPage.value?.results.find((category) => category.id === id)?.name ?? null
})

const offers = computed(() => offerPage.value?.results ?? [])

/** Offers can only be accepted while the request is still open to bidding. */
const acceptable = computed(() => request.value?.status === 'published')

function canAccept(offer: Offer): boolean {
  return acceptable.value && offer.status === 'submitted'
}

const stats = computed(() => {
  const current = request.value
  if (!current) return []
  const count = isOwner.value ? (offerPage.value?.count ?? current.offerCount) : current.offerCount
  return [
    { label: 'Budget', value: formatBudget(current.budgetMin, current.budgetMax, current.currency) },
    { label: 'Deadline', value: timeLeft(current.deadline) },
    { label: 'Offers', value: count === 0 ? 'None yet' : `${count} received` },
  ]
})

function providerNameOf(offer: Offer): string {
  return offer.provider?.displayName ?? 'this provider'
}

/* ---- confirmation ---------------------------------------------------- */

const confirmDialog = ref<HTMLDialogElement | null>(null)
const pendingOffer = ref<Offer | null>(null)
let triggerElement: HTMLElement | null = null

function openConfirm(offer: Offer) {
  if (!acceptable.value) return
  triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
  pendingOffer.value = offer
  void nextTick(() => confirmDialog.value?.showModal())
}

function closeConfirm() {
  confirmDialog.value?.close()
}

/** Native close covers Escape, the close() call and the form method=dialog. */
function onDialogClose() {
  pendingOffer.value = null
  triggerElement?.focus()
  triggerElement = null
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === confirmDialog.value) closeConfirm()
}

const accept = useMutation({
  mutationFn: (offerId: string) => acceptOffer(offerId),
  onSuccess: (order) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.request(props.id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.requestOffers(props.id) })
    // Accepting closes the request, so every list that could show it goes —
    // ['requests', {}] partial-matches the public browse and home feeds too.
    void queryClient.invalidateQueries({ queryKey: queryKeys.requests() })
    // Sibling offers are rejected by the accept, and one of them can be ours.
    void queryClient.invalidateQueries({ queryKey: queryKeys.myOffers })
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders({ mine: true }) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.order(order.id) })
    ui.notify('Offer accepted. Fund the order to start the work.', 'success')
    void router.push({ name: 'checkout', params: { id: order.id } })
  },
  onError: (error: Error) => {
    ui.notify(error.message, 'danger')
    closeConfirm()
  },
})

function confirmAccept() {
  const offer = pendingOffer.value
  if (!offer) return
  accept.mutate(offer.id)
}

/** A navigation to a different request must not leave a dialog open. */
watch(
  () => props.id,
  () => {
    if (confirmDialog.value?.open) closeConfirm()
  },
)
</script>

<template>
  <section>
    <SkeletonRows v-if="requestPending" :count="3" :height="72" />

    <ErrorState
      v-else-if="requestFailed"
      :error="requestError"
      title="This request didn't load"
      @retry="refetchRequest()"
    />

    <template v-else-if="request">
      <div class="sb-request__eyebrow">
        <Badge v-if="categoryName" :label="categoryName" />
        <StatusPill :status="request.status" />
      </div>
      <h1 class="sb-request__title">{{ request.title }}</h1>

      <StatRow :stats="stats" />

      <p v-if="request.description" class="sb-request__description">{{ request.description }}</p>
      <p v-else class="sb-request__description">{{ request.descriptionPreview }}</p>

      <!-- Guest: the brief is a teaser. Say so in plain words, don't fake a paywall. -->
      <div v-if="isGuest" class="sb-gate">
        <p v-if="request.descriptionTruncated" class="sb-gate__body">
          You are reading the opening of the brief. Signing in reveals the rest and lets you bid on
          it. You can write your offer first — sign-in is asked for when you submit.
        </p>
        <p v-else class="sb-gate__body">
          Sign in to bid on this request. You can write your offer first — sign-in is asked for when
          you submit.
        </p>
        <div class="sb-gate__actions">
          <Button v-if="acceptable" :to="{ name: 'submit-offer', params: { id: request.id } }">
            Submit an offer
          </Button>
          <Button variant="secondary" :to="signInTarget">Sign in</Button>
        </div>
      </div>

      <!-- Owner: the ledger of bids, read top to bottom against one another. -->
      <template v-if="isOwner">
        <SectionHeading>Offers</SectionHeading>

        <SkeletonRows v-if="offersPending" :count="3" :height="96" />
        <ErrorState
          v-else-if="offersFailed && !offersForbidden"
          :error="offersError"
          title="Offers didn't load"
          @retry="refetchOffers()"
        />
        <EmptyState
          v-else-if="offers.length === 0"
          title="No offers yet"
          body="Providers see this request in their feed once it is published. You'll be able to compare bids here."
        >
          <Button variant="secondary" :to="{ name: 'dashboard' }">Back to your workspace</Button>
        </EmptyState>

        <ul v-else class="sb-offers">
          <li v-for="offer in offers" :key="offer.id" class="sb-offers__item">
            <OfferLedgerRow
              :offer="offer"
              :selected="offer.status === 'accepted'"
              :show-action="canAccept(offer)"
              :busy="accept.isPending.value && pendingOffer?.id === offer.id"
              @accept="openConfirm(offer)"
            />
          </li>
        </ul>
      </template>

      <!-- Signed in, not the owner: the count is public, the bids are not. -->
      <template v-else-if="!isGuest">
        <SectionHeading>Offers</SectionHeading>
        <div class="sb-gate">
          <p class="sb-gate__body">
            {{ offerSummary }} Bids stay between each provider and the customer, so you cannot read
            them or see how many others price the work.
          </p>
          <Button v-if="acceptable" :to="{ name: 'submit-offer', params: { id: request.id } }">
            Submit an offer
          </Button>
        </div>
      </template>
    </template>

    <dialog
      ref="confirmDialog"
      class="sb-dialog"
      aria-labelledby="sb-accept-title"
      @close="onDialogClose"
      @click="onBackdropClick"
    >
      <div v-if="pendingOffer" class="sb-dialog__panel">
        <h2 id="sb-accept-title" class="sb-dialog__title">Accept this offer</h2>
        <p class="sb-dialog__body">
          You are accepting {{ providerNameOf(pendingOffer) }} at
          {{ formatMoney(pendingOffer.price, pendingOffer.currency) }} for
          {{ pendingOffer.deliveryDays }}-day delivery. Every other offer on this request is closed,
          and the amount is held in escrow until you accept the delivery.
        </p>
        <div class="sb-dialog__actions">
          <Button :loading="accept.isPending.value" @click="confirmAccept">
            Accept and pay
          </Button>
          <Button variant="secondary" :disabled="accept.isPending.value" @click="closeConfirm">
            Cancel
          </Button>
        </div>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.sb-request__eyebrow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.sb-request__title {
  max-width: 640px;
  margin: 16px 0 24px;
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 500;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.sb-request__description {
  max-width: 65ch;
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--slate);
  white-space: pre-wrap;
}

.sb-gate {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  align-items: center;
  justify-content: space-between;
  max-width: 65ch;
  padding: 18px 0;
  margin: 0 0 24px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.sb-gate__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.sb-gate__body {
  min-width: 220px;
  flex: 1 1 320px;
  margin: 0;
  font-size: 14px;
  color: var(--slate);
}

.sb-offers {
  padding: 0;
  margin: 0;
  list-style: none;
}

.sb-offers__item + .sb-offers__item {
  margin-top: 12px;
}

.sb-dialog {
  width: min(480px, calc(100vw - 32px));
  padding: 0;
  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--line);
}

.sb-dialog::backdrop {
  background: var(--backdrop);
}

.sb-dialog__panel {
  padding: 24px;
}

.sb-dialog__title {
  margin: 0 0 10px;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 500;
}

.sb-dialog__body {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--slate);
}

.sb-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

@media (max-width: 560px) {
  .sb-request__title {
    font-size: 24px;
  }
}
</style>
