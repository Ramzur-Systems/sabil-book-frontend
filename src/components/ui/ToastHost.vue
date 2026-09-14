<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const { toasts } = storeToRefs(ui)
</script>

<template>
  <div class="sb-toasts" role="status" aria-live="polite">
    <TransitionGroup name="sb-toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="sb-toast"
        :class="`sb-toast--${toast.tone}`"
      >
        <span>{{ toast.message }}</span>
        <button type="button" class="sb-toast__close" aria-label="Dismiss" @click="ui.dismiss(toast.id)">
          &times;
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.sb-toasts {
  position: fixed;
  right: 20px;
  bottom: 20px;
  left: 20px;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  pointer-events: none;
}

.sb-toast {
  display: flex;
  gap: 16px;
  align-items: center;
  max-width: 420px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--parchment);
  background: var(--ink);
  border-left: 3px solid var(--marine);
  pointer-events: auto;
}

.sb-toast--success {
  border-left-color: var(--green);
}
.sb-toast--danger {
  border-left-color: var(--red);
}

.sb-toast__close {
  margin-left: auto;
  font-size: 18px;
  line-height: 1;
  color: var(--topnav);
  background: none;
  border: none;
  cursor: pointer;
}
.sb-toast__close:hover {
  color: var(--on-dark);
}

.sb-toast-enter-active,
.sb-toast-leave-active {
  transition:
    opacity var(--dur-base) var(--ease-out-quart),
    transform var(--dur-base) var(--ease-out-quart);
}
.sb-toast-enter-from,
.sb-toast-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
