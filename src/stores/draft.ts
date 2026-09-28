import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useDraftStore = defineStore('requestDraft', () => {
  const step = ref(1)
  const draft = reactive({ category: '', title: '', description: '', budget: '', deadline: '' })
  function reset() {
    step.value = 1
    Object.assign(draft, { category: '', title: '', description: '', budget: '', deadline: '' })
  }
  return { step, draft, reset }
})
