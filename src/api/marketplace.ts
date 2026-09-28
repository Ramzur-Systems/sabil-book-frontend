import { z } from 'zod'
import { api } from './client'
import { expertSchema, requestSchema, userSchema } from './types'
import type { OfferDraft, RequestDraft } from './types'

export const marketplace = {
  async requests() {
    return z.array(requestSchema).parse(await api<unknown>('/requests/'))
  },
  async request(id: string) {
    return requestSchema.parse(await api<unknown>(`/requests/${encodeURIComponent(id)}/`))
  },
  async experts() {
    return z.array(expertSchema).parse(await api<unknown>('/experts/'))
  },
  async expert(id: string) {
    return expertSchema.parse(await api<unknown>(`/experts/${encodeURIComponent(id)}/`))
  },
  async createRequest(draft: RequestDraft) {
    return requestSchema.parse(
      await api<unknown>('/requests/', { method: 'POST', body: JSON.stringify(draft) }),
    )
  },
  async createOffer(id: string, draft: OfferDraft) {
    return api<{ id: string }>(`/requests/${encodeURIComponent(id)}/offers/`, {
      method: 'POST',
      body: JSON.stringify(draft),
    })
  },
  async signIn(email: string, password: string) {
    return userSchema.parse(
      await api<unknown>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    )
  },
  async register(name: string, email: string, password: string) {
    return userSchema.parse(
      await api<unknown>('/auth/register/', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    )
  },
  async signOut() {
    return api<void>('/auth/logout/', { method: 'POST' })
  },
  async currentUser() {
    return userSchema.parse(await api<unknown>('/auth/me/'))
  },
  async submitReview(stars: number, text: string) {
    return api<{ id: string }>('/orders/sample/reviews/', {
      method: 'POST',
      body: JSON.stringify({ stars, text }),
    })
  },
}
