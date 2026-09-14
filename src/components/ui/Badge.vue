<script setup lang="ts">
/** Category pill. Brass on brass-bg — the "expert domain" cue. */
defineProps<{ label: string }>()
</script>

<template>
  <span class="sb-badge">{{ label }}</span>
</template>

<style scoped>
.sb-badge {
  display: inline-block;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--brass-text);
  background: var(--brass-bg);
  border-radius: var(--radius-control);
}
</style>
