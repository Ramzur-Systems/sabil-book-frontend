<script setup lang="ts">
/** The 16px/600 subhead that separates lists within a screen. */
</script>

<template>
  <h2 class="sb-subhead"><slot /></h2>
</template>

<style scoped>
.sb-subhead {
  margin: 32px 0 16px;
  font-size: 16px;
  font-weight: 600;
}
.sb-subhead:first-child {
  margin-top: 0;
}
</style>
