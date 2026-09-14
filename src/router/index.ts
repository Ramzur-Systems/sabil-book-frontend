import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Requires a session. Public surfaces omit it entirely. */
    auth?: boolean
    /** Requires user.isProvider. Only ever paired with `auth`. */
    provider?: boolean
    title?: string
    /** Full-bleed pages that supply their own shell chrome (login, register, 404). */
    bare?: boolean
  }
}

/**
 * Public URLs deliberately live at the root, not under /app: they are
 * shareable and indexable, and /app reads as "the signed-in application".
 * Composing a request or an offer is public too — sign-in is demanded at the
 * commit point by the view, not by a route guard.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/components/layout/SiteShell.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/views/public/HomeView.vue'), meta: { title: 'Expert-written material, on request' } },
      { path: 'requests', name: 'browse', component: () => import('@/views/BrowseView.vue'), meta: { title: 'Open requests' } },
      { path: 'requests/new', name: 'request-new', component: () => import('@/views/CreateRequestView.vue'), meta: { title: 'New request' } },
      { path: 'requests/:id', name: 'request-detail', component: () => import('@/views/RequestDetailView.vue'), props: true, meta: { title: 'Request' } },
      { path: 'requests/:id/offer', name: 'submit-offer', component: () => import('@/views/SubmitOfferView.vue'), props: true, meta: { title: 'Submit an offer' } },
      { path: 'experts', name: 'experts', component: () => import('@/views/public/ExpertsView.vue'), meta: { title: 'Experts' } },
      { path: 'experts/:id', name: 'expert-detail', component: () => import('@/views/public/ExpertProfileView.vue'), props: true, meta: { title: 'Expert' } },
      { path: 'how-it-works', name: 'how-it-works', component: () => import('@/views/public/HowItWorksView.vue'), meta: { title: 'How it works' } },

      // ---- signed-in application ----
      { path: 'app', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { auth: true, title: 'Your workspace' } },
      { path: 'app/orders/:id', name: 'order-detail', component: () => import('@/views/OrderStatusView.vue'), props: true, meta: { auth: true, title: 'Order' } },
      { path: 'app/orders/:id/pay', name: 'checkout', component: () => import('@/views/CheckoutView.vue'), props: true, meta: { auth: true, title: 'Confirm and pay' } },
      { path: 'app/orders/:id/review', name: 'review', component: () => import('@/views/ReviewView.vue'), props: true, meta: { auth: true, title: 'Rate this delivery' } },
      { path: 'app/offers', name: 'my-offers', component: () => import('@/views/MyOffersView.vue'), meta: { auth: true, provider: true, title: 'My offers' } },
      { path: 'app/earnings', name: 'earnings', component: () => import('@/views/EarningsView.vue'), meta: { auth: true, provider: true, title: 'Earnings' } },
      { path: 'app/providers/onboarding', name: 'provider-onboarding', component: () => import('@/views/ProviderOnboardingView.vue'), meta: { auth: true, title: 'Become a provider' } },
      { path: 'app/settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { auth: true, title: 'Settings' } },
    ],
  },

  { path: '/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { title: 'Sign in', bare: true } },
  { path: '/register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { title: 'Create an account', bare: true } },

  // Old /app/* addresses from before the public surface existed.
  { path: '/app/browse', redirect: { name: 'browse' } },
  { path: '/app/requests/new', redirect: { name: 'request-new' } },
  { path: '/app/requests/:id', redirect: (to) => ({ name: 'request-detail', params: to.params }) },
  { path: '/app/requests/:id/offer', redirect: (to) => ({ name: 'submit-offer', params: to.params }) },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: 'Page not found', bare: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.auth && !auth.isAuthenticated) {
    return { name: 'login', query: { next: to.fullPath } }
  }
  if (to.meta.provider && !auth.isProvider) {
    return { name: 'provider-onboarding' }
  }
  if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})

const SITE_NAME = 'Sabil Books'

/**
 * Name the tab after the entity on screen. Two money screens — the offer
 * comparison and the escrow status — are distinguished only by which order or
 * request they are about, and the router cannot know that name before the view
 * has fetched it. Detail views call this once their entity resolves:
 *
 *   setDocumentTitle(request.value.title)
 *
 * `afterEach` always writes a generic title first, so a stale name from the
 * previous screen can never survive a navigation.
 */
export function setDocumentTitle(text: string) {
  const trimmed = text.trim()
  document.title = trimmed ? `${trimmed} · ${SITE_NAME}` : SITE_NAME
}

router.afterEach((to) => {
  setDocumentTitle(to.meta.title ?? 'Expert-written material, on request')
})
