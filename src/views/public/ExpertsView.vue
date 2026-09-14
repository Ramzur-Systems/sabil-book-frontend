<script setup lang="ts">
/**
 * Public expert directory. The supply-side proof a visitor needs before they
 * will post anything: named people with a rating and a completed-order count,
 * listed as ledger rows rather than shopped as gig cards.
 *
 * The category filter lives in the URL query so a narrowed directory is a
 * link someone can paste to a colleague.
 */
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LocationQueryRaw } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'

import PageHeader from '@/components/layout/PageHeader.vue'
import Field from '@/components/form/Field.vue'
import Avatar from '@/components/ui/Avatar.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'

import { listProviders } from '@/api/providers'
import { listCategories } from '@/api/requests'
import { queryKeys } from '@/api/queryKeys'
import type { ProviderProfile } from '@/types/entities'

const route = useRoute()
const router = useRouter()

function queryString(key: string): string {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

const categoryFilter = computed({
  get: () => queryString('category'),
  set: (value: string) => {
    const next: LocationQueryRaw = { ...route.query, category: value }
    if (!value) delete next.category
    void router.replace({ query: next })
  },
})

const params = computed(() => {
  const categoryId = queryString('category')
  return categoryId ? { categoryId } : {}
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

const providersQuery = useQuery({
  queryKey: computed(() => queryKeys.providers(params.value)),
  queryFn: () => listProviders(params.value),
})

/** Most-delivered first: the directory is ordered by work done, not by recency. */
const experts = computed<ProviderProfile[]>(() =>
  [...(providersQuery.data.value?.results ?? [])].sort(
    (a, b) => b.completedOrders - a.completedOrders,
  ),
)

const countLabel = computed(() => {
  const total = providersQuery.data.value?.count ?? experts.value.length
  return `${total} ${total === 1 ? 'expert' : 'experts'}`
})

/** A provider with no ratings yet must not be shown as a one-star nobody. */
function ratingText(expert: ProviderProfile): string | null {
  if (expert.ratingCount === 0) return null
  const reviews = `${expert.ratingCount} ${expert.ratingCount === 1 ? 'review' : 'reviews'}`
  return `★ ${expert.ratingAvg.toFixed(1)} from ${reviews}`
}

function ordersText(expert: ProviderProfile): string {
  return expert.completedOrders === 1 ? 'completed order' : 'completed orders'
}

function categoryLabels(expert: ProviderProfile): string[] {
  return expert.categories.map((id) => categoryNames.value.get(id) ?? id)
}

/** A category id in the URL that no longer exists would silently show nothing. */
watch([categories, () => queryString('category')], ([list, selected]) => {
  if (!selected || list.length === 0) return
  if (!list.some((category) => category.id === selected)) categoryFilter.value = ''
})

function clearFilter() {
  categoryFilter.value = ''
}
</script>

<template>
  <section>
    <PageHeader
      title="Experts"
      subtitle="Everyone here has been through identity checks and delivers under escrow. Ratings come only from customers who accepted a delivery and paid for it."
    >
      <template #action>
        <Button :to="{ name: 'request-new' }">Post a request</Button>
      </template>
    </PageHeader>

    <div class="experts-filter">
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
    </div>

    <SkeletonRows v-if="providersQuery.isPending.value" :count="4" :height="132" />

    <ErrorState
      v-else-if="providersQuery.isError.value"
      :error="providersQuery.error.value"
      title="The expert directory didn't load"
      @retry="() => providersQuery.refetch()"
    />

    <EmptyState
      v-else-if="experts.length === 0 && categoryFilter"
      title="No experts in this category yet"
      body="Clear the filter to see everyone, or post the request anyway — experts from adjacent categories can still bid on it."
    >
      <Button variant="secondary" @click="clearFilter">Show all experts</Button>
    </EmptyState>

    <EmptyState
      v-else-if="experts.length === 0"
      title="No experts listed yet"
      body="Profiles appear here once an expert has passed identity checks."
    >
      <Button variant="secondary" :to="{ name: 'how-it-works' }">Read how this works</Button>
    </EmptyState>

    <template v-else>
      <p class="experts-count">{{ countLabel }}</p>

      <ul class="experts-list">
        <li v-for="expert in experts" :key="expert.id">
          <RouterLink class="expert" :to="{ name: 'expert-detail', params: { id: expert.id } }">
            <Avatar :name="expert.displayName" />

            <div class="expert__main">
              <div class="expert__head">
                <span class="expert__name">{{ expert.displayName }}</span>
                <span v-if="ratingText(expert)" class="expert__rating">
                  {{ ratingText(expert) }}
                </span>
                <span v-else class="expert__unrated">New to Sabil</span>
              </div>

              <p v-if="expert.bio" class="expert__bio">{{ expert.bio }}</p>

              <div v-if="categoryLabels(expert).length" class="expert__cats">
                <Badge v-for="name in categoryLabels(expert)" :key="name" :label="name" />
              </div>
            </div>

            <div class="expert__aside">
              <span class="expert__count">{{ expert.completedOrders }}</span>
              <span class="expert__count-label">{{ ordersText(expert) }}</span>
            </div>
          </RouterLink>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.experts-filter {
  max-width: 320px;
  margin-bottom: 8px;
}

.experts-count {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--slate);
  font-variant-numeric: tabular-nums;
}

.experts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

/* The ledger row: paper ground, warm hairline, 3px structural left bar. */
.expert {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 20px 24px;
  color: inherit;
  text-decoration: none;
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  transition: background-color var(--dur-fast) var(--ease-out-quart);
}

.expert:hover {
  background: var(--paper-tint);
}

.expert__main {
  flex: 1;
  min-width: 0;
}

.expert__head {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: baseline;
  margin-bottom: 6px;
}

.expert__name {
  font-size: 15px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.expert:hover .expert__name {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.expert__rating {
  font-size: 13px;
  color: var(--brass-text);
  font-variant-numeric: tabular-nums;
}

.expert__unrated {
  font-size: 13px;
  color: var(--slate);
}

/* Serif: this is the expert's own writing, not interface chrome. */
.expert__bio {
  display: -webkit-box;
  max-width: 60ch;
  margin: 0;
  overflow: hidden;
  font-family: var(--font-serif);
  font-size: 14px;
  line-height: 1.5;
  color: var(--slate);
  overflow-wrap: anywhere;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.expert__cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.expert__aside {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: flex-end;
  min-width: 116px;
  text-align: right;
}

.expert__count {
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.expert__count-label {
  font-size: 12px;
  color: var(--slate);
}

@media (max-width: 560px) {
  /* Narrow: the avatar keeps its place beside the name, and the order count
     drops to a meta line under the text rather than a right-hand column. */
  .expert {
    display: grid;
    grid-template-areas:
      'avatar main'
      '. aside';
    grid-template-columns: 40px 1fr;
    gap: 12px 14px;
    padding: 20px;
  }

  .expert > :first-child {
    grid-area: avatar;
  }

  .expert__main {
    grid-area: main;
  }

  .expert__aside {
    grid-area: aside;
  }

  .expert__aside {
    flex-direction: row;
    gap: 6px;
    align-items: baseline;
    min-width: 0;
    text-align: left;
  }

  .expert__count {
    font-size: 15px;
  }
}
</style>
