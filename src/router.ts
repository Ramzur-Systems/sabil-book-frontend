import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/HomeView.vue'), meta: { title: 'Home' } },
    {
      path: '/requests',
      component: () => import('./views/RequestsView.vue'),
      meta: { title: 'Open requests' },
    },
    {
      path: '/requests/new',
      component: () => import('./views/NewRequestView.vue'),
      meta: { title: 'Post a request' },
    },
    {
      path: '/requests/:id/offer',
      component: () => import('./views/OfferView.vue'),
      meta: { title: 'Submit offer' },
    },
    {
      path: '/requests/:id',
      component: () => import('./views/RequestDetailView.vue'),
      meta: { title: 'Open request' },
    },
    {
      path: '/experts',
      component: () => import('./views/ExpertsView.vue'),
      meta: { title: 'Experts' },
    },
    {
      path: '/experts/:id',
      component: () => import('./views/ExpertDetailView.vue'),
      meta: { title: 'Expert profile' },
    },
    {
      path: '/how-it-works',
      component: () => import('./views/HowView.vue'),
      meta: { title: 'How it works' },
    },
    {
      path: '/login',
      component: () => import('./views/AuthView.vue'),
      props: { mode: 'login' },
      meta: { title: 'Sign in' },
    },
    {
      path: '/register',
      component: () => import('./views/AuthView.vue'),
      props: { mode: 'register' },
      meta: { title: 'Create account' },
    },
    {
      path: '/app',
      component: () => import('./views/DashboardView.vue'),
      meta: { title: 'Workspace' },
    },
    {
      path: '/app/orders/sample',
      component: () => import('./views/OrderView.vue'),
      meta: { title: 'Order' },
    },
    {
      path: '/app/orders/sample/pay',
      component: () => import('./views/CheckoutView.vue'),
      meta: { title: 'Checkout' },
    },
    {
      path: '/app/orders/sample/review',
      component: () => import('./views/ReviewView.vue'),
      meta: { title: 'Review' },
    },
    {
      path: '/app/offers',
      component: () => import('./views/MyOffersView.vue'),
      meta: { title: 'My offers' },
    },
    {
      path: '/app/earnings',
      component: () => import('./views/EarningsView.vue'),
      meta: { title: 'Earnings' },
    },
    {
      path: '/app/providers/onboarding',
      component: () => import('./views/OnboardingView.vue'),
      meta: { title: 'Become a provider' },
    },
    {
      path: '/app/settings',
      component: () => import('./views/SettingsView.vue'),
      meta: { title: 'Settings' },
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('./views/NotFoundView.vue'),
      meta: { title: 'Not found' },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
router.afterEach((to) => {
  document.title = `${String(to.meta.title || 'Sabil Qalam')} — Sabil Qalam`
})
