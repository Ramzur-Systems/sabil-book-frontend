<script setup lang="ts">
import BaseButton from '../components/BaseButton.vue'
const customer = [
  ['01', 'Describe the work', 'Set the scope, budget and deadline.'],
  ['02', 'Compare offers', 'Choose an approach, price and delivery time.'],
  ['03', 'Fund the order', 'Payment is held while the work is prepared.'],
  [
    '04',
    'Review and accept',
    'Check the file, request a correction if needed, and confirm receipt.',
  ],
]
const provider = [
  ['01', 'Find a request', 'Choose work that fits your expertise.'],
  ['02', 'Send an offer', 'Explain your approach, price and delivery time.'],
  ['03', 'Deliver the work', 'Share the finished material with the customer.'],
  ['04', 'Get paid', 'Payment is released after the customer accepts.'],
]
</script>
<template>
  <div class="page narrow">
    <div class="eyebrow">A clear process</div>
    <h1>How Sabil Qalam works</h1>
    <p class="page-intro">
      A customer starts with a need. An expert offers a way to meet it. The platform keeps the
      agreement and payment clear for both sides.
    </p>
    <section class="section !pb-10">
      <h2>If you need something written</h2>
      <div class="process-grid">
        <div v-for="item in customer" :key="item[0]" class="process">
          <div class="steps">{{ item[0] }}</div>
          <h3>{{ item[1] }}</h3>
          <p>{{ item[2] }}</p>
        </div>
      </div>
    </section>
    <section class="section !pt-5">
      <h2>If you create useful material</h2>
      <div class="process-grid">
        <div v-for="item in provider" :key="item[0]" class="process">
          <div class="steps">{{ item[0] }}</div>
          <h3>{{ item[1] }}</h3>
          <p>{{ item[2] }}</p>
        </div>
      </div>
    </section>
    <div class="panel">
      <h2>Questions about payment or a dispute?</h2>
      <p>
        The agreement, payment status and files should remain visible to both sides. The backend
        must enforce the actual escrow and dispute rules before launch.
      </p>
      <BaseButton to="/requests/new">Post a request ↗</BaseButton>
    </div>
  </div>
</template>
