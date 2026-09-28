<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRoute, useRouter } from 'vue-router'
import { marketplace } from '../api/marketplace'
import { offerDraftSchema } from '../api/types'
import BaseButton from '../components/BaseButton.vue'
const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const id = computed(() => String(route.params.id))
const query = useQuery({
  queryKey: computed(() => ['request', id.value]),
  queryFn: () => marketplace.request(id.value),
})
const form = reactive({ price: '', days: '', message: '' })
const error = ref('')
const mutation = useMutation({
  mutationFn: (draft: { price: number; days: number; message: string }) =>
    marketplace.createOffer(id.value, draft),
  onSuccess: async () => {
    await client.invalidateQueries({ queryKey: ['request', id.value] })
    await router.push(`/requests/${id.value}`)
  },
})
function submit() {
  const result = offerDraftSchema.safeParse(form)
  if (!result.success) {
    error.value = result.error.issues[0]?.message || 'Complete the offer.'
    return
  }
  error.value = ''
  mutation.mutate(result.data, {
    onError: (e) => {
      error.value = e instanceof Error ? e.message : 'Could not send the offer.'
    },
  })
}
</script>
<template>
  <div class="page narrow">
    <p v-if="query.isPending.value" class="loading-state">Loading request…</p>
    <p v-else-if="query.isError.value" class="error-state">Request not found.</p>
    <template v-else-if="query.data.value"
      ><div class="eyebrow">Responding to</div>
      <h1 class="max-w-[760px]">{{ query.data.value.title }}</h1>
      <p class="page-intro">Make a clear offer the customer can compare with confidence.</p>
      <div class="form-card">
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <div class="two-col">
          <div class="field">
            <label for="offer-price">Your price (USD)</label
            ><input id="offer-price" v-model="form.price" class="input" type="number" min="1" />
          </div>
          <div class="field">
            <label for="offer-days">Delivery time (days)</label
            ><input id="offer-days" v-model="form.days" class="input" type="number" min="1" />
          </div>
        </div>
        <div class="field">
          <label for="offer-message">Your approach</label
          ><textarea
            id="offer-message"
            v-model="form.message"
            class="input"
            rows="7"
            maxlength="1000"
            placeholder="Explain what you will deliver and how you will approach it"
          ></textarea
          ><small>{{ form.message.length }}/1000 characters</small>
        </div>
        <div class="form-actions">
          <BaseButton :disabled="mutation.isPending.value" @click="submit">Send offer ↗</BaseButton>
        </div>
      </div></template
    >
  </div>
</template>
