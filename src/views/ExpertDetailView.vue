<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { marketplace } from '../api/marketplace'
import BaseButton from '../components/BaseButton.vue'
const route = useRoute()
const id = computed(() => String(route.params.id))
const query = useQuery({
  queryKey: computed(() => ['expert', id.value]),
  queryFn: () => marketplace.expert(id.value),
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
      </div></template
    >
  </div>
</template>
