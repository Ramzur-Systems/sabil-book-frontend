<script setup lang="ts">
/**
 * Outside SiteShell — a customer or provider lands here signed out, so there is
 * no nav to lean on. Centred single column, hairlines only, no card.
 */
import { computed, nextTick, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'

import Field from '@/components/form/Field.vue'
import Button from '@/components/ui/Button.vue'
import { login } from '@/api/auth'
import type { Credentials } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useIntentStore } from '@/stores/intent'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const intent = useIntentStore()

/**
 * Names the work waiting on the other side of this form, so the redirect that
 * brought them here never reads as arbitrary. The draft itself is left alone —
 * the view they return to consumes it.
 */
const intentLine = computed(() => {
  switch (intent.pending?.kind) {
    case 'submit-offer':
      return 'Sign in to submit your offer.'
    case 'create-request':
      return 'Sign in to publish your request.'
    default:
      return null
  }
})

const form = reactive({ email: '', password: '' })
const errorMessage = ref<string | null>(null)
const alertEl = ref<HTMLElement | null>(null)

/** A failed sign-in is announced and focused, so it is discoverable, not only visible. */
async function surfaceError(message: string) {
  errorMessage.value = message
  await nextTick()
  alertEl.value?.focus()
}

const mutation = useMutation({
  mutationFn: (credentials: Credentials) => login(credentials),
  onSuccess: (session) => {
    auth.setSession(session)
    void router.push(resolveNext())
  },
  onError: (error) => {
    void surfaceError(
      error instanceof ApiError ? error.message : 'Something went wrong. Try again.',
    )
  },
})

/** The pending destination travels with them to the other form. */
const registerTarget = computed(() => ({ name: 'register' as const, query: { ...route.query } }))

/** Only a same-origin path is ever honoured — never an absolute or protocol-relative URL. */
function resolveNext(): string {
  const next = route.query.next
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    return next
  }
  return '/app'
}

function onSubmit() {
  errorMessage.value = null
  mutation.mutate({ email: form.email.trim(), password: form.password })
}
</script>

<template>
  <div class="sb-auth">
    <div class="sb-auth__column">
      <RouterLink to="/" class="sb-auth__wordmark">Sabil Books</RouterLink>
      <h1 class="sb-auth__title">Sign in</h1>

      <p v-if="intentLine" class="sb-auth__intent">{{ intentLine }}</p>

      <p
        v-if="errorMessage"
        ref="alertEl"
        class="sb-auth__alert"
        role="alert"
        tabindex="-1"
      >
        {{ errorMessage }}
      </p>

      <form novalidate @submit.prevent="onSubmit">
        <Field label="Email" required>
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="sb-control"
              :aria-describedby="describedBy"
              :aria-invalid="invalid || undefined"
            />
          </template>
        </Field>

        <Field label="Password" required>
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              required
              class="sb-control"
              :aria-describedby="describedBy"
              :aria-invalid="invalid || undefined"
            />
          </template>
        </Field>

        <Button type="submit" full :loading="mutation.isPending.value">Sign in</Button>
      </form>

      <p class="sb-auth__foot">
        No account? <RouterLink :to="registerTarget">Create one</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.sb-auth {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  background: var(--parchment);
}

.sb-auth__column {
  width: 100%;
  max-width: 400px;
}

.sb-auth__wordmark {
  display: block;
  margin-bottom: 40px;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  text-align: center;
  text-decoration: none;
}

.sb-auth__title {
  margin: 0 0 28px;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
  text-align: center;
}

.sb-auth__intent {
  margin: -16px 0 24px;
  font-size: 13px;
  color: var(--slate);
  text-align: center;
}

.sb-auth__alert {
  margin: 0 0 20px;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--red);
  background: var(--red-bg);
  border: 1px solid var(--red);
}

.sb-auth__foot {
  margin: 24px 0 0;
  padding-top: 24px;
  font-size: 14px;
  color: var(--slate);
  text-align: center;
  border-top: 1px solid var(--line);
}

.sb-auth__foot a {
  color: var(--marine);
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 400px) {
  .sb-auth {
    padding: 32px 16px;
  }
}
</style>
