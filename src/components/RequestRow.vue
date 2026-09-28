<script setup lang="ts">
import type { MarketplaceRequest } from '../api/types'
import BaseButton from './BaseButton.vue'
defineProps<{ request: MarketplaceRequest; offer?: boolean }>()
</script>
<template>
  <article class="request-row">
    <div>
      <span class="category">{{ request.category }}</span>
      <h3>
        <RouterLink :to="`/requests/${request.id}`">{{ request.title }}</RouterLink>
      </h3>
      <div class="meta">
        {{ request.budget }} budget &nbsp;·&nbsp; {{ request.days }} days left &nbsp;·&nbsp;
        {{ request.offers }} offers
      </div>
    </div>
    <BaseButton
      :to="`/requests/${request.id}${offer ? '/offer' : ''}`"
      variant="outline"
      size="small"
      >{{ offer ? 'Submit offer' : 'View request' }}</BaseButton
    >
  </article>
</template>
