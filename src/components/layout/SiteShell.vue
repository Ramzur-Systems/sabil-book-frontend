<script setup lang="ts">
/**
 * One shell for the whole site. A guest and a signed-in member get the same
 * chrome and the same content column — only the nav differs. Two shells would
 * mean two places for the topbar to drift.
 */
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)

interface NavLink {
  to: { name: string }
  label: string
}

const links = computed<NavLink[]>(() => {
  if (!auth.isAuthenticated) {
    return [
      { to: { name: 'browse' }, label: 'Open requests' },
      { to: { name: 'experts' }, label: 'Experts' },
      { to: { name: 'how-it-works' }, label: 'How it works' },
    ]
  }
  const memberLinks: (NavLink & { providerOnly?: boolean })[] = [
    { to: { name: 'dashboard' }, label: 'Workspace' },
    { to: { name: 'browse' }, label: 'Open requests' },
    { to: { name: 'my-offers' }, label: 'My offers', providerOnly: true },
    { to: { name: 'earnings' }, label: 'Earnings', providerOnly: true },
    { to: { name: 'settings' }, label: 'Profile' },
  ]
  return memberLinks.filter((link) => !link.providerOnly || auth.isProvider)
})

const homeTarget = computed(() => (auth.isAuthenticated ? { name: 'dashboard' } : { name: 'home' }))

/** Close the mobile menu on navigation, so a tap never leaves it hanging open. */
watch(() => route.fullPath, () => { menuOpen.value = false })

function signOut() {
  auth.clear()
  void router.push({ name: 'home' })
}
</script>

<template>
  <a class="sb-skip" href="#main">Skip to content</a>

  <header class="sb-topbar">
    <div class="sb-topbar__inner">
      <RouterLink :to="homeTarget" class="sb-wordmark">Sabil Books</RouterLink>

      <button
        type="button"
        class="sb-topbar__toggle"
        :aria-expanded="menuOpen"
        aria-controls="sb-nav"
        @click="menuOpen = !menuOpen"
      >
        {{ menuOpen ? 'Close' : 'Menu' }}
      </button>

      <nav id="sb-nav" class="sb-nav" :class="{ 'is-open': menuOpen }" aria-label="Main">
        <RouterLink v-for="link in links" :key="link.label" :to="link.to" class="sb-nav__link">
          {{ link.label }}
        </RouterLink>

        <template v-if="auth.isAuthenticated">
          <button type="button" class="sb-nav__link sb-nav__signout" @click="signOut">Sign out</button>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'login' }" class="sb-nav__link">Sign in</RouterLink>
          <RouterLink :to="{ name: 'register' }" class="sb-nav__cta">Create an account</RouterLink>
        </template>
      </nav>
    </div>
  </header>

  <main id="main" class="sb-wrap">
    <RouterView v-slot="{ Component }">
      <Transition name="sb-page" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </main>

  <footer class="sb-footer">
    <div class="sb-footer__inner">
      <p class="sb-footer__mark">Sabil Books</p>
      <nav class="sb-footer__nav" aria-label="Footer">
        <RouterLink :to="{ name: 'browse' }">Open requests</RouterLink>
        <RouterLink :to="{ name: 'experts' }">Experts</RouterLink>
        <RouterLink :to="{ name: 'how-it-works' }">How it works</RouterLink>
        <RouterLink v-if="!auth.isAuthenticated" :to="{ name: 'register' }">Create an account</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.sb-skip {
  position: absolute;
  top: -60px;
  left: 16px;
  z-index: var(--z-sticky);
  padding: 10px 16px;
  color: var(--parchment);
  background: var(--ink);
  border-radius: var(--radius-control);
  transition: top var(--dur-fast) var(--ease-out-quart);
}
.sb-skip:focus {
  top: 12px;
}

.sb-topbar {
  padding: 20px 0;
  margin-bottom: 56px;
  color: var(--parchment);
  background: var(--ink);
}

.sb-topbar__inner {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: baseline;
  justify-content: space-between;
  max-width: 960px;
  padding: 0 32px;
  margin: 0 auto;
}

.sb-wordmark {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: var(--parchment);
  text-decoration: none;
}

.sb-topbar__toggle {
  display: none;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--parchment);
  background: none;
  border: 1px solid var(--line-on-dark);
  border-radius: var(--radius-control);
  cursor: pointer;
}

.sb-nav {
  display: flex;
  gap: 28px;
  align-items: baseline;
  font-size: 14px;
}

.sb-nav__link {
  padding: 0;
  font: inherit;
  color: var(--topnav);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out-quart);
}
.sb-nav__link:hover {
  color: var(--on-dark);
}
.sb-nav__link.router-link-active {
  color: var(--on-dark);
  font-weight: 500;
}

.sb-nav__signout {
  color: var(--on-dark-muted);
}

/* The one filled element on the dark bar: the single action for a stranger. */
.sb-nav__cta {
  padding: 7px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  text-decoration: none;
  background: var(--parchment);
  border-radius: var(--radius-control);
  transition: background-color var(--dur-fast) var(--ease-out-quart);
}
.sb-nav__cta:hover {
  background: var(--on-dark);
}

.sb-wrap {
  max-width: 960px;
  padding: 0 32px 96px;
  margin: 0 auto;
}

.sb-footer {
  padding: 28px 0 40px;
  border-top: 1px solid var(--line);
}

.sb-footer__inner {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 28px;
  align-items: baseline;
  justify-content: space-between;
  max-width: 960px;
  padding: 0 32px;
  margin: 0 auto;
}

.sb-footer__mark {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 600;
}

.sb-footer__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 13px;
}

.sb-footer__nav a {
  color: var(--slate);
  text-decoration: none;
}
.sb-footer__nav a:hover {
  color: var(--marine);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sb-page-enter-active,
.sb-page-leave-active {
  transition: opacity var(--dur-base) var(--ease-out-quart);
}
.sb-page-enter-from,
.sb-page-leave-to {
  opacity: 0;
}

@media (max-width: 800px) {
  .sb-topbar {
    margin-bottom: 36px;
  }
  .sb-topbar__toggle {
    display: block;
  }
  .sb-nav {
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;
    width: 100%;
    margin-top: 18px;
  }
  .sb-nav:not(.is-open) {
    display: none;
  }
}

@media (max-width: 640px) {
  .sb-topbar__inner,
  .sb-wrap,
  .sb-footer__inner {
    padding-inline: 20px;
  }
}

@media (max-width: 400px) {
  .sb-topbar__inner,
  .sb-wrap,
  .sb-footer__inner {
    padding-inline: 16px;
  }
}
</style>
