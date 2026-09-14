<script setup lang="ts">
/**
 * Three-step request wizard. The wizard itself is local state from end to end —
 * a guest can walk all three steps, and nothing is written to the server until
 * the publish action. Publishing is the single API sequence: create (or patch,
 * if a previous attempt already created the draft) and then submit for
 * moderation, so a half-written request never reaches a provider's feed and a
 * retry never leaves a duplicate draft behind.
 */
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { z } from 'zod'
import { createRequest, listCategories, submitRequest, updateRequest } from '@/api/requests'
import type { RequestDraft } from '@/api/requests'
import { queryKeys } from '@/api/queryKeys'
import CategoryPicker from '@/components/marketplace/CategoryPicker.vue'
import Field from '@/components/form/Field.vue'
import FieldRow from '@/components/form/FieldRow.vue'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import SkeletonRows from '@/components/ui/SkeletonRows.vue'
import { useAuthStore } from '@/stores/auth'
import { useIntentStore } from '@/stores/intent'
import { useUiStore } from '@/stores/ui'
import { formatBudget, formatDate } from '@/lib/utils'

const CURRENCY = 'USD'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const auth = useAuthStore()
const intent = useIntentStore()
const ui = useUiStore()

const returnTo = route.fullPath

const STEP_TITLES = [
  'What kind of material do you need?',
  'Describe what you need',
  'Review before publishing',
] as const

const STEP_NAMES = ['Category', 'Details', 'Review'] as const

const step = ref(0)
/** Set once the server has a draft for this wizard — a retry patches it. */
const draftId = ref<string | null>(null)

const categoryId = ref<string | null>(null)
const title = ref('')
const description = ref('')
/**
 * `v-model` on `<input type="number">` hands back a number, not a string, as
 * soon as the field parses — so these hold either, and every reader coerces.
 */
const budgetMin = ref<string | number>('')
const budgetMax = ref<string | number>('')
const deadline = ref('')

/** Fields the user has left. A field shows its error once blurred or once submitted. */
const touched = ref(new Set<string>())
/** Flipped by a failed attempt on the step it belongs to. */
const categorySubmitted = ref(false)
const detailsSubmitted = ref(false)

const FIELD_IDS = {
  title: 'request-title',
  description: 'request-description',
  budgetMin: 'request-budget-min',
  budgetMax: 'request-budget-max',
  deadline: 'request-deadline',
} as const

type FieldName = keyof typeof FIELD_IDS

const FIELD_ORDER: readonly FieldName[] = [
  'title',
  'description',
  'budgetMin',
  'budgetMax',
  'deadline',
]

function touch(field: FieldName) {
  touched.value.add(field)
}

/**
 * The error summary is a snapshot of the last failed submit, not a live view:
 * it must not re-announce itself on every keystroke while the user fixes it.
 */
const summary = ref<{ id: string; message: string }[]>([])
const summaryEl = ref<HTMLElement | null>(null)
const categoryGroup = ref<HTMLElement | null>(null)

interface WizardDraft extends Record<string, unknown> {
  step: number
  categoryId: string | null
  title: string
  description: string
  budgetMin: string
  budgetMax: string
  deadline: string
}

const {
  data: categoryPage,
  isPending: categoriesPending,
  isError: categoriesFailed,
  error: categoriesError,
  refetch: refetchCategories,
} = useQuery({
  queryKey: queryKeys.categories,
  queryFn: () => listCategories(),
})

const categories = computed(() => categoryPage.value?.results ?? [])

const selectedCategory = computed(() =>
  categories.value.find((category) => category.id === categoryId.value) ?? null,
)

/** Today at local midnight — a deadline must land strictly after it. */
function endOfToday(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()
}

const categorySchema = z.object({
  categoryId: z.string().min(1, 'Choose a category to continue.'),
})

const detailsSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(10, 'Give the request a title of at least 10 characters.'),
    description: z
      .string()
      .trim()
      .min(30, 'Describe the work in at least 30 characters.'),
    budgetMin: z
      .number({ invalid_type_error: 'Enter a minimum budget.' })
      .positive('The minimum budget must be greater than 0.'),
    budgetMax: z
      .number({ invalid_type_error: 'Enter a maximum budget.' })
      .positive('The maximum budget must be greater than 0.'),
    deadline: z
      .string()
      .min(1, 'Pick a deadline.')
      .refine((value) => {
        const time = new Date(value).getTime()
        return Number.isFinite(time) && time > endOfToday()
      }, 'The deadline must be a future date.'),
  })
  .refine((values) => values.budgetMax >= values.budgetMin, {
    path: ['budgetMax'],
    message: 'The maximum budget cannot be below the minimum.',
  })

