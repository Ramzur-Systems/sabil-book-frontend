<script setup lang="ts">
/**
 * Renders any backend status enum. Tone is derived from the shared map in
 * types/status.ts — never passed in ad hoc, so a new backend status shows up
 * consistently everywhere at once. The label is always text, never colour-only.
 */
import { computed } from 'vue'
import { labelFor, toneFor, type AnyStatus, type StatusTone } from '@/types/status'

const props = defineProps<{
  status: AnyStatus
  /** Escape hatch for the rare non-enum pill (e.g. AV scan state). */
  tone?: StatusTone
  label?: string
}>()

const resolvedTone = computed(() => props.tone ?? toneFor(props.status))
const resolvedLabel = computed(() => props.label ?? labelFor(props.status))
</script>

<template>
  <span class="sb-status" :class="`sb-status--${resolvedTone}`">{{ resolvedLabel }}</span>
</template>

<style scoped>
.sb-status {
  display: inline-block;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  border-radius: var(--radius-control);
  transition: background-color var(--dur-base) var(--ease-out-quart);
}

.sb-status--brass {
  color: var(--brass-text);
  background: var(--brass-bg);
}
.sb-status--green {
  color: var(--green);
  background: var(--green-bg);
}
.sb-status--red {
  color: var(--red);
  background: var(--red-bg);
}
.sb-status--slate {
  color: var(--slate);
  background: var(--slate-bg);
}
</style>
