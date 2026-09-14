<script setup lang="ts">
import { computed } from 'vue'
import { initialsOf } from '@/lib/utils'

const props = defineProps<{ name: string }>()
const initials = computed(() => initialsOf(props.name))
</script>

<template>
  <span class="sb-avatar" aria-hidden="true">{{ initials }}</span>
</template>

<style scoped>
.sb-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  color: var(--brass-text);
  background: var(--brass-bg);
  border-radius: 50%;
}
</style>
