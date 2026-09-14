<script setup lang="ts">
/** Inside SiteShell. Create-or-edit provider profile, plus the KYC start action. */
import { computed, reactive, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import PageHeader from '@/components/layout/PageHeader.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import Field from '@/components/form/Field.vue'
import Button from '@/components/ui/Button.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

import { me } from '@/api/auth'
import { listCategories } from '@/api/requests'
import { getMyProviderProfile, startKyc, upsertMyProviderProfile } from '@/api/providers'
import type { OnboardingDraft } from '@/api/providers'
import { ApiError } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { KycStatus } from '@/types/entities'
import type { StatusTone } from '@/types/status'

const auth = useAuthStore()
const ui = useUiStore()
const queryClient = useQueryClient()

const profileQuery = useQuery({
  queryKey: queryKeys.providerProfile,
  queryFn: getMyProviderProfile,
})
const profileMissing = computed(() => {
  const err = profileQuery.error.value
  return err instanceof ApiError && err.status === 404
})

const categoriesQuery = useQuery({
  queryKey: queryKeys.categories,
  queryFn: listCategories,
})
const categoryList = computed(() => categoriesQuery.data.value?.results ?? [])

interface OnboardingForm {
  displayName: string
  bio: string
  categories: string[]
  payoutMethod: string
}

const form = reactive<OnboardingForm>({
  displayName: '',
  bio: '',
  categories: [],
  payoutMethod: '',
})

watch(
  profileQuery.data,
  (profile) => {
    if (!profile) return
    form.displayName = profile.displayName
    form.bio = profile.bio
    form.categories = [...profile.categories]
  },
  { immediate: true },
)

type FieldErrors = Partial<Record<keyof OnboardingForm, string>>
const fieldErrors = ref<FieldErrors>({})

function validate(): boolean {
  const next: FieldErrors = {}
  if (!form.displayName.trim()) next.displayName = 'Display name is required.'
  const bioLength = form.bio.trim().length
  if (bioLength < 80) {
    next.bio = `Write at least 80 characters — currently ${bioLength}.`
  }
  if (form.categories.length === 0) next.categories = 'Select at least one category.'
  if (!form.payoutMethod) next.payoutMethod = 'Select a payout method.'
  fieldErrors.value = next
  return Object.keys(next).length === 0
}

const upsertMutation = useMutation({
  mutationFn: (body: Partial<OnboardingDraft>) => upsertMyProviderProfile(body),
  onSuccess: async (profile) => {
    queryClient.setQueryData(queryKeys.providerProfile, profile)
    ui.notify('Provider profile saved.', 'success')
    if (!auth.isProvider) {
      try {
        const updatedUser = await me()
        auth.setUser(updatedUser)
      } catch {
        /* non-fatal — isProvider will pick up on the next session refresh */
      }
    }
  },
  onError: (error) => {
    ui.notify(error instanceof ApiError ? error.message : 'Could not save your profile.', 'danger')
  },
})

function onSubmit() {
  if (!validate()) return
  upsertMutation.mutate({
    displayName: form.displayName.trim(),
    bio: form.bio.trim(),
    categories: form.categories,
    payoutMethod: form.payoutMethod,
  })
}

const kycStatus = computed<KycStatus>(() => profileQuery.data.value?.kycStatus ?? 'not_started')
const kycDisabled = computed(
  () => kycStatus.value === 'pending' || kycStatus.value === 'verified',
)

const KYC_TONE: Record<KycStatus, StatusTone> = {
  not_started: 'slate',
  pending: 'brass',
  verified: 'green',
  rejected: 'red',
}
const KYC_LABEL: Record<KycStatus, string> = {
  not_started: 'Not started',
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
}

const kycMutation = useMutation({
  mutationFn: startKyc,
  onSuccess: (profile) => {
    queryClient.setQueryData(queryKeys.providerProfile, profile)
    ui.notify('Verification started.', 'success')
  },
  onError: (error) => {
    ui.notify(
      error instanceof ApiError ? error.message : 'Could not start verification.',
      'danger',
    )
  },
})
</script>

<template>
  <PageHeader
    title="Become a provider"
    subtitle="You bid on open customer requests with a price and delivery window. Funds are held in escrow once an order is funded, and paid out to you only after the customer accepts the delivery."
  />

  <ErrorState
    v-if="profileQuery.isError.value && !profileMissing"
    :error="profileQuery.error.value"
    @retry="profileQuery.refetch()"
  />

  <template v-else>
    <SectionHeading>Profile</SectionHeading>
    <form novalidate @submit.prevent="onSubmit">
      <Field label="Display name" required :error="fieldErrors.displayName">
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.displayName"
            type="text"
            class="sb-control"
            :aria-describedby="describedBy"
            :aria-invalid="invalid || undefined"
          />
        </template>
      </Field>

      <Field
        label="Bio"
        required
        :error="fieldErrors.bio"
        :hint="
          fieldErrors.bio
            ? undefined
            : 'This is the text customers judge you by before anything else. Minimum 80 characters.'
        "
      >
        <template #default="{ id, describedBy, invalid }">
          <textarea
            :id="id"
            v-model="form.bio"
            rows="6"
            class="sb-control"
            :aria-describedby="describedBy"
            :aria-invalid="invalid || undefined"
          />
        </template>
      </Field>

      <fieldset class="sb-fieldset">
        <legend class="sb-fieldset__legend">
          Categories<span aria-hidden="true" class="sb-fieldset__required">*</span>
        </legend>
        <p :id="'onboarding-categories-hint'" class="sb-fieldset__hint">
          Select every subject you can credibly deliver.
        </p>

        <SkeletonRows v-if="categoriesQuery.isPending.value" :count="4" :height="20" />
        <ErrorState
          v-else-if="categoriesQuery.isError.value"
          :error="categoriesQuery.error.value"
          @retry="categoriesQuery.refetch()"
        />
        <EmptyState v-else-if="categoryList.length === 0" title="No categories available yet" />
        <div v-else class="sb-checks" aria-describedby="onboarding-categories-hint">
          <label v-for="category in categoryList" :key="category.id" class="sb-check">
            <input v-model="form.categories" type="checkbox" :value="category.id" />
            <span>{{ category.name }}</span>
          </label>
        </div>

        <p v-if="fieldErrors.categories" class="sb-fieldset__error">{{ fieldErrors.categories }}</p>
      </fieldset>

      <Field label="Payout method" required :error="fieldErrors.payoutMethod">
        <template #default="{ id, describedBy, invalid }">
          <select
            :id="id"
            v-model="form.payoutMethod"
            class="sb-control"
            :aria-describedby="describedBy"
            :aria-invalid="invalid || undefined"
          >
            <option value="" disabled>Select a method</option>
            <option value="local_bank_kz">Local bank transfer (KZ)</option>
            <option value="card">Card payout</option>
          </select>
        </template>
      </Field>

      <Button type="submit" :loading="upsertMutation.isPending.value">Save profile</Button>
    </form>

    <SectionHeading>Verification</SectionHeading>
    <div class="sb-kyc">
      <StatusPill
        :status="kycStatus"
        :tone="KYC_TONE[kycStatus]"
        :label="KYC_LABEL[kycStatus]"
      />
      <Button
        variant="secondary"
        :disabled="kycDisabled"
        :loading="kycMutation.isPending.value"
        @click="kycMutation.mutate()"
      >
        Start verification
      </Button>
    </div>
  </template>
</template>

<style scoped>
.sb-fieldset {
  padding: 0;
  margin: 0 0 22px;
  border: none;
}

.sb-fieldset__legend {
  padding: 0;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--slate);
}

.sb-fieldset__required {
  color: var(--red);
}

.sb-fieldset__hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--slate);
}

.sb-fieldset__error {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--red);
}

.sb-checks {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 20px;
}

.sb-check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: var(--ink);
}

.sb-check input[type='checkbox'] {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: var(--marine);
}

@media (max-width: 480px) {
  .sb-checks {
    grid-template-columns: 1fr;
  }
}

.sb-kyc {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 20px 0 48px;
}
</style>
