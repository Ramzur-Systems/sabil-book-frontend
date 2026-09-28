<script setup lang="ts">
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>
<template>
  <a class="skip" href="#main">Skip to content</a>
  <SiteHeader />
  <main id="main"><RouterView /></main>
  <SiteFooter />
</template>
