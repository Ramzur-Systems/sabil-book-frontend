<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { account } from '../api/account'
const query = useQuery({ queryKey: ['my-offers'], queryFn: account.offers })
const client = useQueryClient()
const feedback = ref('')
const mutation = useMutation({
  mutationFn: account.withdrawOffer,
  onSuccess: async () => {
    feedback.value = 'Offer withdrawn.'
    await client.invalidateQueries({ queryKey: ['my-offers'] })
  },
})
</script>
<template>
  <div class="page narrow">
    <div class="eyebrow">Provider workspace</div>
    <h1>My offers</h1>
    <h2 class="!text-3xl">Active</h2>
    <p v-if="query.isPending.value" class="loading-state">Loading offers…</p>
    <p v-else-if="query.isError.value" class="error-state">Could not load offers.</p>
    <div v-else class="plain-list">
      <div v-for="offer in query.data.value" :key="offer.id" class="plain-row">
        <span
          ><strong>{{ offer.title }}</strong
          ><small>{{ offer.price }} · {{ offer.days }} days</small></span
        ><span class="flex items-center gap-3"
          ><span class="pill brass">{{ offer.status }}</span
          ><button class="button text" @click="mutation.mutate(offer.id)">Withdraw</button></span
        >
      </div>
    </div>
    <p v-if="feedback" class="alert" role="status">{{ feedback }}</p>
    <RouterLink to="/requests" class="link-arrow">Find more requests ↗</RouterLink>
  </div>
</template>
