<script setup lang="ts">
/**
 * Label + control + optional hint/error. Owns the spacing contract for every
 * form in the product; a view should never hand-roll a label element.
 */
import { computed, useId } from 'vue'

const props = defineProps<{
  label: string
  hint?: string
  error?: string
  required?: boolean
  /** Pass through when the control inside is not a single labelable element. */
  forId?: string
}>()

const generated = useId()
const controlId = computed(() => props.forId ?? `field-${generated}`)
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(`${controlId.value}-hint`)
  if (props.error) ids.push(`${controlId.value}-error`)
  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="sb-field" :class="{ 'has-error': Boolean(error) }">
    <label class="sb-field__label" :for="controlId">
      {{ label }}
      <span v-if="required" class="sb-field__required" aria-hidden="true">*</span>
    </label>
    <slot :id="controlId" :described-by="describedBy" :invalid="Boolean(error)" />
    <p v-if="hint && !error" :id="`${controlId}-hint`" class="sb-field__hint">{{ hint }}</p>
    <p v-if="error" :id="`${controlId}-error`" class="sb-field__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.sb-field {
  margin-bottom: 22px;
}

.sb-field__label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--slate);
}

.sb-field__required {
  color: var(--red);
}

.sb-field__hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--slate);
}

.sb-field__error {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--red);
}

.sb-field.has-error :deep(.sb-control) {
  border-color: var(--red);
}
</style>
