<script setup lang="ts">
/** Outside SiteShell — same centred, hairline-only layout language as LoginView. */
import { computed, reactive, ref, useId } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { z } from 'zod'

import Field from '@/components/form/Field.vue'
import Button from '@/components/ui/Button.vue'
import { register } from '@/api/auth'
import type { Registration } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useIntentStore } from '@/stores/intent'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const intent = useIntentStore()

/**
 * Names the work waiting on the other side of this form. The draft is left in
 * the store — the view they return to consumes it.
 */
const intentLine = computed(() => {
  switch (intent.pending?.kind) {
    case 'submit-offer':
      return 'Create an account to submit your offer.'
    case 'create-request':
      return 'Create an account to publish your request.'
    default:
      return null
  }
})

/** The pending destination travels with them to the other form. */
const loginTarget = computed(() => ({ name: 'login' as const, query: { ...route.query } }))

/** Only a same-origin path is ever honoured — never an absolute or protocol-relative URL. */
function resolveNext(): string | null {
  const next = route.query.next
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    return next
  }
  return null
}

const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name.'),
  email: z.string().trim().min(1, 'Enter your email.').email('Enter a valid email address.'),
  password: z.string().min(10, 'Use at least 10 characters.'),
  country: z.string().trim().min(1, 'Enter your country.'),
  isProvider: z.boolean(),
})

type RegisterFormValues = z.infer<typeof registerSchema>
type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>

const form = reactive<RegisterFormValues>({
  fullName: '',
  email: '',
  password: '',
  country: '',
  isProvider: false,
})

const fieldErrors = ref<FieldErrors>({})
const errorMessage = ref<string | null>(null)
const providerCheckboxId = useId()

const mutation = useMutation({
  mutationFn: (body: Registration) => register(body),
  onSuccess: (session) => {
    auth.setSession(session)
    const next = resolveNext()
    if (next) {
      void router.push(next)
      return
    }
    void router.push(form.isProvider ? { name: 'provider-onboarding' } : { name: 'dashboard' })
  },
  onError: (error) => {
    errorMessage.value =
      error instanceof ApiError ? error.message : 'Something went wrong. Try again.'
  },
})

function validate(): boolean {
  const result = registerSchema.safeParse(form)
  if (result.success) {
    fieldErrors.value = {}
    return true
  }
  const next: FieldErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in next)) {
      next[key as keyof RegisterFormValues] = issue.message
    }
  }
  fieldErrors.value = next
  return false
}

function onSubmit() {
  errorMessage.value = null
  if (!validate()) return
  mutation.mutate({
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    password: form.password,
    country: form.country.trim(),
    isProvider: form.isProvider,
  })
}
</script>

<template>
  <div class="sb-auth">
    <div class="sb-auth__column">
      <RouterLink to="/" class="sb-auth__wordmark">Sabil Books</RouterLink>
      <h1 class="sb-auth__title">Create an account</h1>

      <p v-if="intentLine" class="sb-auth__intent">{{ intentLine }}</p>

      <p v-if="errorMessage" class="sb-auth__alert" role="alert">{{ errorMessage }}</p>

      <form novalidate @submit.prevent="onSubmit">
        <Field label="Full name" required :error="fieldErrors.fullName">
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.fullName"
              type="text"
              autocomplete="name"
              class="sb-control"
              :aria-describedby="describedBy"
              :aria-invalid="invalid || undefined"
            />
          </template>
        </Field>

        <Field label="Email" required :error="fieldErrors.email">
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="sb-control"
              :aria-describedby="describedBy"
              :aria-invalid="invalid || undefined"
            />
          </template>
        </Field>

        <Field
          label="Password"
          required
          :hint="fieldErrors.password ? undefined : 'At least 10 characters.'"
          :error="fieldErrors.password"
        >
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              class="sb-control"
              :aria-describedby="describedBy"
              :aria-invalid="invalid || undefined"
            />
          </template>
        </Field>

        <Field label="Country" required :error="fieldErrors.country">
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.country"
              type="text"
              autocomplete="country-name"
              class="sb-control"
              :aria-describedby="describedBy"
              :aria-invalid="invalid || undefined"
            />
          </template>
        </Field>

        <div class="sb-checkbox-row">
          <input :id="providerCheckboxId" v-model="form.isProvider" type="checkbox" class="sb-checkbox" />
          <label :for="providerCheckboxId" class="sb-checkbox-label">
            I want to sell my expertise on Sabil Books
          </label>
        </div>

        <Button type="submit" full :loading="mutation.isPending.value">Create account</Button>
      </form>

      <p class="sb-auth__foot">
        Already have an account? <RouterLink :to="loginTarget">Sign in</RouterLink>
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

.sb-checkbox-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 4px 0 24px;
}

.sb-checkbox {
  width: 17px;
  height: 17px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: var(--marine);
}

.sb-checkbox-label {
  font-size: 14px;
  color: var(--ink);
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
