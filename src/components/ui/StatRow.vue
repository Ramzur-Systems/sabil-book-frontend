<script setup lang="ts">
/**
 * Hairline-divided stat strip — explicitly not a card grid. Stacks to two
 * columns below 640px and drops the vertical rules so nothing overflows at 375px.
 */
export interface Stat {
  label: string
  value: string | number
}

defineProps<{ stats: Stat[] }>()
</script>

<template>
  <dl class="sb-stats">
    <div v-for="stat in stats" :key="stat.label" class="sb-stat">
      <dt class="sb-stat__label">{{ stat.label }}</dt>
      <dd class="sb-stat__value">{{ stat.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.sb-stats {
  display: flex;
  margin: 0 0 32px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.sb-stat {
  flex: 1;
  min-width: 0;
  padding: 16px 24px 16px 0;
  border-right: 1px solid var(--line);
}
.sb-stat:first-child {
  padding-left: 0;
}
.sb-stat:last-child {
  border-right: none;
}

.sb-stat__label {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--slate);
}

.sb-stat__value {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 640px) {
  .sb-stats {
    flex-wrap: wrap;
  }
  .sb-stat {
    flex: 1 1 50%;
    padding: 14px 16px 14px 0;
    border-right: none;
  }
  .sb-stat:nth-child(n + 3) {
    border-top: 1px solid var(--line);
  }
}
</style>
