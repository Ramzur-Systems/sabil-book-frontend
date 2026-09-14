<script setup lang="ts">
/**
 * One option in a single-choice group — the mockup's `.cat-card` and `.pay-method`.
 * Real radio semantics: a visually hidden native <input type="radio"> inside its
 * <label>, so arrow-key roving, form participation and screen-reader grouping all
 * come from the platform rather than from JS on a clickable div.
 *
 * Selected state is the system's one sanctioned heavy side border: a 3px marine
 * bar on the left edge, plus the paper-tint ground.
 */
import { computed, useId } from 'vue'

const props = defineProps<{
  modelValue: string
  value: string
  label: string
  description?: string
  name: string
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const inputId = useId()
const selected = computed(() => props.modelValue === props.value)
</script>

<template>
  <label class="sb-selectable" :class="{ 'is-selected': selected, 'is-compact': !description }">
    <input
      :id="inputId"
      class="sb-selectable__input"
      type="radio"
      :name="name"
      :value="value"
      :checked="selected"
      @change="emit('update:modelValue', value)"
    />
    <span class="sb-selectable__label">{{ label }}</span>
    <span v-if="description" class="sb-selectable__desc">{{ description }}</span>
  </label>
</template>

<style scoped>
.sb-selectable {
  position: relative;
  display: block;
  padding: 16px;
  background: var(--paper);
  border: 1px solid var(--line);
  cursor: pointer;
  transition:
    background-color var(--dur-base) var(--ease-out-quart),
    border-color var(--dur-base) var(--ease-out-quart);
}

/* No description → the checkout pay-method shape: tighter, centred. */
.sb-selectable.is-compact {
  padding: 14px;
  text-align: center;
}

.sb-selectable:hover {
  background: var(--paper-tint);
}

.sb-selectable.is-selected {
  background: var(--paper-tint);
  border-color: var(--marine);
}

/* The 3px selection bar, drawn over the 1px border so weights never stack. */
.sb-selectable.is-selected::before {
  content: '';
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: -1px;
  width: 3px;
  background: var(--marine);
}

.sb-selectable__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  white-space: nowrap;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
}

/* Focus lands on the hidden input; move the ring onto the card it drives. */
.sb-selectable:has(.sb-selectable__input:focus-visible) {
  outline: 2px solid var(--marine);
  outline-offset: 2px;
}

.sb-selectable__label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
}

/* The pay-method variant is plain 14px/400 in the mockup, not a 600 title. */
.sb-selectable.is-compact .sb-selectable__label {
  font-weight: 400;
}

.sb-selectable__desc {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--slate);
  line-height: 1.45;
}
</style>
