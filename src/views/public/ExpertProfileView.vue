<script setup lang="ts">
/**
 * One public expert. Everything on this page is a trust signal a stranger can
 * check before they commit budget: a rating that only paying customers can
 * write, a count of deliveries that were accepted, and an identity check.
 *
 * There is no "hire" here on purpose — the mechanic is reverse: the visitor
 * posts a request and this expert bids on it.
 */
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import Avatar from '@/components/ui/Avatar.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import StarRating from '@/components/marketplace/StarRating.vue'

import { ApiError } from '@/api/client'
import { getProvider } from '@/api/providers'
import { listCategories } from '@/api/requests'
import { queryKeys } from '@/api/queryKeys'

const props = defineProps<{ id: string }>()

const providerQuery = useQuery({
  queryKey: computed(() => queryKeys.provider(props.id)),
  queryFn: () => getProvider(props.id),
  retry: (failureCount, error) =>
    !(error instanceof ApiError && error.status === 404) && failureCount < 2,
})

const categoriesQuery = useQuery({
  queryKey: queryKeys.categories,
  queryFn: () => listCategories(),
  staleTime: 5 * 60_000,
})

const expert = computed(() => providerQuery.data.value ?? null)

/** A wrong or retired id is an empty state with a way back, not an error banner. */
const isMissing = computed(() => {
  const error = providerQuery.error.value
  return error instanceof ApiError && error.status === 404
})

const categoryNames = computed(() => {
  const map = new Map<string, string>()
  for (const category of categoriesQuery.data.value?.results ?? [])
    map.set(category.id, category.name)
  return map
})

const categoryLabels = computed(() =>
  (expert.value?.categories ?? []).map((id) => categoryNames.value.get(id) ?? id),
)

const hasRating = computed(() => (expert.value?.ratingCount ?? 0) > 0)

/** Stars are whole; the exact average sits beside them as text. */
const starValue = computed(() => Math.round(expert.value?.ratingAvg ?? 0))

const ratingText = computed(() => {
  if (!expert.value || !hasRating.value) return ''
  const count = expert.value.ratingCount
  return `${expert.value.ratingAvg.toFixed(1)} from ${count} ${count === 1 ? 'review' : 'reviews'}`
})

const ordersText = computed(() => {
  const total = expert.value?.completedOrders ?? 0
  return `${total} completed ${total === 1 ? 'order' : 'orders'}`
})

const bidLine = computed(() =>
  expert.value
    ? `Post your request with a budget and a deadline. ${expert.value.displayName} can answer it with a price, a delivery date and a short pitch, alongside anyone else who wants the job. You read the offers side by side and accept one.`
    : '',
)
</script>

<template>
  <section>
    <SkeletonRows v-if="providerQuery.isPending.value" :count="3" :height="96" />

    <EmptyState
      v-else-if="isMissing"
      title="No expert at this address"
      body="The profile was removed, or the link is wrong."
    >
      <Button variant="secondary" :to="{ name: 'experts' }">Back to the directory</Button>
    </EmptyState>

    <ErrorState
      v-else-if="providerQuery.isError.value"
      :error="providerQuery.error.value"
      title="This profile didn't load"
      @retry="() => providerQuery.refetch()"
    />

    <template v-else-if="expert">
      <header class="profile__head">
        <Avatar :name="expert.displayName" />
        <div class="profile__id">
          <h1 class="profile__name">{{ expert.displayName }}</h1>
          <div class="profile__signals">
            <template v-if="hasRating">
              <StarRating :model-value="starValue" readonly />
              <span class="profile__rating">{{ ratingText }}</span>
            </template>
            <span v-else class="profile__meta">No ratings yet</span>
            <span class="profile__meta">{{ ordersText }}</span>
            <StatusPill
              v-if="expert.kycStatus === 'verified'"
              status="verified"
              label="Identity verified"
            />
          </div>
        </div>
      </header>

      <template v-if="categoryLabels.length">
        <SectionHeading>Works in</SectionHeading>
        <div class="profile__cats">
          <Badge v-for="name in categoryLabels" :key="name" :label="name" />
        </div>
      </template>

      <template v-if="expert.bio">
        <SectionHeading>In their words</SectionHeading>
        <p class="profile__bio">{{ expert.bio }}</p>
      </template>

      <SectionHeading>Working with {{ expert.displayName }}</SectionHeading>
      <div class="profile__action">
        <p class="profile__action-body">{{ bidLine }}</p>
        <Button :to="{ name: 'request-new' }">Post a request</Button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.profile__head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line);
}

.profile__id {
  min-width: 0;
}

.profile__name {
  margin: 0 0 10px;
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.profile__signals {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}

/* Read-only stars are 30px glyphs; scale them to sit on the meta line. */
.profile__signals :deep(.sb-stars) {
  font-size: 18px;
  letter-spacing: 3px;
}

.profile__rating {
  font-size: 13px;
  color: var(--brass);
  font-variant-numeric: tabular-nums;
}

.profile__meta {
  font-size: 13px;
  color: var(--slate);
  font-variant-numeric: tabular-nums;
}

.profile__cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* The expert's own writing, so it is set in the serif. */
.profile__bio {
  max-width: 65ch;
  margin: 0;
  font-family: var(--font-serif);
  font-size: 16px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.profile__action {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 32px;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: var(--paper);
  border: 1px solid var(--line);
}

.profile__action-body {
  flex: 1 1 340px;
  max-width: 60ch;
  margin: 0;
  font-size: 14px;
  color: var(--slate);
}

@media (max-width: 560px) {
  .profile__name {
    font-size: 24px;
  }

  .profile__action {
    padding: 20px;
  }
}
</style>
