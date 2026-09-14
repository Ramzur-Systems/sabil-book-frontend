<script setup lang="ts">
/**
 * One offer in the comparison ledger — the core reverse-marketplace surface.
 * Ledger row, not a card: paper ground, warm hairline, and a 3px left bar that
 * turns marine when this offer is the accepted one.
 *
 * Every open row carries an equal-weight secondary action. That is deliberate:
 * these are parallel human bids and the product must not nudge toward one, so
 * no row gets the primary treatment. Once the request is resolved the action is
 * replaced by the offer's own status pill.
 */
import { computed } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import Button from '@/components/ui/Button.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import { formatMoney } from '@/lib/utils'
import type { Offer } from '@/types/entities'

const props = withDefaults(
  defineProps<{
    offer: Offer
    /** Marks the accepted offer: marine left bar + tinted ground. Visual only. */
    selected?: boolean
    actionLabel?: string
    busy?: boolean
    /** False once the request is resolved — the status pill takes the slot. */
    showAction?: boolean
  }>(),
  { selected: false, busy: false, showAction: true, actionLabel: 'Accept' },
)

const emit = defineEmits<{ accept: [] }>()

const providerName = computed(() => props.offer.provider?.displayName ?? 'Provider')

/** Ratings are only meaningful once someone has actually left one. */
const rating = computed(() => {
  const provider = props.offer.provider
  if (!provider || provider.ratingCount === 0) return null
  return provider.ratingAvg.toFixed(1)
})

const completedOrders = computed(() => props.offer.provider?.completedOrders ?? 0)

const deliveryText = computed(() => {
  const days = props.offer.deliveryDays
  return `Delivery in ${days} ${days === 1 ? 'day' : 'days'}`
})

const ordersText = computed(() => {
  const n = completedOrders.value
  return `${n} completed ${n === 1 ? 'order' : 'orders'}`
})

const price = computed(() => formatMoney(props.offer.price, props.offer.currency))

const accessibleAction = computed(() => `${props.actionLabel} ${providerName.value}'s offer at ${price.value}`)
</script>

<template>
  <div class="sb-ledger" :class="{ 'is-selected': selected }">
    <Avatar :name="providerName" />

    <div class="sb-ledger__main">
      <div class="sb-ledger__head">
        <span class="sb-ledger__name">{{ providerName }}</span>
        <span v-if="rating" class="sb-ledger__rating">
          <span aria-hidden="true">★</span>
          <span class="sb-ledger__sr">Rated</span>
          {{ rating }}
        </span>
      </div>

      <p v-if="offer.message" class="sb-ledger__pitch">{{ offer.message }}</p>

      <div class="sb-ledger__meta">
        <span>{{ deliveryText }}</span>
        <span>{{ ordersText }}</span>
      </div>
    </div>

    <div class="sb-ledger__aside">
      <div class="sb-ledger__price">{{ price }}</div>
      <Button
        v-if="showAction"
        variant="secondary"
        :loading="busy"
        :aria-label="accessibleAction"
        @click="emit('accept')"
      >
        {{ actionLabel }}
      </Button>
      <StatusPill v-else :status="offer.status" />
    </div>
  </div>
</template>

<style scoped>
.sb-ledger {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px 24px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  transition:
    background-color var(--dur-base) var(--ease-out-quart),
    border-left-color var(--dur-base) var(--ease-out-quart);
}

.sb-ledger.is-selected {
  background: var(--paper-tint);
  border-left-color: var(--marine);
}

.sb-ledger__main {
  flex: 1;
  min-width: 0;
}

.sb-ledger__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.sb-ledger__name {
  font-size: 15px;
  font-weight: 600;
}

.sb-ledger__rating {
  font-size: 13px;
  color: var(--brass);
  white-space: nowrap;
}

.sb-ledger__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
}

.sb-ledger__pitch {
  max-width: 520px;
  margin: 0;
  font-family: var(--font-serif);
  font-size: 14px;
  font-style: italic;
  font-weight: 400;
  line-height: 1.5;
  color: var(--slate);
  overflow-wrap: anywhere;
}

.sb-ledger__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--slate);
}

.sb-ledger__aside {
  flex-shrink: 0;
  min-width: 120px;
  text-align: right;
}

.sb-ledger__price {
  margin-bottom: 12px;
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Below 560px the aside can no longer hold a price and a button beside the
   pitch, so it stacks under the main block and reads left-to-right. */
@media (max-width: 560px) {
  .sb-ledger {
    flex-wrap: wrap;
    gap: 16px;
    padding: 20px;
  }

  .sb-ledger__aside {
    display: flex;
    flex-basis: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-width: 0;
    text-align: left;
  }

  .sb-ledger__price {
    margin-bottom: 0;
  }
}
</style>
