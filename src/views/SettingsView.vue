<script setup lang="ts">
/** Inside SiteShell. Three independent sections, each with its own save action. */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery } from '@tanstack/vue-query'

import PageHeader from '@/components/layout/PageHeader.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import Field from '@/components/form/Field.vue'
import Button from '@/components/ui/Button.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import ErrorState from '@/components/ui/ErrorState.vue'

import { updateMe } from '@/api/auth'
import { getMyProviderProfile } from '@/api/providers'
import { ApiError } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { KycStatus } from '@/types/entities'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

/* ---------- Account ---------- */

interface AccountForm {
  fullName: string
  country: string
  preferredLanguage: string
}

const accountForm = reactive<AccountForm>({
  fullName: auth.user?.fullName ?? '',
  country: auth.user?.country ?? '',
  preferredLanguage: auth.user?.preferredLanguage ?? 'en',
})

type AccountFieldErrors = Partial<Record<keyof AccountForm, string>>
const accountErrors = ref<AccountFieldErrors>({})

function validateAccount(): boolean {
  const next: AccountFieldErrors = {}
  if (!accountForm.fullName.trim()) next.fullName = 'Full name is required.'
  if (!accountForm.country.trim()) next.country = 'Country is required.'
  accountErrors.value = next
  return Object.keys(next).length === 0
}

const accountMutation = useMutation({
  mutationFn: () =>
    updateMe({
      fullName: accountForm.fullName.trim(),
      country: accountForm.country.trim(),
      preferredLanguage: accountForm.preferredLanguage,
    }),
  onSuccess: (updated) => {
    auth.setUser(updated)
    ui.notify('Account details saved.', 'success')
  },
  onError: (error) => {
    ui.notify(error instanceof ApiError ? error.message : 'Could not save your details.', 'danger')
  },
})

function onAccountSubmit() {
  if (!validateAccount()) return
  accountMutation.mutate()
}

/* ---------- Provider ---------- */

const providerProfileQuery = useQuery({
  queryKey: queryKeys.providerProfile,
  queryFn: getMyProviderProfile,
  enabled: computed(() => auth.isProvider),
})

const providerKycStatus = computed<KycStatus>(
  () => providerProfileQuery.data.value?.kycStatus ?? 'not_started',
)

/* ---------- Session ---------- */

function signOut() {
  auth.clear()
  void router.push({ name: 'login' })
}
</script>

<template>
  <PageHeader title="Settings" subtitle="Manage your account, provider profile and session." />

  <SectionHeading>Account</SectionHeading>
  <form novalidate @submit.prevent="onAccountSubmit">
    <Field label="Full name" required :error="accountErrors.fullName">
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          v-model="accountForm.fullName"
          type="text"
          autocomplete="name"
          class="sb-control"
          :aria-describedby="describedBy"
          :aria-invalid="invalid || undefined"
        />
      </template>
    </Field>

    <Field label="Country" required :error="accountErrors.country">
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          v-model="accountForm.country"
          type="text"
          autocomplete="country-name"
          class="sb-control"
          :aria-describedby="describedBy"
          :aria-invalid="invalid || undefined"
        />
      </template>
    </Field>

    <Field label="Preferred language">
      <template #default="{ id, describedBy, invalid }">
        <select
          :id="id"
          v-model="accountForm.preferredLanguage"
          class="sb-control"
          :aria-describedby="describedBy"
          :aria-invalid="invalid || undefined"
        >
          <option value="en">English</option>
          <option value="ru">Russian</option>
          <option value="kk">Kazakh</option>
        </select>
      </template>
    </Field>

    <Button type="submit" :loading="accountMutation.isPending.value">Save account</Button>
  </form>

  <SectionHeading>Provider</SectionHeading>
  <template v-if="!auth.isProvider">
    <p class="sb-settings__copy">
      Sell your expertise as a provider: bid on open requests and get paid through escrow after
      the customer accepts delivery.
    </p>
    <Button variant="secondary" :to="{ name: 'provider-onboarding' }">Become a provider</Button>
  </template>
  <template v-else>
    <SkeletonRows v-if="providerProfileQuery.isPending.value" :count="1" :height="40" />
    <ErrorState
      v-else-if="providerProfileQuery.isError.value"
      :error="providerProfileQuery.error.value"
      @retry="providerProfileQuery.refetch()"
    />
    <div v-else class="sb-settings__row">
      <StatusPill :status="providerKycStatus" />
      <Button variant="secondary" :to="{ name: 'provider-onboarding' }">Edit provider profile</Button>
    </div>
  </template>

  <SectionHeading>Session</SectionHeading>
  <Button variant="secondary" @click="signOut">Sign out</Button>
</template>

<style scoped>
.sb-settings__copy {
  max-width: 60ch;
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--slate);
}

.sb-settings__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 4px 0 48px;
}
</style>
