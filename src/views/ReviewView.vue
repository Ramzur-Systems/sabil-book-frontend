<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { marketplace } from '../api/marketplace'
const stars = ref(0)
const text = ref('')
const error = ref('')
const done = ref(false)
const mutation = useMutation({
  mutationFn: () => marketplace.submitReview(stars.value, text.value),
  onSuccess: () => {
    done.value = true
  },
})
function submit() {
  if (!stars.value) {
    error.value = 'Choose a rating before submitting.'
    return
  }
  error.value = ''
  mutation.mutate()
}
</script>
<template>
  <div class="page narrow">
    <div class="eyebrow">Completed order</div>
    <h1>Rate this delivery</h1>
    <p class="page-intro">Editorial guide for a community initiative · Aida Nurgaliyeva</p>
    <div class="form-card">
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-if="mutation.isError.value" class="form-error" role="alert">
        Could not submit your review.
      </p>
      <p v-if="done" class="alert" role="status">Thank you for your review.</p>
      <label class="field">Your rating</label>
      <div class="stars" role="group" aria-label="Rating from 1 to 5">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          :class="{ on: n <= stars }"
          :aria-label="`${n} stars`"
          @click="stars = n"
        >
          ★
        </button>
      </div>
      <div class="field">
        <label for="review-text">Your review</label
        ><textarea
          id="review-text"
          v-model="text"
          class="input"
          rows="6"
          maxlength="1000"
          placeholder="What worked well?"
        ></textarea
        ><small>{{ text.length }}/1000 characters</small>
      </div>
      <div class="form-actions">
        <button class="button" :disabled="mutation.isPending.value || done" @click="submit">
          Submit review ↗
        </button>
      </div>
    </div>
  </div>
</template>
