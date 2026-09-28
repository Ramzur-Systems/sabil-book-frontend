import { api } from './client'

export type Dashboard = { awaitingOffers: number; activeOrders: number; completed: number }
export type Order = {
  id: string
  title: string
  category: string
  expert: string
  fileName: string
  status: string
}
export type MyOffer = { id: string; title: string; price: string; days: number; status: string }
export type Earnings = {
  total: string
  pending: string
  month: string
  entries: { title: string; amount: string; date: string }[]
}
export const account = {
  dashboard: () => api<Dashboard>('/account/dashboard/'),
  order: (id: string) => api<Order>(`/orders/${encodeURIComponent(id)}/`),
  offers: () => api<MyOffer[]>('/account/offers/'),
  earnings: () => api<Earnings>('/account/earnings/'),
  orderAction: (id: string, action: 'correction' | 'dispute' | 'accept', reason = '') =>
    api<void>(`/orders/${encodeURIComponent(id)}/${action}/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  pay: (id: string, method: string) =>
    api<{ status: string }>(`/orders/${encodeURIComponent(id)}/pay/`, {
      method: 'POST',
      body: JSON.stringify({ method }),
    }),
  withdrawOffer: (id: string) =>
    api<void>(`/offers/${encodeURIComponent(id)}/withdraw/`, { method: 'POST' }),
  onboarding: (profile: { name: string; bio: string; expertise: string }) =>
    api<void>('/providers/onboarding/', { method: 'POST', body: JSON.stringify(profile) }),
  settings: (data: { name: string; country: string }) =>
    api<void>('/account/settings/', { method: 'PATCH', body: JSON.stringify(data) }),
}
