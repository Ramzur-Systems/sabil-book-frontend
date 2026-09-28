<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { marketplace } from '../api/marketplace'
import { categories } from '../api/types'
import RequestRow from '../components/RequestRow.vue'
const category = ref('All categories')
const search = ref('')
const query = useQuery({ queryKey: ['requests'], queryFn: marketplace.requests })
const filtered = computed(() =>
  (query.data.value || []).filter(
    (r) =>
      (category.value === 'All categories' || r.category === category.value) &&
      `${r.title} ${r.description}`.toLowerCase().includes(search.value.toLowerCase()),
  ),
)
function clear() {
  category.value = 'All categories'
  search.value = ''
}
</script>
<template>
  <div class="page narrow">
    <div class="eyebrow">Browse the marketplace</div>
    <h1>Open requests</h1>
    <p class="page-intro">
      Find a brief that fits your expertise and offer a thoughtful way forward.
    </p>
    <div class="filter-bar">
      <div class="field">
        <label for="category-filter">Category</label
        ><select id="category-filter" v-model="category" class="input">
          <option>All categories</option>
          <option v-for="[name] in categories" :key="name">{{ name }}</option>
        </select>
      </div>
      <div class="field">
        <label for="request-search">Search</label
        ><input id="request-search" v-model="search" class="input" placeholder="Title or keyword" />
      </div>
    </div>
    <p v-if="query.isPending.value" class="loading-state">Loading requests…</p>
    <p v-else-if="query.isError.value" class="error-state">Could not load requests.</p>
    <template v-else
      ><div class="result-count" aria-live="polite">{{ filtered.length }} open requests</div>
      <div v-if="filtered.length" class="request-list">
        <RequestRow v-for="request in filtered" :key="request.id" :request="request" offer />
      </div>
      <div v-else class="empty">
        <h3>No requests match these filters</h3>
        <p>Try another category or search term.</p>
        <button class="button outline" @click="clear">Clear filters</button>
      </div></template
    >
  </div>
</template>
