import { api } from './client'
import type { OrderT, Paginated, Review } from '@/types/entities'

export interface OrderListParams {
  mine?: boolean
  role?: 'customer' | 'provider'
}

export type PaymentMethod = 'card' | 'local_bank_kz'

export const listOrders = (params: OrderListParams = {}) =>
  api.get<Paginated<OrderT>>('/orders', { query: { ...params } })

export const getOrder = (id: string) => api.get<OrderT>(`/orders/${id}`)

export const payOrder = (id: string, body: { method: PaymentMethod }) =>
  api.post<OrderT>(`/orders/${id}/pay`, body)

export const acceptDelivery = (id: string) => api.post<OrderT>(`/orders/${id}/accept`)

export const requestCorrection = (id: string, body: { reason: string }) =>
  api.post<OrderT>(`/orders/${id}/request-correction`, body)

export const openDispute = (id: string, body: { reason: string }) =>
  api.post<OrderT>(`/orders/${id}/dispute`, body)

export const submitReview = (id: string, body: { rating: number; comment: string }) =>
  api.post<Review>(`/orders/${id}/review`, body)

export const attachmentDownloadUrl = (attachmentId: string) =>
  `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/attachments/${attachmentId}/download`
