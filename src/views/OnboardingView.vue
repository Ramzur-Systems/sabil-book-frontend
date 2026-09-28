<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { z } from 'zod'
import { account } from '../api/account'
const form = reactive({ name: '', bio: '', expertise: '' })
const schema = z.object({
  name: z.string().trim().min(2),
  bio: z.string().trim().min(20),
  expertise: z.string().min(1),
})
const error = ref('')
const done = ref(false)
const mutation = useMutation({
  mutationFn: account.onboarding,
  onSuccess: () => {
    done.value = true
  },
})
function submit() {
  const parsed = schema.safeParse(form)
  if (!parsed.success) {
    error.value = 'Add your name, a short bio (20+ characters), and an area of expertise.'
    return
  }
  error.value = ''
  mutation.mutate(parsed.data)
}
</script>
<template>
  <div class="page narrow">
    <div class="eyebrow">For experts</div>
    <h1>Become a provider</h1>
    <p class="page-intro">Build a clear profile so customers know what you can credibly deliver.</p>
    <div class="form-card">
      <h2>Your profile</h2>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-if="done" class="alert" role="status">Your profile has been submitted.</p>
      <div class="field">
        <label for="display-name">Display name</label
        ><input
          id="display-name"
          v-model="form.name"
          class="input"
          placeholder="Name customers will see"
        />
      </div>
      <div class="field">
        <label for="bio">Bio</label
        ><textarea
          id="bio"
          v-model="form.bio"
          class="input"
          rows="5"
          placeholder="Describe your experience and the work you can deliver"
        ></textarea>
      </div>
      <div class="field">
        <label for="expertise">Area of expertise</label
        ><select id="expertise" v-model="form.expertise" class="input">
          <option value="">Choose a category</option>
          <option>Research</option>
          <option>Process documents</option>
          <option>Exam preparation</option>
          <option>Training materials</option>
        </select>
      </div>
      <div class="form-actions">
        <button class="button" :disabled="mutation.isPending.value || done" @click="submit">
          Submit profile ↗
        </button>
      </div>
    </div>
  </div>
</template>
