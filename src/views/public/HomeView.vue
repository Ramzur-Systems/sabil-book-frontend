<script setup lang="ts">
/**
 * Public home. The first thing a stranger sees, and it has to answer two
 * different questions from one column:
 *
 *   a customer asks  "who is going to write this, and is my money safe?"
 *   a provider asks  "is there paid work here right now?"
 *
 * Both answers are fetched, never asserted: the open feed is the proof of
 * demand, the expert roster is the proof of supply, and the escrow sequence
 * sits between them because that is the objection a customer raises after
 * seeing activity and before reading a name.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'

import Avatar from '@/components/ui/Avatar.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import RequestRow from '@/components/marketplace/RequestRow.vue'

import { listCategories, listRequests } from '@/api/requests'
import type { RequestListParams } from '@/api/requests'
import { listProviders } from '@/api/providers'
import { queryKeys } from '@/api/queryKeys'
import type { ProviderProfile } from '@/types/entities'

/** Six is the ceiling the motion rule allows for a stagger; five reads calmer. */
const FEED_SIZE = 5
const ROSTER_SIZE = 6
const STAGGER_STEP_MS = 60

const openParams: RequestListParams = { status: 'published' }

const categoriesQuery = useQuery({
  queryKey: queryKeys.categories,
  queryFn: () => listCategories(),
  staleTime: 5 * 60_000,
})

const categoryNames = computed(() => {
  const map = new Map<string, string>()
  for (const category of categoriesQuery.data.value?.results ?? []) {
    map.set(category.id, category.name)
  }
  return map
})

const requestsQuery = useQuery({
  queryKey: queryKeys.requests(openParams),
  queryFn: () => listRequests(openParams),
})

const openRequests = computed(() => requestsQuery.data.value?.results ?? [])
const openFeed = computed(() => openRequests.value.slice(0, FEED_SIZE))
const openCount = computed(() => requestsQuery.data.value?.count ?? openRequests.value.length)

const feedLinkLabel = computed(() =>
  openCount.value > openFeed.value.length
    ? `All ${openCount.value} open requests`
    : 'All open requests',
)

const providersQuery = useQuery({
  queryKey: queryKeys.providers(),
  queryFn: () => listProviders(),
  staleTime: 5 * 60_000,
})

const providers = computed(() => providersQuery.data.value?.results ?? [])
const roster = computed(() => providers.value.slice(0, ROSTER_SIZE))
const providerCount = computed(() => providersQuery.data.value?.count ?? providers.value.length)

/** Derived from what was fetched. If the roster is empty the line is not rendered. */
const rosterSummary = computed(() => {
  const people = providerCount.value
  const orders = providers.value.reduce((total, person) => total + person.completedOrders, 0)
  const peopleText = `${people} ${people === 1 ? 'expert' : 'experts'} listed`
  if (orders === 0) return `${peopleText}. No orders completed yet.`
  return `${peopleText}. ${orders} ${orders === 1 ? 'order' : 'orders'} completed between them.`
})

function ratingText(person: ProviderProfile): string {
  if (person.ratingCount === 0) return 'No ratings yet'
  return `${person.ratingAvg.toFixed(1)} from ${person.ratingCount} ${person.ratingCount === 1 ? 'review' : 'reviews'}`
}

function ordersText(person: ProviderProfile): string {
  const n = person.completedOrders
  if (n === 0) return 'No completed orders'
  return `${n} ${n === 1 ? 'order' : 'orders'} completed`
}

function categoriesOf(person: ProviderProfile): string[] {
  return person.categories
    .map((id) => categoryNames.value.get(id))
    .filter((name): name is string => Boolean(name))
}

/** Stagger only stages the feed; the delay is inert under reduced motion. */
function rowDelay(index: number): string {
  return `${index * STAGGER_STEP_MS}ms`
}

interface EscrowStep {
  title: string
  body: string
}

const escrowSteps: EscrowStep[] = [
  {
    title: 'You accept an offer and fund it',
    body: 'The agreed price plus the platform fee leaves your account and is held by Sabil Books. The expert can see the work is funded. They cannot draw on it.',
  },
  {
    title: 'The expert writes and delivers',
    body: 'The file is uploaded against the order. The money has still not moved, and the order shows exactly where it is sitting.',
  },
  {
    title: 'You have a review window',
    body: 'Inside that window you accept the delivery, ask for a correction, or open a dispute. A dispute keeps the money held until it is settled.',
  },
  {
    title: 'The expert is paid',
    body: 'Acceptance releases the held amount as a payout. Until you accept, the money is still yours.',
  },
]
</script>

