<script setup lang="ts">
defineProps<{ error: unknown; title?: string }>()
const emit = defineEmits<{ retry: [] }>()

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong loading this. Try again.'
}
</script>

<template>
  <div class="sb-error" role="alert">
    <p class="sb-error__title">{{ title ?? "This didn't load" }}</p>
    <p class="sb-error__body">{{ messageOf(error) }}</p>
    <button type="button" class="sb-error__retry" @click="emit('retry')">Try again</button>
  </div>
</template>

<style scoped>
.sb-error {
  padding: 24px;
  background: var(--red-bg);
  border: 1px solid var(--red);
}

.sb-error__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--red);
}

.sb-error__body {
  max-width: 60ch;
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--red-ink);
}

.sb-error__retry {
  margin-top: 14px;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--red);
  background: none;
  border: none;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
</style>
