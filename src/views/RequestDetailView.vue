<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { marketplace } from '../api/marketplace'
import BaseButton from '../components/BaseButton.vue'
const route = useRoute()
const id = computed(() => String(route.params.id))
const query = useQuery({
  queryKey: computed(() => ['request', id.value]),
  queryFn: () => marketplace.request(id.value),
})
</script>
<template>
  <div class="page narrow">
    <p v-if="query.isPending.value" class="loading-state">Loading request…</p>
    <p v-else-if="query.isError.value" class="error-state">This request could not be found.</p>
    <template v-else-if="query.data.value"
      ><div class="eyebrow">Open request</div>
      <div class="flex gap-2 mt-5 mb-2">
        <span class="category">{{ query.data.value.category }}</span
        ><span class="pill brass">Published</span>
      </div>
      <h1 class="detail-title">{{ query.data.value.title }}</h1>
      <div class="stats">
        <div class="stat">
          <span>Budget</span><strong>{{ query.data.value.budget }}</strong>
        </div>
        <div class="stat">
          <span>Deadline</span><strong>{{ query.data.value.days }} days left</strong>
        </div>
        <div class="stat">
          <span>Offers</span><strong>{{ query.data.value.offers }} received</strong>
        </div>
      </div>
      <div class="detail-grid">
        <div>
          <h2 class="text-3xl">The brief</h2>
          <p class="prose">{{ query.data.value.description }}</p>
          <div class="alert">Offer messages are private between each expert and the customer.</div>
        </div>
        <aside class="panel side-panel">
          <h2>Have an approach?</h2>
          <p>Tell the customer what you will deliver, your price and the time you need.</p>
          <BaseButton :to="`/requests/${id}/offer`">Submit an offer ↗</BaseButton>
        </aside>
      </div></template
    >
  </div>
</template>
