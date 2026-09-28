import { http, HttpResponse } from 'msw'
import { experts, requests } from './data'
import { offerDraftSchema, requestDraftSchema } from '../api/types'

const prefix = '*/api/v1'
const myOffers = [
  { id: 'sample-offer', title: requests[0].title, price: '$430', days: 7, status: 'Submitted' },
]
const demoUserKey = 'sabil-demo-user'
export const handlers = [
  http.get(`${prefix}/requests/`, () => HttpResponse.json(requests)),
  http.get(`${prefix}/requests/:id/`, ({ params }) => {
    const item = requests.find((r) => r.id === params.id)
    return item
      ? HttpResponse.json(item)
      : HttpResponse.json({ detail: 'Request not found' }, { status: 404 })
  }),
  http.post(`${prefix}/requests/`, async ({ request }) => {
    const parsed = requestDraftSchema.safeParse(await request.json())
    if (!parsed.success) return HttpResponse.json({ detail: 'Invalid request' }, { status: 400 })
    const item = {
      id: `request-${Date.now()}`,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description,
      budget: `$${parsed.data.budget}`,
      days: 14,
      offers: 0,
    }
    requests.unshift(item)
    return HttpResponse.json(item, { status: 201 })
  }),
  http.post(`${prefix}/requests/:id/offers/`, async ({ params, request }) => {
    const parsed = offerDraftSchema.safeParse(await request.json())
    const item = requests.find((r) => r.id === params.id)
    if (!parsed.success || !item)
      return HttpResponse.json({ detail: 'Invalid offer' }, { status: 400 })
    item.offers += 1
    return HttpResponse.json({ id: `offer-${Date.now()}` }, { status: 201 })
  }),
  http.get(`${prefix}/experts/`, () => HttpResponse.json(experts)),
  http.get(`${prefix}/experts/:id/`, ({ params }) => {
    const item = experts.find((e) => e.id === params.id)
    return item
      ? HttpResponse.json(item)
      : HttpResponse.json({ detail: 'Expert not found' }, { status: 404 })
  }),
  http.post(`${prefix}/auth/login/`, async ({ request }) => {
    const body = (await request.json()) as { email?: string }
    const user = {
      id: 'demo-user',
      name: 'Demo Member',
      email: body.email || 'demo@example.com',
    }
    sessionStorage.setItem(demoUserKey, JSON.stringify(user))
    return HttpResponse.json(user)
  }),
  http.post(`${prefix}/auth/register/`, async ({ request }) => {
    const body = (await request.json()) as { name?: string; email?: string }
    const user = {
      id: 'demo-user',
      name: body.name || 'Demo Member',
      email: body.email || 'demo@example.com',
    }
    sessionStorage.setItem(demoUserKey, JSON.stringify(user))
    return HttpResponse.json(user, { status: 201 })
  }),
  http.get(`${prefix}/auth/me/`, () => {
    const saved = sessionStorage.getItem(demoUserKey)
    return saved
      ? HttpResponse.json(JSON.parse(saved))
      : HttpResponse.json({ detail: 'Not signed in' }, { status: 401 })
  }),
  http.post(`${prefix}/auth/logout/`, () => {
    sessionStorage.removeItem(demoUserKey)
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${prefix}/orders/sample/reviews/`, () =>
    HttpResponse.json({ id: `review-${Date.now()}` }, { status: 201 }),
  ),
  http.get(`${prefix}/account/dashboard/`, () =>
    HttpResponse.json({ awaitingOffers: 2, activeOrders: 1, completed: 3 }),
  ),
  http.get(`${prefix}/orders/:id/`, ({ params }) =>
    HttpResponse.json({
      id: String(params.id),
      title: 'Editorial guide for a community initiative',
      category: 'Process documents',
      expert: 'Aida Nurgaliyeva',
      fileName: 'community-editorial-guide.pdf',
      status: 'Under review',
    }),
  ),
  http.get(`${prefix}/account/offers/`, () => HttpResponse.json(myOffers)),
  http.get(`${prefix}/account/earnings/`, () =>
    HttpResponse.json({
      total: '$1,840',
      pending: '$420',
      month: '$620',
      entries: [
        { title: 'Editorial guide for a community initiative', amount: '$420', date: 'Recently' },
      ],
    }),
  ),
  http.post(`${prefix}/orders/:id/pay/`, () => HttpResponse.json({ status: 'held' })),
  http.post(`${prefix}/orders/:id/:action/`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${prefix}/offers/:id/withdraw/`, ({ params }) => {
    const index = myOffers.findIndex((offer) => offer.id === params.id)
    if (index !== -1) myOffers.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${prefix}/providers/onboarding/`, () => new HttpResponse(null, { status: 204 })),
  http.patch(`${prefix}/account/settings/`, () => new HttpResponse(null, { status: 204 })),
]
