<script setup lang="ts">
/**
 * Standalone — the catch-all route sits outside SiteShell's children, so this
 * renders with no nav even for a mistyped /app/* URL. Plain, centred, no card.
 */
import Button from '@/components/ui/Button.vue'
</script>

<template>
  <div class="sb-notfound">
    <div class="sb-notfound__column">
      <h1 class="sb-notfound__title">That page doesn't exist</h1>
      <p class="sb-notfound__body">Check the address or return to your workspace.</p>
      <Button to="/app">Back to workspace</Button>
    </div>
  </div>
</template>

<style scoped>
.sb-notfound {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  background: var(--parchment);
}

.sb-notfound__column {
  max-width: 400px;
  text-align: center;
}

.sb-notfound__title {
  margin: 0 0 12px;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
}

.sb-notfound__body {
  margin: 0 0 28px;
  font-size: 14px;
  color: var(--slate);
}
</style>
