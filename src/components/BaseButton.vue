<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { cva } from 'class-variance-authority'
import { cn } from '../lib/utils'

const props = withDefaults(
  defineProps<{
    to?: string
    variant?: 'primary' | 'outline' | 'text'
    size?: 'default' | 'small'
    disabled?: boolean
  }>(),
  { variant: 'primary', size: 'default' },
)
const styles = cva('button', {
  variants: {
    variant: { primary: '', outline: 'outline', text: 'text' },
    size: { default: '', small: 'small' },
  },
  defaultVariants: { variant: 'primary', size: 'default' },
})
const className = computed(() => cn(styles({ variant: props.variant, size: props.size })))
</script>
<template>
  <RouterLink v-if="to" :to="to" :class="className"><slot /></RouterLink>
  <button v-else type="button" :class="className" :disabled="disabled"><slot /></button>
</template>
