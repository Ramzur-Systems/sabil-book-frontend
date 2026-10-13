<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { marketplace } from '../api/marketplace'
import BaseButton from '../components/BaseButton.vue'
import PostCarousel from '../components/PostCarousel.vue'
import { displayDate } from '../lib/utils'
const route = useRoute()
const id = computed(() => String(route.params.id))
const query = useQuery({
  queryKey: computed(() => ['expert', id.value]),
  queryFn: () => marketplace.expert(id.value),
})
const postsQuery = useQuery({
  queryKey: computed(() => ['expert-posts', id.value]),
  queryFn: () => marketplace.expertPosts(id.value),
})
</script>
<template>
  <div class="page narrow">
    <p v-if="query.isPending.value" class="loading-state">Loading expert…</p>
    <p v-else-if="query.isError.value" class="error-state">This expert could not be found.</p>
    <template v-else-if="query.data.value"
      ><div class="eyebrow">Expert profile</div>
      <div class="expert-head my-7">
        <span class="avatar !w-20 !h-20 !text-3xl">{{ query.data.value.initials }}</span>
        <div>
          <h1 class="!m-0">{{ query.data.value.name }}</h1>
          <div class="meta">
            {{
              query.data.value.reviews
                ? `★ ${query.data.value.rating} · ${query.data.value.reviews} reviews`
                : 'No ratings yet'
            }}
            · {{ query.data.value.orders }} orders completed
          </div>
        </div>
      </div>
      <div class="detail-grid">
        <div>
          <h2 class="text-3xl">About</h2>
          <p class="prose">{{ query.data.value.bio }}</p>
          <div class="tags">
            <span v-for="tag in query.data.value.tags" :key="tag">{{ tag }}</span>
          </div>
        </div>
        <aside class="panel side-panel">
          <h2>Start with your need</h2>
          <p>Publish a clear request so experts can offer an approach and price.</p>
          <BaseButton to="/requests/new">Post a request ↗</BaseButton>
        </aside>
      </div>
      <section class="expert-posts">
        <div class="eyebrow">From {{ query.data.value.name.split(' ')[0] }}</div>
        <h2 class="text-3xl">Recent posts</h2>
        <p v-if="postsQuery.isPending.value" class="loading-state">Loading posts…</p>
        <p v-else-if="postsQuery.isError.value" class="error-state">Posts could not be loaded.</p>
        <p v-else-if="!postsQuery.data.value?.length" class="meta">No posts shared yet.</p>
        <div v-else class="post-list">
          <article v-for="post in postsQuery.data.value" :key="post.id" class="post-card">
            <div class="post-body"><p class="post-meta">{{ displayDate(post.createdAt) }}</p><p class="post-text">{{ post.text }}</p></div>
            <PostCarousel :images="post.imageUrls" />
          </article>
        </div>
      </section></template
    >
  </div>
</template>
