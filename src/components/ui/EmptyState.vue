<script setup lang="ts">
/** Hairline-bounded, no illustration, no card. States a fact and offers one way out. */
defineProps<{ title: string; body?: string }>()
</script>

<template>
  <div class="sb-empty">
    <p class="sb-empty__title">{{ title }}</p>
    <p v-if="body" class="sb-empty__body">{{ body }}</p>
    <div v-if="$slots.default" class="sb-empty__action"><slot /></div>
  </div>
</template>

<style scoped>
.sb-empty {
  padding: 40px 24px;
  text-align: center;
  background: var(--paper);
  border: 1px solid var(--line);
}

.sb-empty__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 500;
}

.sb-empty__body {
  max-width: 46ch;
  margin: 8px auto 0;
  font-size: 14px;
  color: var(--slate);
}

.sb-empty__action {
  margin-top: 20px;
}
</style>
