<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { marketplace } from '../api/marketplace'
import { categories, requestDraftSchema } from '../api/types'
import { useDraftStore } from '../stores/draft'
import BaseButton from '../components/BaseButton.vue'

const store = useDraftStore()
const router = useRouter()
const client = useQueryClient()
const error = ref('')
const mutation = useMutation({
  mutationFn: marketplace.createRequest,
  onSuccess: async (request) => {
    await client.invalidateQueries({ queryKey: ['requests'] })
    store.reset()
    await router.push(`/requests/${request.id}`)
  },
})
function next() {
  error.value = ''
  if (store.step === 1) {
    if (!store.draft.category) {
      error.value = 'Choose a category to continue.'
      return
    }
    store.step = 2
    return
  }
  const result = requestDraftSchema.safeParse(store.draft)
  if (!result.success) {
    error.value = result.error.issues[0]?.message || 'Complete all fields.'
    return
  }
  if (store.step === 2) {
    store.step = 3
    return
  }
  mutation.mutate(result.data, {
    onError: (e) => {
      error.value = e instanceof Error ? e.message : 'Could not post the request.'
    },
  })
}
</script>
<template>
  <div class="page narrow">
    <div class="eyebrow">Start with a clear brief</div>
    <h1>Post your need</h1>
    <p class="page-intro">
      Tell specialists what would help, when you need it and what you can spend.
    </p>
    <div class="form-card">
      <div class="steps">Step {{ store.step }} of 3</div>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div v-if="store.step === 1" class="choice-grid">
        <button
          v-for="[name, description] in categories"
          :key="name"
          type="button"
          class="choice"
          :class="{ selected: store.draft.category === name }"
          @click="store.draft.category = name"
        >
          <strong>{{ name }}</strong
          ><span>{{ description }}</span>
        </button>
      </div>
      <div v-else-if="store.step === 2" class="stack">
        <div class="field">
          <label for="request-title">Title</label
          ><input
            id="request-title"
            v-model="store.draft.title"
            class="input"
            placeholder="A clear title for your project"
          />
        </div>
        <div class="field">
          <label for="request-description">What do you need?</label
          ><textarea
            id="request-description"
            v-model="store.draft.description"
            class="input"
            rows="6"
            placeholder="Scope, audience, format and useful reference material"
          ></textarea>
        </div>
        <div class="two-col">
          <div class="field">
            <label for="request-budget">Budget (USD)</label
            ><input
              id="request-budget"
              v-model="store.draft.budget"
              class="input"
              type="number"
              min="1"
            />
          </div>
          <div class="field">
            <label for="request-deadline">Deadline</label
            ><input
              id="request-deadline"
              v-model="store.draft.deadline"
              class="input"
              type="date"
            />
          </div>
        </div>
      </div>
      <div v-else class="receipt">
        <h2 class="!text-3xl">Review your brief</h2>
        <div class="receipt-row">
          <span>Category</span><strong>{{ store.draft.category }}</strong>
        </div>
        <div class="receipt-row">
          <span>Title</span><strong>{{ store.draft.title }}</strong>
        </div>
        <p class="prose mt-4">{{ store.draft.description }}</p>
        <div class="receipt-row">
          <span>Budget</span><strong>${{ store.draft.budget }}</strong>
        </div>
        <div class="receipt-row">
          <span>Deadline</span><strong>{{ store.draft.deadline }}</strong>
        </div>
      </div>
      <div class="form-actions">
        <button v-if="store.step > 1" type="button" class="button outline" @click="store.step--">
          Back</button
        ><BaseButton :disabled="mutation.isPending.value" @click="next"
          >{{ store.step === 3 ? 'Publish request' : 'Continue' }} ↗</BaseButton
        >
      </div>
    </div>
  </div>
</template>
