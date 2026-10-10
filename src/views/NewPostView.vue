<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { marketplace } from '../api/marketplace'
import { useSessionStore } from '../stores/session'

const session = useSessionStore()
const router = useRouter()
const queryClient = useQueryClient()
const form = reactive({ imageUrls: [] as string[], text: '' })
const error = ref('')
const fileNames = ref<string[]>([])
const mutation = useMutation({
  mutationFn: marketplace.createPost,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
    await queryClient.invalidateQueries({ queryKey: ['expert-posts', session.user?.providerId] })
    await router.push('/app/profile')
  },
  onError: (reason) => {
    error.value = reason instanceof Error ? reason.message : 'Your post could not be published.'
  },
})
async function choosePhotos(event: Event) {
  error.value = ''
  const files = Array.from((event.target as HTMLInputElement).files || [])
  if (!files.length) return
  if (files.some((file) => !file.type.startsWith('image/'))) {
    error.value = 'Choose an image file.'
    return
  }
  try {
    form.imageUrls = await Promise.all(files.map(readImage))
    fileNames.value = files.map((file) => file.name)
  } catch {
    error.value = 'One or more images could not be read.'
  }
}
function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
function submit() {
  error.value = ''
  if (!form.imageUrls.length || !form.text.trim()) {
    error.value = 'Add a photo and a short text before publishing.'
    return
  }
  mutation.mutate({ imageUrls: form.imageUrls, text: form.text })
}
</script>

<template>
  <div class="page narrow compose-page">
    <template v-if="!session.user?.isProvider">
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
        <div v-if="form.imageUrls.length" class="post-gallery post-preview" :class="`images-${Math.min(form.imageUrls.length, 3)}`">
          <img v-for="(imageUrl, index) in form.imageUrls" :key="imageUrl" :src="imageUrl" :alt="`Selected photo ${index + 1}`" class="post-image" />
        </div>
        <div class="form-actions"><RouterLink to="/app/profile" class="button outline">Cancel</RouterLink><button class="button" type="submit" :disabled="mutation.isPending.value">{{ mutation.isPending.value ? 'Publishing…' : 'Publish post' }}</button></div>
      </form>
    </template>
  </div>
</template>