function toNumber(value: string | number): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.NaN
  const trimmed = value.trim()
  if (trimmed === '') return Number.NaN
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function collect(issues: z.ZodIssue[]): Record<string, string> {
  const next: Record<string, string> = {}
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!next[key]) next[key] = issue.message
  }
  return next
}

const detailsValues = computed(() => ({
  title: title.value,
  description: description.value,
  budgetMin: toNumber(budgetMin.value),
  budgetMax: toNumber(budgetMax.value),
  deadline: deadline.value,
}))

const detailsResult = computed(() => detailsSchema.safeParse(detailsValues.value))

/** Every rule that currently fails on step 2, regardless of what is shown yet. */
const allErrors = computed<Record<string, string>>(() =>
  detailsResult.value.success ? {} : collect(detailsResult.value.error.issues),
)

const errors = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  for (const field of FIELD_ORDER) {
    const text = allErrors.value[field]
    if (text && (detailsSubmitted.value || touched.value.has(field))) out[field] = text
  }
  return out
})

const categoryError = computed(() =>
  categorySubmitted.value && !categoryId.value ? 'Choose a category to continue.' : '',
)

function clearAttempts() {
  categorySubmitted.value = false
  detailsSubmitted.value = false
  summary.value = []
}

/** A failed step-2 submit: snapshot the problems and move focus to the summary. */
async function reportDetailsFailure() {
  detailsSubmitted.value = true
  summary.value = FIELD_ORDER.filter((field) => allErrors.value[field]).map((field) => ({
    id: FIELD_IDS[field],
    message: allErrors.value[field],
  }))
  await nextTick()
  if (summaryEl.value) {
    summaryEl.value.focus()
    return
  }
  const first = summary.value[0]
  if (first) document.getElementById(first.id)?.focus()
}

/** Step 1 has one control, so focus lands on the radiogroup's first option. */
async function reportCategoryFailure() {
  categorySubmitted.value = true
  await nextTick()
  categoryGroup.value?.querySelector('input')?.focus()
}

function draftPayload(): RequestDraft {
  return {
    title: title.value.trim(),
    description: description.value.trim(),
    categoryId: categoryId.value ?? '',
    budgetMin: toNumber(budgetMin.value),
    budgetMax: toNumber(budgetMax.value),
    currency: CURRENCY,
    deadline: deadline.value || null,
  }
}

/**
 * The whole API sequence, run once. A guest cannot call any of it, so none of
 * it happens until they are signed in and have pressed publish.
 */
const publish = useMutation({
  mutationFn: async (body: RequestDraft) => {
    const existing = draftId.value
    const saved = existing ? await updateRequest(existing, body) : await createRequest(body)
    draftId.value = saved.id
    return submitRequest(saved.id)
  },
  onSuccess: (request) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.requests({ mine: true }) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.request(request.id) })
    ui.notify('Request submitted. Providers can start bidding once it clears moderation.', 'success')
    void router.push({ name: 'request-detail', params: { id: request.id } })
  },
  onError: (error: Error) => {
    ui.notify(error.message, 'danger')
  },
})

function continueFromCategory() {
  const result = categorySchema.safeParse({ categoryId: categoryId.value ?? '' })
  if (!result.success) {
    void reportCategoryFailure()
    return
  }
  clearAttempts()
  step.value = 1
}

function continueFromDetails() {
  if (!detailsResult.value.success) {
    void reportDetailsFailure()
    return
  }
  clearAttempts()
  step.value = 2
}

function back() {
  clearAttempts()
  step.value = Math.max(0, step.value - 1)
}

/** What the intent store carries across sign-in: every step's values, and the step. */
function wizardValues(): WizardDraft {
  return {
    step: step.value,
    categoryId: categoryId.value,
    title: title.value,
    description: description.value,
    budgetMin: String(budgetMin.value),
    budgetMax: String(budgetMax.value),
    deadline: deadline.value,
  }
}