<template>
  <div class="home">
    <section class="home-open" aria-labelledby="home-title">
      <h1 id="home-title" class="home-title">
        You write down the document you need. Experts bid for the work.
      </h1>
      <p class="home-lede">
        Sabil Books is a reverse marketplace for written material — research briefs, process
        documents, exam preparation. You post the need and the budget. Subject-matter experts read
        it and send back a price, a delivery date and a short case for themselves. You compare those
        offers side by side, accept one, and the money is held in escrow until the file is in your
        hands.
      </p>

      <div class="home-act">
        <Button :to="{ name: 'request-new' }">Post a request</Button>
      </div>

      <p class="home-aside">
        Write this kind of material for a living?
        <RouterLink class="home-link" :to="{ name: 'browse' }">Find work</RouterLink>.
      </p>
    </section>

    <section class="home-section" aria-labelledby="home-feed">
      <div class="home-section__head">
        <h2 id="home-feed" class="home-h2">Open right now</h2>
        <p class="home-section__note">
          Requests customers have posted and are waiting on. Anyone can read them.
        </p>
      </div>

      <SkeletonRows v-if="requestsQuery.isPending.value" :count="3" :height="122" />

      <ErrorState
        v-else-if="requestsQuery.isError.value"
        :error="requestsQuery.error.value"
        title="The open feed didn't load"
        @retry="() => requestsQuery.refetch()"
      />

      <EmptyState
        v-else-if="openFeed.length === 0"
        title="Nothing is open at this moment"
        body="Every request here is posted by a named customer with a budget attached, so the feed empties as fast as it fills. Post one and experts will see it."
      >
        <Button :to="{ name: 'request-new' }">Post a request</Button>
      </EmptyState>

      <template v-else>
        <ul class="home-feed">
          <li
            v-for="(request, index) in openFeed"
            :key="request.id"
            class="home-feed__item"
            :style="{ animationDelay: rowDelay(index) }"
          >
            <RequestRow
              :request="request"
              :category-name="categoryNames.get(request.categoryId)"
              action-label="View request"
              :to="{ name: 'request-detail', params: { id: request.id } }"
            />
          </li>
        </ul>
        <p class="home-more">
          <RouterLink class="home-link" :to="{ name: 'browse' }">{{ feedLinkLabel }}</RouterLink>
        </p>
      </template>
    </section>

    <section class="home-section" aria-labelledby="home-escrow">
      <div class="home-section__head">
        <h2 id="home-escrow" class="home-h2">How the money moves</h2>
        <p class="home-section__note">
          Four points, in order. At every one of them you can say where your money is.
        </p>
      </div>

      <ol class="home-escrow">
        <li v-for="step in escrowSteps" :key="step.title" class="home-escrow__step">
          <h3 class="home-escrow__title">{{ step.title }}</h3>
          <p class="home-escrow__body">{{ step.body }}</p>
        </li>
      </ol>

      <p class="home-more">
        <RouterLink class="home-link" :to="{ name: 'how-it-works' }">
          Fees, timings and what happens in a dispute
        </RouterLink>
      </p>
    </section>

    <section class="home-section" aria-labelledby="home-people">
      <div class="home-section__head">
        <h2 id="home-people" class="home-h2">The people who write it</h2>
        <p v-if="providers.length > 0" class="home-section__note home-section__note--figure">
          {{ rosterSummary }}
        </p>
        <p v-else class="home-section__note">
          Every expert is a named account with a verified payout identity.
        </p>
      </div>

      <SkeletonRows v-if="providersQuery.isPending.value" :count="3" :height="76" />

      <ErrorState
        v-else-if="providersQuery.isError.value"
        :error="providersQuery.error.value"
        title="The expert roster didn't load"
        @retry="() => providersQuery.refetch()"
      />

      <EmptyState
        v-else-if="roster.length === 0"
        title="No experts have been listed yet"
        body="Providers are verified before they can be paid, so the roster grows slowly and on purpose. If you sell written work, you can be on it."
      >
        <Button variant="secondary" :to="{ name: 'register' }">Create an account</Button>
      </EmptyState>

      <template v-else>
        <ul class="home-roster">
          <li v-for="person in roster" :key="person.id" class="home-person">
            <Avatar :name="person.displayName" />

            <div class="home-person__main">
              <RouterLink
                class="home-person__name"
                :to="{ name: 'expert-detail', params: { id: person.id } }"
              >
                {{ person.displayName }}
              </RouterLink>
              <p class="home-person__bio">{{ person.bio }}</p>
              <div v-if="categoriesOf(person).length > 0" class="home-person__cats">
                <Badge v-for="name in categoriesOf(person)" :key="name" :label="name" />
              </div>
            </div>

            <div class="home-person__record">
              <span class="home-person__rating" :class="{ 'is-unrated': person.ratingCount === 0 }">
                <span v-if="person.ratingCount > 0" aria-hidden="true">★</span>
                <span>{{ ratingText(person) }}</span>
              </span>
              <span class="home-person__orders">{{ ordersText(person) }}</span>
            </div>
          </li>
        </ul>

        <p v-if="providerCount > roster.length" class="home-more">
          <RouterLink class="home-link" :to="{ name: 'experts' }">
            All {{ providerCount }} experts
          </RouterLink>
        </p>
      </template>
    </section>

    <section class="home-close" aria-labelledby="home-close-title">
      <h2 id="home-close-title" class="home-close__line">
        Post the need. Read what comes back. Pay for the one you accept.
      </h2>
      <Button :to="{ name: 'request-new' }">Post a request</Button>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding-top: 8px;
}

