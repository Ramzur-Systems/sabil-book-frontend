<script setup lang="ts">
/**
 * One published request in the provider's Browse feed — the mockup's
 * `.request-row`. Same ledger construction as OfferLedgerRow: paper ground,
 * warm hairline, 3px left bar. The title links when `to` is given; the action
 * emits when it isn't, so the row works both as a feed item and as a plain list.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { formatBudget, timeLeft } from '@/lib/utils'
import type { RequestT } from '@/types/entities'

const props = withDefaults(
  defineProps<{
    request: RequestT
    categoryName?: string
    actionLabel?: string
    to?: RouteLocationRaw
    /**
     * Heading level for the title. Defaults to 3 because the home feed sits
     * under its own <h2> section heading; a screen whose only preceding
     * heading is the page <h1> must pass 2 so the outline never skips a level.
     */
    titleLevel?: 2 | 3 | 4
  }>(),
  { actionLabel: 'Submit offer', titleLevel: 3 },
)

const titleTag = computed(() => `h${props.titleLevel}`)

const emit = defineEmits<{ action: [] }>()

const budget = computed(() =>
  formatBudget(props.request.budgetMin, props.request.budgetMax, props.request.currency),
)

const deadline = computed(() => timeLeft(props.request.deadline))

const offersText = computed(() => {
  const n = props.request.offerCount
  if (n === 0) return 'No offers yet'
  return `${n} ${n === 1 ? 'offer' : 'offers'} so far`
})

function onAction() {
  if (!props.to) emit('action')
}
</script>

<template>
  <div class="sb-request">
    <div class="sb-request__main">
      <span v-if="categoryName" class="sb-request__cat"><Badge :label="categoryName" /></span>
      <component :is="titleTag" class="sb-request__title">
        <RouterLink v-if="to" class="sb-request__link" :to="to">{{ request.title }}</RouterLink>
        <template v-else>{{ request.title }}</template>
      </component>
      <div class="sb-request__meta">
        <span>{{ budget }}</span>
        <span>{{ deadline }}</span>
        <span>{{ offersText }}</span>
      </div>
    </div>

    <div class="sb-request__aside">
      <Button :to="to" @click="onAction">{{ actionLabel }}</Button>
    </div>
  </div>
</template>

<style scoped>
.sb-request {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 24px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  transition:
    background-color var(--dur-fast) var(--ease-out-quart),
    border-left-color var(--dur-fast) var(--ease-out-quart);
}

.sb-request:hover {
  background: var(--paper-tint);
}

/* Flex column so the badge/title margins stay uncollapsed at the mockup's
   16px + 6px, exactly as the inline-block badge behaves there. */
.sb-request__main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.sb-request__cat {
  margin-bottom: 16px;
}

.sb-request__title {
  margin: 6px 0 10px;
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.sb-request__link {
  color: inherit;
  text-decoration: none;
}

.sb-request__link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sb-request__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-size: 13px;
  color: var(--slate);
}

.sb-request__aside {
  flex-shrink: 0;
}

@media (max-width: 560px) {
  .sb-request {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  .sb-request__aside {
    width: 100%;
  }
}
</style>
