<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { account } from '../api/account'
import BaseButton from '../components/BaseButton.vue'
const query = useQuery({ queryKey: ['dashboard'], queryFn: account.dashboard })
</script>
<template>
  <div class="page narrow">
    <div class="page-heading">
      <div>
        <div class="eyebrow">Your space</div>
        <h1>Your workspace</h1>
      </div>
      <BaseButton to="/requests/new">New request ↗</BaseButton>
    </div>
    <p v-if="query.isPending.value" class="loading-state">Loading workspace…</p>
    <p v-else-if="query.isError.value" class="error-state">Could not load your workspace.</p>
    <div v-else-if="query.data.value" class="stats">
      <div class="stat">
        <span>Awaiting offers</span><strong>{{ query.data.value.awaitingOffers }}</strong>
      </div>
      <div class="stat">
        <span>Active orders</span><strong>{{ query.data.value.activeOrders }}</strong>
      </div>
      <div class="stat">
        <span>Completed</span><strong>{{ query.data.value.completed }}</strong>
      </div>
    </div>
    <h2 class="!text-3xl mt-12">Your activity</h2>
    <div class="plain-list">
      <div class="plain-row">
        <span
          ><strong>Editorial guide for a community initiative</strong
          ><small>Under review · Process documents</small></span
        ><BaseButton to="/app/orders/sample" variant="outline" size="small">View order</BaseButton>
      </div>
      <div class="plain-row">
        <span
          ><strong>Ready to offer your expertise?</strong
          ><small>Find an open request that fits your skills.</small></span
        ><BaseButton to="/requests" variant="outline" size="small">Explore requests</BaseButton>
      </div>
    </div>
  </div>
</template>
