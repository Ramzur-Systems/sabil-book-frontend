<script setup lang="ts">
/**
 * Category chooser for the request wizard — the mockup's `.cat-grid`.
 * A real radiogroup built from SelectableCard: every option is a native radio
 * sharing one generated name, so arrow keys move the selection and the group is
 * announced as "N of M" without any keyboard code of our own.
 */
import { computed, useId } from 'vue'
import SelectableCard from './SelectableCard.vue'
import type { Category } from '@/types/entities'

const props = defineProps<{
  categories: Category[]
  modelValue: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const groupName = useId()
const labelId = useId()

function select(id: string) {
  emit('update:modelValue', id)
}

/** SelectableCard compares plain strings; a null selection is simply "no match". */
const current = computed(() => props.modelValue ?? '')
</script>

<template>
  <div class="sb-catpicker" role="radiogroup" :aria-labelledby="labelId">
    <span :id="labelId" class="sb-catpicker__legend">Category</span>
    <SelectableCard
      v-for="category in categories"
      :key="category.id"
      class="sb-catpicker__item"
      :name="groupName"
      :value="category.id"
      :label="category.name"
      :description="category.description || undefined"
      :model-value="current"
      @update:model-value="select"
    />
  </div>
</template>

<style scoped>
.sb-catpicker {
  display: flex;
  gap: 12px;
}

.sb-catpicker__legend {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
}

.sb-catpicker__item {
  flex: 1;
  min-width: 0;
}

/* Three across is only honest while each card still fits its two lines of copy. */
@media (max-width: 640px) {
  .sb-catpicker {
    flex-direction: column;
  }
}
</style>
