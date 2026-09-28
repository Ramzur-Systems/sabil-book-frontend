<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'
import BaseButton from './BaseButton.vue'

const session = useSessionStore()
const route = useRoute()
const router = useRouter()
const menu = ref(false)
watch(
  () => route.fullPath,
  () => {
    menu.value = false
  },
)
async function signOut() {
  await session.logout()
  await router.push('/')
}
</script>
<template>
  <header class="site-header">
    <div class="shell header-inner">
      <RouterLink to="/" class="brand" aria-label="Sabil Qalam home"
        ><span>Sabil Qalam</span></RouterLink
      >
      <button
        class="menu-toggle"
        :aria-expanded="menu"
        aria-controls="main-nav"
        @click="menu = !menu"
      >
        Menu
      </button>
      <nav id="main-nav" class="nav" :class="{ open: menu }" aria-label="Main navigation">
        <template v-if="session.signedIn">
          <RouterLink to="/app">Workspace</RouterLink
          ><RouterLink to="/requests">Open requests</RouterLink>
          <RouterLink to="/app/offers">My offers</RouterLink
          ><RouterLink to="/app/earnings">Earnings</RouterLink>
          <RouterLink to="/app/settings">Profile</RouterLink
          ><button class="nav-action" @click="signOut">Sign out</button>
        </template>
        <template v-else>
          <RouterLink to="/requests">Open requests</RouterLink
          ><RouterLink to="/experts">Experts</RouterLink>
          <RouterLink to="/how-it-works">How it works</RouterLink
          ><RouterLink to="/login">Sign in</RouterLink>
          <BaseButton to="/register" size="small">Sign up</BaseButton>
        </template>
        <span class="lang" title="Languages in the design preview">EN · RU · KZ</span>
      </nav>
    </div>
  </header>
</template>
