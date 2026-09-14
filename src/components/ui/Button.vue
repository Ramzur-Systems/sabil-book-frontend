<script setup lang="ts">
/**
 * The only button in the product.
 * - primary   filled marine — the one action a region is actually for
 * - secondary marine outline — parallel, non-destructive alternatives
 * - text      underlined red — destructive / last resort ONLY ("Open a dispute").
 *             Never use it for a neutral tertiary action.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'text'
    type?: 'button' | 'submit'
    to?: RouteLocationRaw
    disabled?: boolean
    loading?: boolean
    full?: boolean
  }>(),
  { variant: 'primary', type: 'button', full: false },
)

const inert = computed(() => props.disabled || props.loading)
const tag = computed(() => (props.to && !inert.value ? RouterLink : 'button'))
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? inert : undefined"
    :aria-disabled="inert || undefined"
    :aria-busy="loading || undefined"
    class="sb-btn"
    :class="[`sb-btn--${variant}`, { 'sb-btn--full': full, 'is-inert': inert }]"
  >
    <span v-if="loading" class="sb-btn__spinner" aria-hidden="true" />
    <slot />
  </component>
</template>

<style scoped>
.sb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 9px 18px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-out-quart),
    border-color var(--dur-fast) var(--ease-out-quart),
    color var(--dur-fast) var(--ease-out-quart);
}

.sb-btn--full {
  width: 100%;
}

/*
 * A disabled control is exempt from 1.4.3, but a user still has to read what
 * they are waiting on. 0.45 measured 2.1-2.5:1; 0.6 keeps the state legible as
 * "off" while leaving the label readable.
 */
.sb-btn.is-inert {
  opacity: 0.6;
  cursor: not-allowed;
}

.sb-btn--primary {
  background: var(--marine);
  color: var(--on-dark);
}
.sb-btn--primary:hover:not(.is-inert) {
  background: var(--marine-dark);
}

.sb-btn--secondary {
  background: transparent;
  color: var(--marine);
  border-color: var(--marine);
}
.sb-btn--secondary:hover:not(.is-inert) {
  background: var(--paper-tint);
}

/*
 * Destructive last resort. Vertical padding plus the shared 44px floor give it
 * a real target - 17px tall for "Open a dispute" was a trap - while the
 * underline stays flush to the 13px label.
 */
.sb-btn--text {
  min-height: 44px;
  padding: 12px 0;
  font-size: 13px;
  color: var(--red);
  background: none;
  border: none;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.sb-btn--text:hover:not(.is-inert) {
  color: var(--red-hover);
}

.sb-btn__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: sb-spin 620ms linear infinite;
}

@keyframes sb-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sb-btn__spinner {
    animation: none;
    border-right-color: currentColor;
    opacity: 0.5;
  }
}
</style>
