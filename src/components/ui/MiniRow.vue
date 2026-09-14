<script setup lang="ts">
/**
 * Compact list row: title + meta, trailing status or action. Flat — a
 * hairline underline, no border box. Optional `to` makes the whole row a link
 * while keeping the trailing slot independently clickable.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  title: string
  meta?: string
  to?: RouteLocationRaw
}>()

const titleTag = computed(() => (props.to ? RouterLink : 'span'))
</script>

<template>
  <div class="sb-mini">
    <div class="sb-mini__main">
      <component :is="titleTag" :to="to" class="sb-mini__title">{{ title }}</component>
      <p v-if="meta" class="sb-mini__meta">{{ meta }}</p>
    </div>
    <div class="sb-mini__aside">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sb-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}
.sb-mini:last-child {
  border-bottom: none;
}

.sb-mini__main {
  min-width: 0;
}

.sb-mini__title {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  text-decoration: none;
}
a.sb-mini__title:hover {
  color: var(--marine);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sb-mini__meta {
  margin: 3px 0 0;
  font-size: 13px;
  color: var(--slate);
}

.sb-mini__aside {
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .sb-mini {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
