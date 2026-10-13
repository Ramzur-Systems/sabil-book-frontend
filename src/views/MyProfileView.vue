<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { marketplace } from '../api/marketplace'
import { useSessionStore } from '../stores/session'
import PostCarousel from '../components/PostCarousel.vue'
import { displayDate } from '../lib/utils'

const session = useSessionStore()
const providerId = computed(() => session.user?.providerId || '')
const profileQuery = useQuery({
  queryKey: computed(() => ['expert', providerId.value]),
  queryFn: () => marketplace.expert(providerId.value),
  enabled: computed(() => Boolean(providerId.value)),
})
const postsQuery = useQuery({
  queryKey: computed(() => ['expert-posts', providerId.value]),
  queryFn: () => marketplace.expertPosts(providerId.value),
  enabled: computed(() => Boolean(providerId.value)),
})
</script>

<template>
  <div class="page narrow">
    <template v-if="!session.signedIn">
      <div class="eyebrow">Provider profile</div>
      <h1>Sign in to view your profile</h1>
      <p class="page-intro">Sign in to see how your work and posts appear to the community.</p>
      <RouterLink to="/login" class="button">Sign in</RouterLink>
    </template>
    <template v-else-if="!session.user?.isProvider">
      <div class="eyebrow">Provider profile</div>
      <h1>Provider profile unavailable</h1>
      <p class="page-intro">Create a provider profile before sharing posts with the community.</p>
      <RouterLink to="/app/providers/onboarding" class="button">Become a provider</RouterLink>
    </template>
    <template v-else>
      <div class="page-heading">
        <div>
          <div class="eyebrow">Your public presence</div>
          <h1>{{ profileQuery.data.value?.name || 'My profile' }}</h1>
          <p class="page-intro">This is how your work and posts appear to people visiting Sabil Qalam.</p>
        </div>
        <RouterLink to="/app/posts/new" class="button">Create post</RouterLink>
      </div>
      <p v-if="profileQuery.isPending.value" class="loading-state">Loading your profile…</p>
      <template v-else-if="profileQuery.data.value">
        <section class="profile-summary panel">
          <span class="avatar !w-16 !h-16 !text-2xl">{{ profileQuery.data.value.initials }}</span>
          <div>
            <h2>{{ profileQuery.data.value.name }}</h2>
            <p>{{ profileQuery.data.value.bio }}</p>
            <div class="tags"><span v-for="tag in profileQuery.data.value.tags" :key="tag">{{ tag }}</span></div>
          </div>
        </section>
        <section class="my-posts">
          <div class="section-top compact"><div><div class="eyebrow">Your posts</div><h2>Shared knowledge</h2></div></div>
          <p v-if="postsQuery.isPending.value" class="loading-state">Loading your posts…</p>
          <p v-else-if="postsQuery.isError.value" class="error-state">Your posts could not be loaded.</p>
          <p v-else-if="!postsQuery.data.value?.length" class="empty-state">Your posts will appear here after you publish one.</p>
          <div v-else class="post-list">
            <article v-for="post in postsQuery.data.value" :key="post.id" class="post-card">
              <div class="post-body"><p class="post-meta">Published {{ displayDate(post.createdAt) }}</p><p class="post-text">{{ post.text }}</p></div>
              <PostCarousel :images="post.imageUrls" />
            </article>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>
