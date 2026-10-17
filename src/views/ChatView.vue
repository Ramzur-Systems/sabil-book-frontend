<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { account } from '../api/account'

const route = useRoute()
const client = useQueryClient()
const offerId = computed(() => String(route.params.id))
const query = useQuery({
  queryKey: computed(() => ['chat', offerId.value]),
  queryFn: () => account.chat(offerId.value),
  refetchInterval: 8000,
})
const draft = ref('')
const log = ref<HTMLElement | null>(null)
const mutation = useMutation({
  mutationFn: (text: string) => account.sendMessage(offerId.value, text),
  onSuccess: async () => {
    draft.value = ''
    await client.invalidateQueries({ queryKey: ['chat', offerId.value] })
  },
})
function send() {
  const text = draft.value.trim()
  if (text && !mutation.isPending.value) mutation.mutate(text)
}
function onKey(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    send()
  }
}
watch(
  () => query.data.value?.messages.length,
  async () => {
    await nextTick()
    log.value?.scrollTo({ top: log.value.scrollHeight })
  },
  { immediate: true, flush: 'post' },
)
</script>
<template>
  <div class="page narrow">
    <RouterLink to="/app/offers" class="link-arrow">← My offers</RouterLink>
    <p v-if="query.isPending.value" class="loading-state">Loading conversation…</p>
    <p v-else-if="query.isError.value" class="error-state">Could not load this conversation.</p>
    <section v-else-if="query.data.value" class="chat" aria-label="Conversation">
      <header class="chat-head">
        <span class="avatar" aria-hidden="true">{{ query.data.value.initials }}</span>
        <div class="chat-who">
          <h1>{{ query.data.value.counterpart }}</h1>
          <p>{{ query.data.value.title }}</p>
        </div>
        <dl class="chat-terms">
          <div>
            <dt>Offer</dt>
            <dd>{{ query.data.value.price }}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>{{ query.data.value.days }} days</dd>
          </div>
        </dl>
      </header>
      <ol
        ref="log"
        class="chat-log"
        role="log"
        aria-live="polite"
        aria-label="Messages"
        tabindex="0"
      >
        <li
          v-for="message in query.data.value.messages"
          :key="message.id"
          class="bubble"
          :class="message.from"
        >
          <p>{{ message.text }}</p>
          <time
            >{{ message.from === 'me' ? 'You' : query.data.value.counterpart }} ·
            {{ message.at }}</time
          >
        </li>
      </ol>
      <form class="chat-form" @submit.prevent="send">
        <label for="chat-text" class="sr-only">Message</label>
        <textarea
          id="chat-text"
          v-model="draft"
          class="input"
          rows="2"
          maxlength="2000"
          placeholder="Write a message"
          @keydown="onKey"
        />
        <button class="button" type="submit" :disabled="!draft.trim() || mutation.isPending.value">
          Send
        </button>
      </form>
      <p v-if="mutation.isError.value" class="form-error" role="alert">
        Message not sent. Try again.
      </p>
      <p class="small-note">
        Keep payment and delivery inside Sabil so the order stays protected by escrow.
      </p>
    </section>
  </div>
</template>