function applyDraft(draft: Record<string, unknown>) {
  if (typeof draft.categoryId === 'string') categoryId.value = draft.categoryId
  if (typeof draft.title === 'string') title.value = draft.title
  if (typeof draft.description === 'string') description.value = draft.description
  if (typeof draft.budgetMin === 'string') budgetMin.value = draft.budgetMin
  if (typeof draft.budgetMax === 'string') budgetMax.value = draft.budgetMax
  if (typeof draft.deadline === 'string') deadline.value = draft.deadline
  if (typeof draft.step === 'number' && draft.step >= 0 && draft.step <= 2) {
    step.value = draft.step
  }
}

/**
 * Publishing re-checks both earlier steps: a restored draft must not be able to
 * reach the API half-filled. An invalid step takes the user back to it.
 */
function validateAll(): boolean {
  const category = categorySchema.safeParse({ categoryId: categoryId.value ?? '' })
  if (!category.success) {
    step.value = 0
    void reportCategoryFailure()
    return false
  }
  if (!detailsResult.value.success) {
    step.value = 1
    void reportDetailsFailure()
    return false
  }
  clearAttempts()
  return true
}

function submitForReview() {
  if (!validateAll()) return

  // The commit point, and the only place sign-in is asked for.
  if (!auth.isAuthenticated) {
    intent.remember('create-request', returnTo, wizardValues())
    void router.push({ name: 'login', query: { next: returnTo } })
    return
  }

  publish.mutate(draftPayload())
}

onMounted(() => {
  const saved = intent.peek('create-request', returnTo)
  if (!saved) return
  applyDraft(saved.draft)

  if (!saved.submitOnReturn || !auth.isAuthenticated) return

  // `consume` drops the draft as it reads it, so the round trip can never
  // publish the same request twice.
  const taken = intent.consume('create-request', returnTo)
  if (!taken || !validateAll()) return
  ui.notify('You are signed in. Publishing the request you drafted.')
  publish.mutate(draftPayload())
})

const publishLabel = computed(() =>
  auth.isAuthenticated ? 'Publish request' : 'Sign in to publish',
)

const budgetSummary = computed(() =>
  formatBudget(toNumber(budgetMin.value) || 0, toNumber(budgetMax.value) || 0, CURRENCY),
)
</script>

