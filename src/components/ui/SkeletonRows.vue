<script setup lang="ts">
/** Loading placeholder shaped like the rows it replaces, so nothing jumps. */
withDefaults(defineProps<{ count?: number; height?: number }>(), { count: 3, height: 56 })
</script>

<template>
  <div class="sb-skel" role="status" aria-live="polite">
    <span class="sr-only">Loading</span>
    <div
      v-for="n in count"
      :key="n"
      class="sb-skel__row"
      :style="{ height: `${height}px` }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.sb-skel__row {
  margin-bottom: 12px;
  background: linear-gradient(90deg, var(--paper) 0%, var(--slate-bg) 50%, var(--paper) 100%);
  background-size: 300% 100%;
  border: 1px solid var(--line);
  animation: sb-shimmer 1400ms var(--ease-out-quart) infinite;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes sb-shimmer {
  to {
    background-position: -150% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sb-skel__row {
    background: var(--paper);
    animation: none;
  }
}
</style>
