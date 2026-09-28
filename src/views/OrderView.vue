<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { account } from '../api/account'
import BaseButton from '../components/BaseButton.vue'

const query = useQuery({ queryKey: ['order', 'sample'], queryFn: () => account.order('sample') })
const client = useQueryClient()
const open = ref(false)
const action = ref<'correction' | 'dispute'>('correction')
const reason = ref('')
const feedback = ref('')
const mutation = useMutation({
  mutationFn: () => account.orderAction('sample', action.value, reason.value),
  onSuccess: async () => {
    open.value = false
    reason.value = ''
    feedback.value = 'Your request was submitted.'
    await client.invalidateQueries({ queryKey: ['order', 'sample'] })
  },
})
function show(kind: 'correction' | 'dispute') {
  action.value = kind
  feedback.value = ''
  open.value = true
}
</script>
<template>
  <div class="page narrow">
    <p v-if="query.isPending.value" class="loading-state">Loading order…</p>
    <p v-else-if="query.isError.value" class="error-state">Could not load order.</p>
    <template v-else-if="query.data.value"
      ><div class="eyebrow">Order · {{ query.data.value.category }}</div>
      <h1>{{ query.data.value.title }}</h1>
      <div class="order-steps">
        <div class="order-step done">Funded</div>
        <div class="order-step done">Delivered</div>
        <div class="order-step current">Under review</div>
        <div class="order-step">Completed</div>
      </div>
      <p v-if="feedback" class="alert" role="status">{{ feedback }}</p>
      <div class="detail-grid">
        <div>
          <h2 class="!text-3xl">Delivery</h2>
          <div class="panel">
            <strong>{{ query.data.value.fileName }}</strong>
            <p class="mt-3">
              Your expert has shared a finished document. Review it before confirming receipt.
            </p>
            <button
              class="button outline small"
              @click="feedback = 'File download is illustrative in demo mode.'"
            >
              View file
            </button>
          </div>
          <div class="form-actions">
            <button class="button outline" @click="show('correction')">Request a correction</button
            ><button class="button outline" @click="show('dispute')">Open a dispute</button
            ><BaseButton to="/app/orders/sample/review">Accept the work ↗</BaseButton>
          </div>
        </div>
        <aside class="panel side-panel">
          <h2>Order details</h2>
          <p>Expert: {{ query.data.value.expert }}</p>
          <p>Payment stays held until you accept the work.</p>
          <BaseButton to="/app/orders/sample/pay" variant="text">Payment details ↗</BaseButton>
        </aside>
      </div></template
    >
  </div>
  <DialogRoot v-model:open="open"
    ><DialogPortal
      ><DialogOverlay class="fixed inset-0 bg-[#102338aa] z-40" /><DialogContent
        class="fixed z-50 left-1/2 top-1/2 w-[min(90vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-7 shadow-2xl"
        ><DialogTitle class="text-2xl font-display text-ink">{{
          action === 'correction' ? 'Request a correction' : 'Open a dispute'
        }}</DialogTitle
        ><DialogDescription class="text-sm text-slate-600 mt-2">{{
          action === 'correction'
            ? 'Tell the expert what needs to change.'
            : 'Describe the issue so it can be reviewed.'
        }}</DialogDescription
        ><label for="order-reason" class="block mt-5 mb-2 text-sm font-semibold">Details</label
        ><textarea id="order-reason" v-model="reason" class="input" rows="5"></textarea>
        <div class="flex justify-end gap-3 mt-5">
          <DialogClose class="button outline">Cancel</DialogClose
          ><button
            class="button"
            :disabled="!reason.trim() || mutation.isPending.value"
            @click="mutation.mutate()"
          >
            Submit
          </button>
        </div>
        <p v-if="mutation.isError.value" class="form-error" role="alert">
          Could not submit. Please try again.
        </p></DialogContent
      ></DialogPortal
    ></DialogRoot
  >
</template>
