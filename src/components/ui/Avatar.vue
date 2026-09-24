<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { initialsOf } from '@/lib/utils'

const props = defineProps<{ name: string; src?: string | null }>()
const initials = computed(() => initialsOf(props.name))

/** A broken photo URL falls back to initials rather than a broken-image icon. */
const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false),
)
const showPhoto = computed(() => Boolean(props.src) && !failed.value)
</script>

<template>
  <!-- Always beside the person's name, so the photo is decorative. -->
  <span class="sb-avatar" aria-hidden="true">
    <img v-if="showPhoto" :src="src!" alt="" class="sb-avatar__img" @error="failed = true" />
    <template v-else>{{ initials }}</template>
  </span>
</template>

<style scoped>
.sb-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: var(--brass-text);
  background: var(--brass-bg);
  border-radius: 50%;
}

.sb-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
