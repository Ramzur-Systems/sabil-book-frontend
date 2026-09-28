<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { account } from '../api/account'
const method = ref('card')
const message = ref('')
const mutation = useMutation({
  mutationFn: () => account.pay('sample', method.value),
  onSuccess: () => {
    message.value = 'Payment is held for this order.'
  },
})
</script>
<template>
  <div class="page narrow">
    <div class="eyebrow">Secure checkout</div>
    <h1>Confirm and pay</h1>
    <div class="receipt">
      <div class="receipt-row">
        <span>Aida Nurgaliyeva · 7-day delivery</span><strong>$420</strong>
      </div>
      <div class="receipt-row"><span>Platform fee</span><strong>$21</strong></div>
      <div class="receipt-row total"><span>Total</span><span>$441</span></div>
      <h3>Payment method</h3>
      <div class="choice-grid">
        <button class="choice" :class="{ selected: method === 'card' }" @click="method = 'card'">
          <strong>Card</strong><span>Pay securely</span></button
        ><button
          class="choice"
          :class="{ selected: method === 'wallet' }"
          @click="method = 'wallet'"
        >
          <strong>Wallet</strong><span>Use your balance</span>
        </button>
      </div>
      <p class="small-note mt-5">
        Demo mode does not collect card details or transfer funds. Real payments require your
        backend and payment provider.
      </p>
      <p v-if="message" class="alert" role="status">{{ message }}</p>
      <p v-if="mutation.isError.value" class="form-error" role="alert">
        Payment could not be processed.
      </p>
      <div class="form-actions">
        <button class="button" :disabled="mutation.isPending.value" @click="mutation.mutate()">
          Confirm payment ↗
        </button>
      </div>
    </div>
  </div>
</template>
