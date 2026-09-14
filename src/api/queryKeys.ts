import type { OrderListParams } from './orders'
import type { RequestListParams } from './requests'

/**
 * Every query key in the app is built here so invalidation after a mutation
 * can never miss a cache entry through a hand-typed key.
 */
export const queryKeys = {
  categories: ['categories'] as const,
  me: ['me'] as const,
  providerProfile: ['provider', 'me'] as const,
  requests: (params: RequestListParams = {}) => ['requests', params] as const,
  request: (id: string) => ['requests', 'detail', id] as const,
  requestOffers: (id: string) => ['requests', 'detail', id, 'offers'] as const,
  myOffers: ['providers', 'me', 'offers'] as const,
  /** Public expert directory, optionally narrowed to one category. */
  providers: (params: { categoryId?: string } = {}) => ['providers', params] as const,
  /** One public expert profile. */
  provider: (id: string) => ['providers', 'detail', id] as const,
  orders: (params: OrderListParams = {}) => ['orders', params] as const,
  order: (id: string) => ['orders', 'detail', id] as const,
}
