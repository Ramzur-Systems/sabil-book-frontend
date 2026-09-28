<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'
import BaseButton from '../components/BaseButton.vue'
const props = defineProps<{ mode: 'login' | 'register' }>()
const router = useRouter()
const session = useSessionStore()
const form = reactive({ name: '', email: '', password: '' })
const error = ref('')
const busy = ref(false)
const isMock = import.meta.env.VITE_USE_MOCKS !== 'false'
async function submit() {
  error.value = ''
  busy.value = true
  try {
    if (props.mode === 'login') await session.login(form.email, form.password)
    else await session.register(form.name, form.email, form.password)
    await router.push('/app')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not continue.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="auth">
    <div class="auth-box">
      <div class="form-card">
        <h1>{{ mode === 'login' ? 'Sign in' : 'Create an account' }}</h1>
        <p>
          {{
            mode === 'login'
              ? 'Sign in to publish your request or send an offer.'
              : 'Join a community built around useful knowledge.'
          }}
        </p>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <form @submit.prevent="submit">
          <div v-if="mode === 'register'" class="field">
            <label for="auth-name">Full name</label
            ><input id="auth-name" v-model="form.name" class="input" required />
          </div>
          <div class="field">
            <label for="auth-email">Email</label
            ><input id="auth-email" v-model="form.email" class="input" type="email" required />
          </div>
          <div class="field">
            <label for="auth-password">Password</label
            ><input
              id="auth-password"
              v-model="form.password"
              class="input"
              type="password"
              required
              minlength="8"
            />
          </div>
          <button class="button w-full mt-5" :disabled="busy" type="submit">
            {{ mode === 'login' ? 'Sign in' : 'Create account' }}
          </button>
        </form>
        <div class="auth-foot">
          {{ mode === 'login' ? 'New here?' : 'Already have an account?' }}
          <RouterLink :to="mode === 'login' ? '/register' : '/login'">{{
            mode === 'login' ? 'Create an account' : 'Sign in'
          }}</RouterLink>
        </div>
      </div>
      <p v-if="isMock" class="small-note mt-3">
        Demo mode: any email and password with 8+ characters works.
      </p>
      <BaseButton to="/" variant="text">← Back to home</BaseButton>
    </div>
  </div>
</template>
