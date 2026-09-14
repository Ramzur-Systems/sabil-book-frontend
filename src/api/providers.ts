import { api } from './client'
import type { Paginated, ProviderProfile } from '@/types/entities'

/** Public expert directory — readable without a session. */
export const listProviders = (params: { categoryId?: string } = {}) =>
  api.get<Paginated<ProviderProfile>>('/providers', { query: { ...params }, public: true })

export const getProvider = (id: string) =>
  api.get<ProviderProfile>(`/providers/${id}`, { public: true })

export interface OnboardingDraft {
  displayName: string
  bio: string
  categories: string[]
  payoutMethod: string
}

export const getMyProviderProfile = () => api.get<ProviderProfile>('/providers/me')

export const upsertMyProviderProfile = (body: Partial<OnboardingDraft>) =>
  api.patch<ProviderProfile>('/providers/me', body)

export const startKyc = () => api.post<ProviderProfile>('/providers/me/kyc')
