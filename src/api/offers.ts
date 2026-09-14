import { api } from './client'
import type { Offer, OrderT, Paginated } from '@/types/entities'

export interface OfferDraft {
  price: number
  deliveryDays: number
  message: string
  currency?: string
}

export const createOffer = (requestId: string, body: OfferDraft) =>
  api.post<Offer>(`/requests/${requestId}/offers`, body)

/** Accepting an offer creates the order the customer then pays for. */
export const acceptOffer = (offerId: string) => api.post<OrderT>(`/offers/${offerId}/accept`)

export const withdrawOffer = (offerId: string) => api.post<Offer>(`/offers/${offerId}/withdraw`)

export const listMyOffers = () => api.get<Paginated<Offer>>('/providers/me/offers')
