<script setup lang="ts">
/**
 * Where the money is, and what the customer can do about it. The stepper is
 * driven purely by the order status; the action row only exists while the
 * order is actually reviewable. Correction and dispute both take a written
 * reason — they set a human process in motion and a bare click won't do.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  acceptDelivery,
  attachmentDownloadUrl,
  getOrder,
  openDispute,
  requestCorrection,
} from '@/api/orders'
import { getRequest, listCategories } from '@/api/requests'
import { queryKeys } from '@/api/queryKeys'
import { setDocumentTitle } from '@/router'
import FileCard from '@/components/marketplace/FileCard.vue'
import OrderStepper from '@/components/marketplace/OrderStepper.vue'
import Field from '@/components/form/Field.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import { useUiStore } from '@/stores/ui'
import { formatDate } from '@/lib/utils'

const REASON_MIN = 20
/** Fixed so a failed submit inside the dialog can move focus to the control. */
const REASON_ID = 'order-reason'

const props = defineProps<{ id: string }>()

const router = useRouter()
const queryClient = useQueryClient()
const ui = useUiStore()

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

const requestId = computed(() => order.value?.requestId ?? '')

const { data: request } = useQuery({
  queryKey: computed(() => queryKeys.request(requestId.value)),
  queryFn: () => getRequest(requestId.value),
  enabled: computed(() => requestId.value !== ''),
})

const { data: categoryPage } = useQuery({
  queryKey: queryKeys.categories,
  queryFn: () => listCategories(),
})

const categoryName = computed(() => {
  const id = request.value?.categoryId
  if (!id) return null
  return categoryPage.value?.results.find((category) => category.id === id)?.name ?? null
})

const heading = computed(() => {
  const current = order.value
  if (!current) return ''
  const title = current.requestTitle ?? request.value?.title ?? 'Order'
  return current.providerName ? `${title} — order with ${current.providerName}` : title
})

/* Name the tab after the order — two money screens shared one title (WCAG 2.4.2). */
watch(
  heading,
  (text) => {
    if (text) setDocumentTitle(text)
  },
  { immediate: true },
)

const attachments = computed(() => order.value?.attachments ?? [])

/** Confirm / correction / dispute are only meaningful once work has landed. */
const reviewable = computed(
  () => order.value?.status === 'delivered' || order.value?.status === 'under_review',
)

/** Every non-reviewable status resolves to one plain sentence and one way on. */
const resolvedState = computed(() => {
  const current = order.value
  if (!current || reviewable.value) return null
  switch (current.status) {
    case 'awaiting_payment':
      return {
        title: 'This order is not funded yet',
        body: 'The provider starts once the amount is held in escrow.',
        action: 'pay' as const,
      }
    case 'funded':
      return {
        title: 'Waiting on the delivery',
        body: 'The amount is held in escrow. The delivery appears here when the provider uploads it.',
        action: null,
      }
    case 'completed':
      return {
        title: 'You confirmed this delivery',
        body: current.completedAt
          ? `Completed on ${formatDate(current.completedAt)}. The payout has been released to the provider.`
          : 'The payout has been released to the provider.',
        action: 'review' as const,
      }
    case 'disputed':
      return {
        title: 'This order is in dispute',
        body: 'The escrow balance is frozen while the case is reviewed. You will be contacted about the outcome.',
        action: null,
      }
    case 'refunded':
      return {
        title: 'This order was refunded',
        body: 'The full escrow balance was returned to you.',
        action: null,
      }
    case 'partially_resolved':
      return {
        title: 'This order was partially resolved',
        body: 'Part of the escrow balance was returned to you and the remainder released to the provider.',
        action: null,
      }
    default:
      return {
        title: 'This order was cancelled',
        body: 'Nothing further is owed on it.',
        action: null,
      }
  }
})

/* ---- reason dialog --------------------------------------------------- */

type ReasonMode = 'correction' | 'dispute'

const reasonDialog = ref<HTMLDialogElement | null>(null)
const reasonMode = ref<ReasonMode | null>(null)
const reason = ref('')
/** The reason shows its problem once the field has been left, or once submitted. */
const reasonTouched = ref(false)
const reasonSubmitted = ref(false)
let triggerElement: HTMLElement | null = null

const reasonProblem = computed(() =>
  reason.value.trim().length < REASON_MIN
    ? `Give at least ${REASON_MIN} characters so the other side knows what to act on.`
    : '',
)

const reasonError = computed(() =>
  reasonTouched.value || reasonSubmitted.value ? reasonProblem.value : '',
)

const dialogCopy = computed(() =>
  reasonMode.value === 'dispute'
    ? {
        title: 'Open a dispute',
        body: 'A dispute freezes the escrow balance and hands the case to Sabil Books. Set out what went wrong and what you expected instead.',
        label: 'Why are you disputing this delivery?',
        confirm: 'Open the dispute',
      }
    : {
        title: 'Request a correction',
        body: 'The provider gets one more pass at the delivery. Be specific about what has to change.',
        label: 'What needs to change?',
        confirm: 'Send the request',
      },
)

function openReason(mode: ReasonMode) {
  triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
  reasonMode.value = mode
  reason.value = ''
  reasonTouched.value = false
  reasonSubmitted.value = false
  void nextTick(() => reasonDialog.value?.showModal())
}

function closeReason() {
  reasonDialog.value?.close()
}

function onDialogClose() {
  reasonMode.value = null
  reason.value = ''
  reasonTouched.value = false
  reasonSubmitted.value = false
  triggerElement?.focus()
  triggerElement = null
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === reasonDialog.value) closeReason()
}

