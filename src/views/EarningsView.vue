<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { account } from '../api/account'
const query = useQuery({ queryKey: ['earnings'], queryFn: account.earnings })
</script>
<template>
  <div class="page narrow">
    <div class="eyebrow">Provider workspace</div>
    <h1>Earnings</h1>
    <p v-if="query.isPending.value" class="loading-state">Loading earnings…</p>
    <p v-else-if="query.isError.value" class="error-state">Could not load earnings.</p>
    <template v-else-if="query.data.value"
      ><div class="stats">
        <div class="stat">
          <span>Total earned</span><strong>{{ query.data.value.total }}</strong>
        </div>
        <div class="stat">
          <span>Pending payout</span><strong>{{ query.data.value.pending }}</strong>
        </div>
        <div class="stat">
          <span>This month</span><strong>{{ query.data.value.month }}</strong>
        </div>
      </div>
      <h2 class="!text-3xl">Activity</h2>
      <div class="plain-list">
        <div v-for="entry in query.data.value.entries" :key="entry.title" class="plain-row">
          <span
            ><strong>{{ entry.title }}</strong
            ><small>{{ entry.date }}</small></span
          ><strong>{{ entry.amount }}</strong>
        </div>
      </div></template
    >
  </div>
</template>
