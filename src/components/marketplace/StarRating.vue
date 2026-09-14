<script setup lang="ts">
/**
 * Five brass stars on a warm hairline ground — the mockup's `.stars`.
 * Interactive mode is a real radiogroup of native radios (arrow keys, form
 * participation, "3 stars" announced per option); `readonly` mode is plain
 * text carrying an accessible "Rated 4 out of 5" label instead.
 */
import { computed, ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    readonly?: boolean
    count?: number
  }>(),
  { readonly: false, count: 5 },
)

const emit = defineEmits<{ 'update:modelValue': [number] }>()

const groupName = useId()
const labelId = useId()

/** Hover preview never mutates the model — it only tints what a click would set. */
const hovered = ref<number | null>(null)

const values = computed(() => Array.from({ length: props.count }, (_, i) => i + 1))

const shown = computed(() => hovered.value ?? props.modelValue)

const readonlyLabel = computed(() => `Rated ${props.modelValue} out of ${props.count}`)

function starLabel(value: number): string {
  return `${value} ${value === 1 ? 'star' : 'stars'}`
}
</script>

<template>
  <span v-if="readonly" class="sb-stars sb-stars--readonly" role="img" :aria-label="readonlyLabel">
    <span
      v-for="value in values"
      :key="value"
      aria-hidden="true"
      :class="{ 'is-filled': value <= modelValue }"
      >★</span
    >
  </span>

  <div
    v-else
    class="sb-stars"
    role="radiogroup"
    :aria-labelledby="labelId"
    @mouseleave="hovered = null"
  >
    <span :id="labelId" class="sb-stars__sr">Rating out of {{ count }}</span>
    <label
      v-for="value in values"
      :key="value"
      class="sb-stars__star"
      :class="{ 'is-filled': value <= shown }"
      @mouseenter="hovered = value"
    >
      <input
        class="sb-stars__input"
        type="radio"
        :name="groupName"
        :value="value"
        :checked="value === modelValue"
        :aria-label="starLabel(value)"
        @change="emit('update:modelValue', value)"
      />
      <span aria-hidden="true">★</span>
    </label>
  </div>
</template>

<style scoped>
.sb-stars {
  display: flex;
  margin: 0 0 24px;
  font-size: 30px;
  line-height: 1;
  color: var(--line);
  letter-spacing: 6px;
}

/* Read-only stars sit inline next to other text, so they carry no block margin. */
.sb-stars--readonly {
  display: inline-flex;
  margin-bottom: 0;
  vertical-align: middle;
}

.sb-stars--readonly > span.is-filled,
.sb-stars__star.is-filled {
  color: var(--brass-text);
}

.sb-stars__star {
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out-quart);
}

.sb-stars__input,
.sb-stars__sr {
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

/* Focus lives on the hidden radio; show the ring on the glyph it drives. */
.sb-stars__star:has(.sb-stars__input:focus-visible) {
  outline: 2px solid var(--marine);
  outline-offset: 2px;
}
</style>
