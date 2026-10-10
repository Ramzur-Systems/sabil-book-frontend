<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { marketplace } from '../api/marketplace'
import PostCarousel from '../components/PostCarousel.vue'

const postsQuery = useQuery({ queryKey: ['posts'], queryFn: marketplace.posts })
const expertsQuery = useQuery({ queryKey: ['experts'], queryFn: marketplace.experts })
const expertsByUserId = computed(
  () => new Map((expertsQuery.data.value || []).map((expert) => [expert.userId, expert])),
)
function displayDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
</script>

<template>
  <div class="page narrow">
    <div class="page-heading">
      <div>
        <div class="eyebrow">From the community</div>
        <h1>Knowledge in practice</h1>
        <p class="page-intro">Notes, discoveries and useful perspective shared by Sabil Qalam providers.</p>
      </div>
      <RouterLink to="/experts" class="button outline">Meet providers</RouterLink>
    </div>
    <p v-if="postsQuery.isPending.value" class="loading-state">Loading posts…</p>
    <p v-else-if="postsQuery.isError.value" class="error-state">Could not load posts.</p>
    <p v-else-if="!postsQuery.data.value?.length" class="empty-state">No posts have been shared yet.</p>
    <div v-else class="post-list">
      <article v-for="post in postsQuery.data.value" :key="post.id" class="post-card">
        <div class="post-body">
          <p class="post-meta">
            <RouterLink v-if="expertsByUserId.get(post.authorId)" :to="`/experts/${expertsByUserId.get(post.authorId)?.id}`">
              {{ expertsByUserId.get(post.authorId)?.name }}
            </RouterLink>
            <span v-else>Provider</span> · {{ displayDate(post.createdAt) }}
          </p>
          <p class="post-text">{{ post.text }}</p>
        </div>
        <PostCarousel :images="post.imageUrls" />
      </article>
    </div>
  </div>
</template>
