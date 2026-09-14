<script setup lang="ts">
/** Screen title (serif) with an optional trailing action, per the mockup's row-between. */
defineProps<{ title: string; eyebrow?: string; subtitle?: string }>()
</script>

<template>
  <div class="sb-page-header">
    <div class="sb-page-header__text">
      <p v-if="eyebrow" class="sb-page-header__eyebrow">{{ eyebrow }}</p>
      <h1 class="sb-page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="sb-page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.action" class="sb-page-header__action"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.sb-page-header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.sb-page-header__eyebrow {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--slate);
}

.sb-page-header__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
}

.sb-page-header__subtitle {
  max-width: 65ch;
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--slate);
}
</style>
