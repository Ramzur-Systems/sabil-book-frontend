<script setup lang="ts">
/** Side-by-side fields that stack below 560px. */
</script>

<template>
  <div class="sb-field-row"><slot /></div>
</template>

<style scoped>
.sb-field-row {
  display: flex;
  gap: 20px;
}

.sb-field-row > :deep(.sb-field) {
  flex: 1;
  min-width: 0;
}

@media (max-width: 560px) {
  .sb-field-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
