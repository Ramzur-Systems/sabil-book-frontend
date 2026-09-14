<script setup lang="ts">
/**
 * Four-step escrow progress, derived from OrderStatus alone (spec §4) — never
 * from a step index handed in by a view, so two screens can never disagree
 * about where an order stands.
 *
 *   awaiting_payment  → nothing done, "Funded" is current
 *   funded            → step 0 done, "Delivered" is current
 *   delivered         → steps 0–1 done, "Under review" is current
 *   under_review      → steps 0–1 done, "Under review" is current
 *   completed         → all four done
 *
 * Interrupts (disputed / refunded / partially_resolved, and cancelled) never add
 * a fifth step: they recolour the current dot and relabel it in red.
 * Rendered as a real <ol> with aria-current="step" so the progress is readable
 * without colour.
 */
import { computed } from 'vue'
import { isInterruptStatus } from '@/types/status'
import type { OrderStatus } from '@/types/entities'

const props = defineProps<{ status: OrderStatus }>()

const STEP_LABELS = ['Funded', 'Delivered', 'Under review', 'Completed'] as const

/** Number of steps already behind us, per spec §4. */
const DONE_COUNT: Record<OrderStatus, number> = {
  awaiting_payment: 0,
  funded: 1,
  delivered: 2,
  under_review: 2,
  completed: 4,
  disputed: 2,
  refunded: 2,
  partially_resolved: 2,
  cancelled: 0,
}

const INTERRUPT_LABELS: Partial<Record<OrderStatus, string>> = {
  disputed: 'Disputed',
  refunded: 'Refunded',
  partially_resolved: 'Partially resolved',
  cancelled: 'Cancelled',
}

const interrupted = computed(() => isInterruptStatus(props.status) || props.status === 'cancelled')

const doneCount = computed(() => DONE_COUNT[props.status])

/** Null once every step is done — a finished order has no "current". */
const currentIndex = computed(() =>
  doneCount.value >= STEP_LABELS.length ? null : doneCount.value,
)

interface Step {
  label: string
  state: 'done' | 'current' | 'upcoming'
  interrupt: boolean
}

const steps = computed<Step[]>(() =>
  STEP_LABELS.map((label, index) => {
    const isCurrent = index === currentIndex.value
    const state: Step['state'] =
      index < doneCount.value ? 'done' : isCurrent ? 'current' : 'upcoming'
    const interrupt = isCurrent && interrupted.value
    return {
      label: interrupt ? (INTERRUPT_LABELS[props.status] ?? label) : label,
      state,
      interrupt,
    }
  }),
)

const STATE_TEXT: Record<Step['state'], string> = {
  done: 'completed',
  current: 'in progress',
  upcoming: 'not started',
}
</script>

<template>
  <ol class="sb-stepper">
    <li
      v-for="(step, index) in steps"
      :key="index"
      class="sb-stepper__step"
      :class="[`is-${step.state}`, { 'is-interrupt': step.interrupt }]"
      :aria-current="step.state === 'current' ? 'step' : undefined"
    >
      <span class="sb-stepper__line" aria-hidden="true" />
      <span class="sb-stepper__dot" aria-hidden="true" />
      <span class="sb-stepper__label">
        {{ step.label }}
        <span class="sb-stepper__sr">— {{ STATE_TEXT[step.state] }}</span>
      </span>
    </li>
  </ol>
</template>

<style scoped>
.sb-stepper {
  display: flex;
  margin: 8px 0 48px;
  padding: 0;
  list-style: none;
}

.sb-stepper__step {
  position: relative;
  flex: 1;
  padding-top: 14px;
}

.sb-stepper__line {
  position: absolute;
  top: 5px;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--line);
  transition: background-color var(--dur-slow) var(--ease-out-quart);
}

.sb-stepper__step:first-child .sb-stepper__line {
  left: 50%;
}

.sb-stepper__step:last-child .sb-stepper__line {
  right: 50%;
}

.sb-stepper__step.is-done .sb-stepper__line,
.sb-stepper__step.is-current .sb-stepper__line {
  background: var(--marine);
}

.sb-stepper__step.is-interrupt .sb-stepper__line {
  background: var(--red);
}

.sb-stepper__dot {
  position: absolute;
  top: 0;
  left: 50%;
  width: 12px;
  height: 12px;
  background: var(--paper);
  border: 2px solid var(--line);
  border-radius: 50%;
  transform: translateX(-50%);
  transition:
    background-color var(--dur-slow) var(--ease-out-quart),
    border-color var(--dur-slow) var(--ease-out-quart);
}

.sb-stepper__step.is-done .sb-stepper__dot {
  background: var(--green);
  border-color: var(--green);
}

.sb-stepper__step.is-current .sb-stepper__dot {
  background: var(--marine);
  border-color: var(--marine);
}

.sb-stepper__step.is-interrupt .sb-stepper__dot {
  background: var(--red);
  border-color: var(--red);
}

.sb-stepper__label {
  display: block;
  font-size: 13px;
  color: var(--slate);
  text-align: center;
  transition: color var(--dur-slow) var(--ease-out-quart);
}

.sb-stepper__step.is-current .sb-stepper__label {
  font-weight: 600;
  color: var(--ink);
}

.sb-stepper__step.is-interrupt .sb-stepper__label {
  color: var(--red);
}

.sb-stepper__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
}

/* At phone width four centred labels collide; 12px and a tighter line keep
   "Partially resolved" on two readable lines instead of overflowing. */
@media (max-width: 480px) {
  .sb-stepper__label {
    padding: 0 2px;
    font-size: 12px;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
}
</style>
