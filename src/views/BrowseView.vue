<script setup lang="ts">
/**
 * Provider journey → Browse. The feed of published requests a provider bids on.
 * Filters live in the URL query so a filtered feed can be linked and reloaded.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LocationQueryRaw } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'

import PageHeader from '@/components/layout/PageHeader.vue'
import Field from '@/components/form/Field.vue'
import FieldRow from '@/components/form/FieldRow.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import RequestRow from '@/components/marketplace/RequestRow.vue'

import { listCategories, listRequests } from '@/api/requests'
import type { RequestListParams } from '@/api/requests'
import { queryKeys } from '@/api/queryKeys'

const route = useRoute()
const router = useRouter()

function queryString(key: string): string {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

const searchInput = ref(queryString('q'))
let searchTimer: ReturnType<typeof setTimeout> | undefined

function updateQuery(patch: Record<string, string | undefined>) {
  const next: LocationQueryRaw = { ...route.query, ...patch }
  for (const key of Object.keys(next)) {
    if (next[key] === undefined || next[key] === '') delete next[key]
  }
  void router.replace({ query: next })
}

watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (value !== queryString('q')) updateQuery({ q: value })
  }, 300)
})

watch(
  () => route.query.q,
  () => {
    const value = queryString('q')
    if (value !== searchInput.value) searchInput.value = value
  },
)

onBeforeUnmount(() => clearTimeout(searchTimer))

const categoryFilter = computed({
  get: () => queryString('category'),
  set: (value: string) => updateQuery({ category: value }),
})

const hasFilters = computed(() => Boolean(queryString('category') || queryString('q')))

function clearFilters() {
  searchInput.value = ''
  updateQuery({ category: undefined, q: undefined })
}

const params = computed<RequestListParams>(() => {
  const next: RequestListParams = { status: 'published' }
  const category = queryString('category')
  const search = queryString('q')
  if (category) next.categoryId = category
  if (search) next.search = search
  return next
})

const categoriesQuery = useQuery({
  queryKey: queryKeys.categories,
  queryFn: () => listCategories(),
  staleTime: 5 * 60_000,
})

const categories = computed(() => categoriesQuery.data.value?.results ?? [])

const categoryNames = computed(() => {
  const map = new Map<string, string>()
  for (const category of categories.value) map.set(category.id, category.name)
  return map
})

const requestsQuery = useQuery({
  queryKey: computed(() => queryKeys.requests(params.value)),
  queryFn: () => listRequests(params.value),
})

const requests = computed(() => requestsQuery.data.value?.results ?? [])

const countLabel = computed(() => {
  const total = requestsQuery.data.value?.count ?? requests.value.length
  return `${total} open ${total === 1 ? 'request' : 'requests'}`
})
</script>

<template>
  <section>
    <PageHeader title="Open requests" />

    <div class="browse-filters">
      <FieldRow>
        <Field label="Category">
          <template #default="{ id }">
            <select :id="id" v-model="categoryFilter" class="sb-control">
              <option value="">All categories</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </template>
        </Field>
        <Field label="Search">
          <template #default="{ id }">
            <input
              :id="id"
              v-model="searchInput"
              type="search"
              class="sb-control"
              placeholder="Title or keyword"
            />
          </template>
        </Field>
      </FieldRow>
    </div>

    <SkeletonRows v-if="requestsQuery.isPending.value" :count="3" :height="92" />

    <ErrorState
      v-else-if="requestsQuery.isError.value"
      :error="requestsQuery.error.value"
      title="Open requests didn't load"
      @retry="() => requestsQuery.refetch()"
    />

    <EmptyState
      v-else-if="requests.length === 0 && hasFilters"
      title="No requests match these filters"
      body="Widen the category or clear the search to see everything that is open."
    >
      <Button variant="secondary" @click="clearFilters">Clear filters</Button>
    </EmptyState>

    <EmptyState
      v-else-if="requests.length === 0"
      title="No open requests right now"
      body="Published requests appear here as customers post them."
    >
      <Button variant="secondary" :to="{ name: 'my-offers' }">Review your offers</Button>
    </EmptyState>

    <template v-else>
      <!-- The feed swaps silently 300ms after a keystroke and TanStack keeps the
           previous rows, so SkeletonRows never mounts to announce it. This count
           is the whole result summary; announced atomically it is the change. -->
      <p class="browse-count" role="status" aria-atomic="true">{{ countLabel }}</p>
      <div class="browse-feed">
        <RequestRow
          v-for="request in requests"
          :key="request.id"
          :request="request"
          :category-name="categoryNames.get(request.categoryId)"
          :title-level="2"
          action-label="Submit offer"
          :to="{ name: 'submit-offer', params: { id: request.id } }"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.browse-filters {
  padding-bottom: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.browse-count {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--slate);
  font-variant-numeric: tabular-nums;
}

.browse-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
