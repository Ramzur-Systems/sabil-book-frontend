<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { marketplace } from '../api/marketplace'
import ExpertCard from '../components/ExpertCard.vue'
import BaseButton from '../components/BaseButton.vue'
const query = useQuery({ queryKey: ['experts'], queryFn: marketplace.experts })
</script>
<template>
  <div class="page narrow">
    <div class="page-heading">
      <div>
        <div class="eyebrow">The community</div>
        <h1>Experts</h1>
        <p class="page-intro">
          Meet specialists with clear areas of practice. Identity checks and reviews help you make
          an informed choice.
        </p>
      </div>
      <BaseButton to="/requests/new">Post a request</BaseButton>
    </div>
    <p v-if="query.isPending.value" class="loading-state">Loading experts…</p>
    <p v-else-if="query.isError.value" class="error-state">Could not load experts.</p>
    <template v-else
      ><div class="result-count">{{ query.data.value?.length }} expert profiles</div>
      <div class="expert-list">
        <ExpertCard v-for="expert in query.data.value" :key="expert.id" :expert="expert" /></div
    ></template>
  </div>
</template>
