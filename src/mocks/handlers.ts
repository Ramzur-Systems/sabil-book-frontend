import { http, HttpResponse } from 'msw'
<<<<<<< HEAD
import { experts, requests } from './data'
import { offerDraftSchema, requestDraftSchema } from '../api/types'
import type { ChatMessage } from '../api/account'
=======
import { experts, posts, requests } from './data'
import { offerDraftSchema, postDraftSchema, requestDraftSchema } from '../api/types'
>>>>>>> 8815b51f3a391d834773d1dcb3088a4d0af81013

const prefix = '*/api/v1'
const myOffers = [
  { id: 'sample-offer', title: requests[0].title, price: '$430', days: 7, status: 'Submitted' },
]
const chats: Record<string, { counterpart: string; initials: string; messages: ChatMessage[] }> = {
  'sample-offer': {
    counterpart: 'Aida Nurgaliyeva',
    initials: 'AN',
    messages: [
      {
        id: 'm1',
        from: 'them',
        text: 'Hello, I read the brief. Do you already have a list of the five competitors you want covered, or should I propose them?',
        at: '09:12',
      },
      {
        id: 'm2',
        from: 'me',
        text: 'Please propose them. We can adjust once I see the shortlist.',
        at: '09:40',
      },
      {
        id: 'm3',
        from: 'them',
        text: 'Understood. I will send the shortlist with sources before I start the full draft.',
        at: '09:46',
      },
    ],
  },
}
const demoUserKey = 'sabil-demo-user'
const providerUser = {
  id: 'user-aida',
  name: 'Aida Nurgaliyeva',
  email: 'aida@sabil.app',
  isProvider: true,
  providerId: 'aida',
}

function currentUser() {
  const saved = sessionStorage.getItem(demoUserKey)
  return saved ? (JSON.parse(saved) as { id: string; isProvider: boolean; providerId?: string }) : null
}

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
  http.get(`${prefix}/posts/`, () => HttpResponse.json(posts)),
  http.get(`${prefix}/experts/:id/posts/`, ({ params }) => {
    const expert = experts.find((item) => item.id === params.id)
    if (!expert) return HttpResponse.json({ detail: 'Expert not found' }, { status: 404 })
    return HttpResponse.json(posts.filter((post) => post.authorId === expert.userId))
  }),
  http.post(`${prefix}/posts/`, async ({ request }) => {
    const user = currentUser()
    if (!user) return HttpResponse.json({ detail: 'Not signed in' }, { status: 401 })
    if (!user.isProvider) return HttpResponse.json({ detail: 'Only providers can create posts' }, { status: 403 })
    const formData = await request.formData()
    const parsed = postDraftSchema.safeParse({
      text: formData.get('text'),
      images: formData.getAll('images'),
    })
    if (!parsed.success) return HttpResponse.json({ detail: 'Invalid post' }, { status: 400 })
    const now = new Date().toISOString()
    const post = {
      id: `post-${Date.now()}`,
      authorId: user.id,
      text: parsed.data.text,
      imageUrls: parsed.data.images.map((file) => URL.createObjectURL(file)),
      createdAt: now,
      updatedAt: now,
    }
    posts.unshift(post)
    return HttpResponse.json(post, { status: 201 })
  }),
  http.post(`${prefix}/auth/login/`, async ({ request }) => {
    const body = (await request.json()) as { email?: string }
    const user = body.email?.trim().toLowerCase() === providerUser.email ? providerUser : {
      id: 'demo-user',
      name: 'Demo Member',
      email: body.email || 'demo@example.com',
      isProvider: false,
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
      isProvider: false,
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
  http.get(`${prefix}/offers/:id/chat/`, ({ params }) => {
    const offer = myOffers.find((o) => o.id === params.id)
    const chat = chats[String(params.id)]
    if (!offer || !chat)
      return HttpResponse.json({ detail: 'Conversation not found' }, { status: 404 })
    return HttpResponse.json({
      offerId: offer.id,
      title: offer.title,
      counterpart: chat.counterpart,
      initials: chat.initials,
      price: offer.price,
      days: offer.days,
      messages: chat.messages,
    })
  }),
  http.post(`${prefix}/offers/:id/chat/`, async ({ params, request }) => {
    const chat = chats[String(params.id)]
    const body = (await request.json()) as { text?: string }
    const text = body.text?.trim()
    if (!chat || !text) return HttpResponse.json({ detail: 'Invalid message' }, { status: 400 })
    const now = new Date()
    const message: ChatMessage = {
      id: `m-${Date.now()}`,
      from: 'me',
      text,
      at: now.toTimeString().slice(0, 5),
    }
    chat.messages.push(message)
    return HttpResponse.json(message, { status: 201 })
  }),
  http.post(`${prefix}/providers/onboarding/`, () => new HttpResponse(null, { status: 204 })),
  http.patch(`${prefix}/account/settings/`, () => new HttpResponse(null, { status: 204 })),
]