/* ---------------------------------------------------------------- opening */

.home-title {
  max-width: 22ch;
  margin: 0 0 24px;
  font-family: var(--font-serif);
  font-size: clamp(30px, 4.4vw, 46px);
  font-weight: 500;
  line-height: 1.14;
  letter-spacing: -0.4px;
}

.home-lede {
  max-width: 62ch;
  margin: 0 0 32px;
  font-size: 17px;
  line-height: 1.62;
  color: var(--slate);
}

.home-act {
  margin-bottom: 16px;
}

.home-aside {
  margin: 0;
  font-size: 14px;
  color: var(--slate);
}

.home-link {
  font-weight: 500;
  color: var(--marine);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.home-link:hover {
  color: var(--marine-dark);
}

/* ---------------------------------------------------------------- sections */

.home-section {
  padding-top: 40px;
  margin-top: 56px;
  border-top: 1px solid var(--line);
}

.home-section__head {
  margin-bottom: 24px;
}

.home-h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
}

.home-section__note {
  max-width: 58ch;
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--slate);
}

.home-section__note--figure {
  font-variant-numeric: tabular-nums;
}

.home-more {
  margin: 20px 0 0;
  font-size: 14px;
}

/* -------------------------------------------------------------- open feed */

.home-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

/* Staged in CSS, not by a JS class: the rows exist and are laid out whether or
   not the animation ever runs, so a headless render is never blank. */
.home-feed__item {
  animation: home-rise var(--dur-slow) var(--ease-out-quart) backwards;
}

@keyframes home-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-feed__item {
    animation: none;
  }
}

/* ----------------------------------------------------------------- escrow */

.home-escrow {
  padding: 0 24px;
  margin: 0;
  list-style: none;
  counter-reset: home-step;
  background: var(--paper);
  border: 1px solid var(--line);
}

.home-escrow__step {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 0 14px;
  padding: 20px 0;
  border-top: 1px solid var(--line);
  counter-increment: home-step;
}
.home-escrow__step:first-child {
  border-top: none;
}

.home-escrow__step::before {
  content: counter(home-step);
  grid-row: 1 / span 2;
  padding-top: 1px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--slate);
  font-variant-numeric: tabular-nums;
}

.home-escrow__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.home-escrow__body {
  max-width: 62ch;
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--slate);
}

/* ----------------------------------------------------------------- roster */

.home-roster {
  padding: 0;
  margin: 0;
  list-style: none;
  border-top: 1px solid var(--line);
}

.home-person {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  gap: 0 16px;
  align-items: start;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}

.home-person__main {
  min-width: 0;
}

.home-person__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
}
.home-person__name:hover {
  color: var(--marine);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.home-person__bio {
  max-width: 56ch;
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--slate);
  overflow-wrap: anywhere;
}

.home-person__cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.home-person__record {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  font-size: 13px;
  color: var(--slate);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.home-person__rating {
  display: inline-flex;
  gap: 5px;
  align-items: baseline;
  font-weight: 500;
  color: var(--brass);
}

/* No rating is a fact about the account, not a brass credential. */
.home-person__rating.is-unrated {
  font-weight: 400;
  color: var(--slate);
}

.home-person__orders {
  white-space: nowrap;
}

/* ----------------------------------------------------------------- close */

.home-close {
  padding-top: 40px;
  margin-top: 56px;
  border-top: 1px solid var(--line);
}

.home-close__line {
  max-width: 24ch;
  margin: 0 0 24px;
  font-family: var(--font-serif);
  font-size: clamp(22px, 3.4vw, 30px);
  font-weight: 500;
  line-height: 1.25;
}

/* ------------------------------------------------------------ responsive */

@media (max-width: 640px) {
  .home-title {
    max-width: none;
    letter-spacing: -0.2px;
  }

  .home-lede {
    font-size: 16px;
  }

  .home-section,
  .home-close {
    padding-top: 32px;
    margin-top: 44px;
  }

  .home-escrow {
    padding: 0 18px;
  }

  .home-person {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .home-person__record {
    grid-column: 2;
    align-items: flex-start;
    margin-top: 10px;
    text-align: left;
  }
}
</style>
