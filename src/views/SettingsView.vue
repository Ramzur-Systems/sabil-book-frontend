<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { account } from '../api/account'
import { useSessionStore } from '../stores/session'
const session = useSessionStore()
const form = reactive({ name: session.user?.name || 'Demo Member', country: 'Kazakhstan' })
const feedback = ref('')
const mutation = useMutation({
  mutationFn: account.settings,
  onSuccess: () => {
    feedback.value = 'Changes saved.'
  },
})
</script>
<template>
  <div class="page narrow">
    <div class="eyebrow">Your account</div>
    <h1>Settings</h1>
    <p class="page-intro">Manage your account, provider profile and session.</p>
    <div class="stack max-w-[690px]">
      <div class="panel">
        <h2>Account</h2>
        <p v-if="feedback" class="alert" role="status">{{ feedback }}</p>
        <div class="field">
          <label for="settings-name">Full name</label
          ><input id="settings-name" v-model="form.name" class="input" />
        </div>
        <div class="field">
          <label for="settings-country">Country</label
          ><input id="settings-country" v-model="form.country" class="input" />
        </div>
        <div class="form-actions">
          <button
            class="button"
            :disabled="mutation.isPending.value"
            @click="mutation.mutate(form)"
          >
            Save changes
          </button>
        </div>
      </div>
      <div class="panel">
        <h2>Provider profile</h2>
        <p>Share your expertise and start offering useful work.</p>
        <RouterLink to="/app/providers/onboarding" class="link-arrow"
          >Become a provider ↗</RouterLink
        >
      </div>
    </div>
  </div>
</template>
