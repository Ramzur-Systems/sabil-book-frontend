import { api } from './client'
import type { Category, Offer, Paginated, RequestT, RequestStatus } from '@/types/entities'

export interface RequestListParams {
  mine?: boolean
  status?: RequestStatus
  categoryId?: string
  search?: string
}

export interface RequestDraft {
  title: string
  description: string
  categoryId: string
  budgetMin: number
  budgetMax: number
  currency: string
  deadline: string | null
}

/** Public when `mine` is not set — the browse feed is readable by anyone. */
export const listRequests = (params: RequestListParams = {}) =>
  api.get<Paginated<RequestT>>('/requests', { query: { ...params }, public: !params.mine })

export const getRequest = (id: string) =>
  api.get<RequestT>(`/requests/${id}`, { public: true })

export const createRequest = (body: Partial<RequestDraft>) =>
  api.post<RequestT>('/requests', body)

export const updateRequest = (id: string, body: Partial<RequestDraft>) =>
  api.patch<RequestT>(`/requests/${id}`, body)

export const submitRequest = (id: string) => api.post<RequestT>(`/requests/${id}/submit`)

export const listRequestOffers = (id: string) =>
  api.get<Paginated<Offer>>(`/requests/${id}/offers`)

export const listCategories = () => api.get<Paginated<Category>>('/categories', { public: true })
