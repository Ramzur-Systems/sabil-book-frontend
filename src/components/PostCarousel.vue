<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ images: string[]; altPrefix?: string }>(), {
  altPrefix: 'Post image',
})
const current = ref(0)
function previous() {
  current.value = (current.value - 1 + props.images.length) % props.images.length
}
function next() {
  current.value = (current.value + 1) % props.images.length
}
function select(index: number) {
  current.value = index
}
</script>

<template>
  <div class="post-carousel">
    <img
      :src="images[current]"
      :alt="`${altPrefix} ${current + 1} of ${images.length}`"
      class="post-image"
    />
    <template v-if="images.length > 1">
      <button class="carousel-control previous" type="button" aria-label="Previous image" @click="previous">←</button>
      <button class="carousel-control next" type="button" aria-label="Next image" @click="next">→</button>
      <div class="carousel-dots" aria-label="Choose post image">
        <button
          v-for="(_, index) in images"
          :key="index"
          class="carousel-dot"
          :class="{ active: index === current }"
          type="button"
          :aria-label="`Show image ${index + 1}`"
          :aria-pressed="index === current"
          @click="select(index)"
        />
      </div>
    </template>
  </div>
</template>
