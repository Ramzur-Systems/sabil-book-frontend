<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { marketplace } from '../api/marketplace'
import { useSessionStore } from '../stores/session'

const session = useSessionStore()
const router = useRouter()
const queryClient = useQueryClient()
const form = reactive({ images: [] as File[], text: '' })
const error = ref('')
const fileNames = ref<string[]>([])
const previewUrls = ref<string[]>([])
function revokePreviews() {
  previewUrls.value.forEach((url) => URL.revokeObjectURL(url))
}
onBeforeUnmount(revokePreviews)
const mutation = useMutation({
  mutationFn: marketplace.createPost,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    await queryClient.invalidateQueries({ queryKey: ['expert-posts'] })
    await router.push('/app/profile')
  },
  onError: (reason) => {
    error.value = reason instanceof Error ? reason.message : 'Your post could not be published.'
  },
})
function choosePhotos(event: Event) {
  error.value = ''
  const files = Array.from((event.target as HTMLInputElement).files || [])
  if (!files.length) return
  if (files.some((file) => !file.type.startsWith('image/'))) {
    error.value = 'Choose an image file.'
    return
  }
  revokePreviews()
  form.images = files
  previewUrls.value = files.map((file) => URL.createObjectURL(file))
  fileNames.value = files.map((file) => file.name)
}
function submit() {
  error.value = ''
  if (!form.images.length || !form.text.trim()) {
    error.value = 'Add a photo and a short text before publishing.'
    return
  }
  mutation.mutate({ images: form.images, text: form.text })
}
</script>

<template>
  <div class="page narrow compose-page">
    <template v-if="!session.signedIn">
      <div class="eyebrow">Provider tools</div><h1>Sign in to create a post</h1>
      <p class="page-intro">Sign in with a provider account to share a post with the community.</p>
      <RouterLink to="/login" class="button">Sign in</RouterLink>
    </template>
    <template v-else-if="!session.user?.isProvider">
      <div class="eyebrow">Provider tools</div><h1>Posts are for providers</h1>
      <p class="page-intro">Only approved provider profiles can share a post with the community.</p>
      <RouterLink to="/app/providers/onboarding" class="button">Become a provider</RouterLink>
    </template>
    <template v-else>
      <div class="eyebrow">Share knowledge</div>
      <h1>Create a post</h1>
      <p class="page-intro">Pair a useful thought, note or discovery with one or more photos for the community.</p>
      <form class="post-form panel" @submit.prevent="submit">
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <div class="field">
          <label for="post-photo">Photos</label>
          <input id="post-photo" type="file" accept="image/*" multiple @change="choosePhotos" />
          <span v-if="fileNames.length" class="small-note">{{ fileNames.length }} {{ fileNames.length === 1 ? 'photo' : 'photos' }} selected</span>
        </div>
        <div class="field">
          <label for="post-text">Text</label>
          <textarea id="post-text" v-model="form.text" class="input" rows="7" maxlength="2000" placeholder="What would be useful to share?"></textarea>
          <span class="small-note">{{ form.text.length }}/2000</span>
        </div>
        <div v-if="previewUrls.length" class="post-preview">
          <img v-for="(url, index) in previewUrls" :key="url" :src="url" :alt="`Selected photo ${index + 1}`" class="post-image" />
        </div>
        <div class="form-actions"><RouterLink to="/app/profile" class="button outline">Cancel</RouterLink><button class="button" type="submit" :disabled="mutation.isPending.value">{{ mutation.isPending.value ? 'Publishing…' : 'Publish post' }}</button></div>
      </form>
    </template>
  </div>
</template>
