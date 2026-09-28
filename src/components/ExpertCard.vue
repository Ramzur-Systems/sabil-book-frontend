<script setup lang="ts">
import type { Expert } from '../api/types'
defineProps<{ expert: Expert }>()
</script>
<template>
  <RouterLink :to="`/experts/${expert.id}`" class="expert-card">
    <div class="expert-head">
      <span class="avatar">{{ expert.initials }}</span
      ><strong>{{ expert.name }}</strong>
    </div>
    <p>{{ expert.bio }}</p>
    <div class="tags">
      <span v-for="tag in expert.tags" :key="tag">{{ tag }}</span>
    </div>
    <div class="expert-foot">
      <span class="rating">{{ expert.reviews ? `★ ${expert.rating}` : 'New to Sabil' }}</span
      ><span>{{ expert.orders }} orders completed</span>
    </div>
  </RouterLink>
</template>