<template>
  <section>
    <p class="sb-wizard__progress">Step {{ step + 1 }} of 3 — {{ STEP_NAMES[step] }}</p>
    <h1 class="sb-wizard__title">{{ STEP_TITLES[step] }}</h1>

    <!-- Step 1 — category -->
    <template v-if="step === 0">
      <SkeletonRows v-if="categoriesPending" :count="1" :height="92" />
      <ErrorState
        v-else-if="categoriesFailed"
        :error="categoriesError"
        title="Categories didn't load"
        @retry="refetchCategories()"
      />
      <EmptyState
        v-else-if="categories.length === 0"
        title="No categories available"
        body="Requests can't be posted until a category exists. Try again shortly."
      >
        <Button variant="secondary" @click="refetchCategories()">Reload</Button>
      </EmptyState>
      <template v-else>
        <div ref="categoryGroup">
          <CategoryPicker v-model="categoryId" :categories="categories" />
        </div>
        <p v-if="categoryError" class="sb-wizard__error" role="alert">{{ categoryError }}</p>
        <div class="sb-wizard__actions">
          <Button @click="continueFromCategory">Continue</Button>
        </div>
      </template>
    </template>

    <!-- Step 2 — details -->
    <form v-else-if="step === 1" novalidate @submit.prevent="continueFromDetails">
      <div v-if="summary.length" ref="summaryEl" class="sb-wizard__errors" role="alert" tabindex="-1">
        <h2 class="sb-wizard__errors-title">Fix these before continuing</h2>
        <ul class="sb-wizard__errors-list">
          <li v-for="item in summary" :key="item.id">
            <a :href="`#${item.id}`">{{ item.message }}</a>
          </li>
        </ul>
      </div>

      <Field label="Title" required :for-id="FIELD_IDS.title" :error="errors.title">
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="title"
            type="text"
            class="sb-control"
            autocomplete="off"
            :aria-describedby="describedBy"
            :aria-invalid="invalid || undefined"
            @blur="touch('title')"
          />
        </template>
      </Field>

      <Field
        label="Description"
        required
        :for-id="FIELD_IDS.description"
        :error="errors.description"
      >
        <template #default="{ id, describedBy, invalid }">
          <textarea
            :id="id"
            v-model="description"
            class="sb-control"
            :aria-describedby="describedBy"
            :aria-invalid="invalid || undefined"
            @blur="touch('description')"
          />
        </template>
      </Field>

      <FieldRow>
        <Field label="Budget min, $" required :for-id="FIELD_IDS.budgetMin" :error="errors.budgetMin">
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="budgetMin"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              class="sb-control"
              :aria-describedby="describedBy"
              :aria-invalid="invalid || undefined"
              @blur="touch('budgetMin')"
            />
          </template>
        </Field>
        <Field label="Budget max, $" required :for-id="FIELD_IDS.budgetMax" :error="errors.budgetMax">
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="budgetMax"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              class="sb-control"
              :aria-describedby="describedBy"
              :aria-invalid="invalid || undefined"
              @blur="touch('budgetMax')"
            />
          </template>
        </Field>
        <Field label="Deadline" required :for-id="FIELD_IDS.deadline" :error="errors.deadline">
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="deadline"
              type="date"
              class="sb-control"
              :aria-describedby="describedBy"
              :aria-invalid="invalid || undefined"
              @blur="touch('deadline')"
            />
          </template>
        </Field>
      </FieldRow>

      <div class="sb-wizard__actions">
        <Button type="submit">Continue</Button>
        <Button variant="secondary" @click="back">Back</Button>
      </div>
    </form>

    <!-- Step 3 — review -->
    <template v-else>
      <dl class="sb-review">
        <div class="sb-review__line">
          <dt>Category</dt>
          <dd>{{ selectedCategory?.name ?? '—' }}</dd>
        </div>
        <div class="sb-review__line">
          <dt>Title</dt>
          <dd class="sb-review__title">{{ title }}</dd>
        </div>
        <div class="sb-review__line">
          <dt>Description</dt>
          <dd class="sb-review__body">{{ description }}</dd>
        </div>
        <div class="sb-review__line">
          <dt>Budget</dt>
          <dd>{{ budgetSummary }}</dd>
        </div>
        <div class="sb-review__line">
          <dt>Deadline</dt>
          <dd>{{ formatDate(deadline || null) }}</dd>
        </div>
      </dl>

      <p class="sb-review__note">
        Submitting sends this request to moderation. Providers see it once it is published.
      </p>

      <p v-if="!auth.isAuthenticated" class="sb-review__gate">
        Nothing has been sent yet. Publishing needs an account — sign in and this request is
        published exactly as it reads here.
      </p>

      <div class="sb-wizard__actions">
        <Button :loading="publish.isPending.value" @click="submitForReview">{{ publishLabel }}</Button>
        <Button variant="secondary" :disabled="publish.isPending.value" @click="back">Back</Button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.sb-wizard__progress {
  margin: 0 0 20px;
  font-size: 13px;
  color: var(--slate);
}

.sb-wizard__title {
  max-width: 640px;
  margin: 0 0 24px;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
}

.sb-wizard__error {
  margin: -20px 0 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--red);
}

.sb-wizard__errors {
  max-width: 640px;
  padding: 16px 20px;
  margin: 0 0 24px;
  background: var(--red-bg);
  border: 1px solid var(--red);
}

.sb-wizard__errors:focus-visible {
  outline-offset: 0;
}

.sb-wizard__errors-title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--red-ink);
}

.sb-wizard__errors-list {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
}

.sb-wizard__errors-list li + li {
  margin-top: 4px;
}

.sb-wizard__errors-list a {
  color: var(--red-ink);
}

.sb-wizard__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-top: 8px;
}

.sb-review {
  max-width: 640px;
  margin: 0 0 24px;
  border-top: 1px solid var(--line);
}

.sb-review__line {
  display: flex;
  gap: 24px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}

.sb-review__line dt {
  flex: 0 0 140px;
  font-size: 13px;
  color: var(--slate);
}

.sb-review__line dd {
  min-width: 0;
  margin: 0;
  font-size: 15px;
  overflow-wrap: anywhere;
}

.sb-review__title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
}

.sb-review__body {
  white-space: pre-wrap;
}

.sb-review__gate {
  max-width: 60ch;
  margin: 0 0 24px;
  padding-top: 16px;
  font-size: 13px;
  color: var(--slate);
  border-top: 1px solid var(--line);
}

.sb-review__note {
  max-width: 60ch;
  margin: 0 0 24px;
  font-size: 13px;
  color: var(--slate);
}

@media (max-width: 560px) {
  .sb-review__line {
    flex-direction: column;
    gap: 4px;
  }

  .sb-review__line dt {
    flex: none;
  }
}
</style>