/* ---- mutations ------------------------------------------------------- */

function invalidateOrder() {
  void queryClient.invalidateQueries({ queryKey: queryKeys.order(props.id) })
  void queryClient.invalidateQueries({ queryKey: queryKeys.orders({ mine: true }) })
}

const confirm = useMutation({
  mutationFn: () => acceptDelivery(props.id),
  onSuccess: (accepted) => {
    // Seed the cache before navigating: the review screen guards on the order
    // status, and a stale `delivered` would block the page we just sent them to.
    queryClient.setQueryData(queryKeys.order(props.id), accepted)
    invalidateOrder()
    ui.notify('Delivery confirmed. The payout has been released.', 'success')
    void router.push({ name: 'review', params: { id: props.id } })
  },
  onError: (mutationError: Error) => {
    ui.notify(mutationError.message, 'danger')
  },
})

const correct = useMutation({
  mutationFn: (text: string) => requestCorrection(props.id, { reason: text }),
  onSuccess: () => {
    invalidateOrder()
    ui.notify('Correction requested. The provider has been notified.', 'success')
    closeReason()
  },
  onError: (mutationError: Error) => {
    ui.notify(mutationError.message, 'danger')
  },
})

const dispute = useMutation({
  mutationFn: (text: string) => openDispute(props.id, { reason: text }),
  onSuccess: () => {
    invalidateOrder()
    ui.notify('Dispute opened. The escrow balance is frozen while it is reviewed.', 'success')
    closeReason()
  },
  onError: (mutationError: Error) => {
    ui.notify(mutationError.message, 'danger')
  },
})

const reasonPending = computed(() => correct.isPending.value || dispute.isPending.value)

function submitReason() {
  const text = reason.value.trim()
  if (text.length < REASON_MIN) {
    // The trigger button keeps focus otherwise, and nothing is announced.
    reasonSubmitted.value = true
    void nextTick(() => document.getElementById(REASON_ID)?.focus())
    return
  }
  if (reasonMode.value === 'dispute') dispute.mutate(text)
  else correct.mutate(text)
}

watch(
  () => props.id,
  () => {
    if (reasonDialog.value?.open) closeReason()
  },
)
</script>

<template>
  <SkeletonRows v-if="isPending" :count="3" :height="72" />

  <ErrorState
    v-else-if="isError"
    :error="error"
    title="This order didn't load"
    @retry="refetch()"
  />

  <template v-else-if="order">
    <Badge v-if="categoryName" :label="categoryName" />
    <h1 class="sb-order__title">{{ heading }}</h1>

    <OrderStepper :status="order.status" />

    <SectionHeading>Delivery</SectionHeading>

    <EmptyState
      v-if="attachments.length === 0"
      title="No files yet"
      body="Uploaded work appears here as soon as the provider delivers it."
    />
    <div v-else class="sb-files">
      <FileCard
        v-for="attachment in attachments"
        :key="attachment.id"
        :attachment="attachment"
        :download-url="attachmentDownloadUrl(attachment.id)"
      />
    </div>

    <div v-if="reviewable" class="sb-actions">
      <Button :loading="confirm.isPending.value" @click="confirm.mutate()">
        Confirm delivery
      </Button>
      <Button
        variant="secondary"
        :disabled="confirm.isPending.value"
        @click="openReason('correction')"
      >
        Request a correction
      </Button>
      <Button variant="text" :disabled="confirm.isPending.value" @click="openReason('dispute')">
        Open a dispute
      </Button>
    </div>

    <EmptyState
      v-else-if="resolvedState"
      :title="resolvedState.title"
      :body="resolvedState.body"
    >
      <Button
        v-if="resolvedState.action === 'pay'"
        :to="{ name: 'checkout', params: { id: props.id } }"
      >
        Pay now
      </Button>
      <Button
        v-else-if="resolvedState.action === 'review'"
        variant="secondary"
        :to="{ name: 'review', params: { id: props.id } }"
      >
        Rate this delivery
      </Button>
    </EmptyState>
  </template>

  <dialog
    ref="reasonDialog"
    class="sb-dialog"
    aria-labelledby="sb-reason-title"
    @close="onDialogClose"
    @click="onBackdropClick"
  >
    <div class="sb-dialog__panel">
      <h2 id="sb-reason-title" class="sb-dialog__title">{{ dialogCopy.title }}</h2>
      <p class="sb-dialog__body">{{ dialogCopy.body }}</p>

      <Field :label="dialogCopy.label" required :for-id="REASON_ID" :error="reasonError">
        <template #default="{ id, describedBy, invalid }">
          <textarea
            :id="id"
            v-model="reason"
            class="sb-control"
            :aria-describedby="describedBy"
            :aria-invalid="invalid || undefined"
            @blur="reasonTouched = true"
          />
        </template>
      </Field>

      <div class="sb-dialog__actions">
        <Button :loading="reasonPending" @click="submitReason">{{ dialogCopy.confirm }}</Button>
        <Button variant="secondary" :disabled="reasonPending" @click="closeReason">Cancel</Button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.sb-order__title {
  max-width: 640px;
  /* 24px below matches the mockup's h1 → stepper gap; 8px was crowding the dots. */
  margin: 16px 0 24px;
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 500;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.sb-files > :deep(* + *) {
  margin-top: 12px;
}

.sb-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  margin-top: 32px;
}

.sb-dialog {
  width: min(520px, calc(100vw - 32px));
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
  .sb-order__title {
    font-size: 20px;
  }

  .sb-actions {
    gap: 16px;
  }
}
</style>
