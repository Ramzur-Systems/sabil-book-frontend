/**
 * MSW handlers for every endpoint declared in `src/api/*.ts`.
 *
 * These exist because the Django backend currently exposes only /api/users/ —
 * the marketplace endpoints in FRONTEND_SPEC.md §3 are not implemented yet.
 * The api client is written against the real URLs, so switching to the live
 * backend is `VITE_USE_MOCKS=false` and nothing else.
 */
import { HttpResponse, delay, http } from 'msw'
import type {
  Attachment,
  Offer,
  OrderT,
  Paginated,
  ProviderProfile,
  RequestT,
  Review,
  User,
} from '@/types/entities'
import {
  CURRENT_USER_ID,
  MY_PROVIDER_ID,
  attachments,
  categories,
  commissionFor,
  fullDescription,
  nextId,
  offers,
  orders,
  providers,
  requestOwner,
  requests,
  reviews,
  users,
} from './db'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'
const url = (path: string) => `${BASE}${path}`

/** Latency so loading states are actually visible during development. */
const latency = () => delay(200 + Math.round(Math.random() * 200))

const page = <T>(results: T[]): Paginated<T> => ({ results, count: results.length })

const notFound = (what: string) => HttpResponse.json({ detail: `${what} not found.` }, { status: 404 })
const conflict = (detail: string) => HttpResponse.json({ detail }, { status: 409 })

const currentUser = () => users.find((u) => u.id === CURRENT_USER_ID) as User
const myProvider = () => providers.find((p) => p.userId === CURRENT_USER_ID)
const ownsRequest = (id: string) => requestOwner.get(id) === CURRENT_USER_ID

/** Is this caller signed in? The mock only needs presence, not validity. */
function isSignedIn(request: Request): boolean {
  return (request.headers.get('Authorization') ?? '').startsWith('Bearer ')
}

const PREVIEW_CHARS = 200

/**
 * Projects a request for the viewer. A guest gets the teaser only: the full
 * brief carries procurement detail we do not serve publicly.
 */
function projectRequest(r: RequestT, signedIn: boolean): RequestT {
  const body = fullDescription.get(r.id) ?? ''
  const truncated = body.length > PREVIEW_CHARS
  const preview = truncated ? `${body.slice(0, PREVIEW_CHARS).trimEnd()}…` : body
  return {
    ...r,
    description: signedIn ? body : null,
    descriptionPreview: preview,
    descriptionTruncated: truncated,
    isMine: signedIn && requestOwner.get(r.id) === CURRENT_USER_ID,
  }
}

/** Public provider profiles never carry the account id behind them. */
function projectProvider(p: ProviderProfile): ProviderProfile {
  const { userId: _userId, ...rest } = p
  return rest
}


/** Offers go out with their provider and request title denormalised, as the real API will. */
function hydrateOffer(offer: Offer): Offer {
  return {
    ...offer,
    provider: providers.find((p) => p.id === offer.providerId),
    requestTitle: requests.find((r) => r.id === offer.requestId)?.title,
  }
}

function hydrateOrder(order: OrderT): OrderT {
  return { ...order, attachments: attachments.filter((a) => a.orderId === order.id) }
}

function tokensFor(user: User) {
  const stamp = Date.now()
  return {
    access: `mock-access.${user.id}.${stamp}`,
    refresh: `mock-refresh.${user.id}.${stamp}`,
  }
}

export const handlers = [
  // ---------------------------------------------------------------- auth
  http.post(url('/auth/login'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as { email?: string; password?: string }
    if (!body.email || !body.password || body.password.length < 4) {
      return HttpResponse.json({ detail: 'That email and password do not match.' }, { status: 401 })
    }
    const user = currentUser()
    return HttpResponse.json({ ...tokensFor(user), user })
  }),

  http.post(url('/auth/register'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<User> & { password?: string }
    const user: User = {
      ...currentUser(),
      email: body.email ?? currentUser().email,
      fullName: body.fullName ?? currentUser().fullName,
      country: body.country ?? 'Kazakhstan',
      isProvider: Boolean(body.isProvider),
    }
    users[0] = user
    return HttpResponse.json({ ...tokensFor(user), user }, { status: 201 })
  }),

  http.post(url('/auth/refresh'), async () => {
    await latency()
    return HttpResponse.json(tokensFor(currentUser()))
  }),

  http.get(url('/auth/me'), async () => {
    await latency()
    return HttpResponse.json(currentUser())
  }),

  http.patch(url('/auth/me'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<User>
    users[0] = { ...currentUser(), ...body }
    return HttpResponse.json(users[0])
  }),

  // ------------------------------------------------------------ categories
  http.get(url('/categories'), async () => {
    await latency()
    return HttpResponse.json(page(categories))
  }),

  // -------------------------------------------------------------- requests
  http.get(url('/requests'), async ({ request }) => {
    await latency()
    const params = new URL(request.url).searchParams
    const mine = params.get('mine') === 'true'
    const status = params.get('status')
    const categoryId = params.get('categoryId')
    const search = params.get('search')?.toLowerCase().trim()

    let results = [...requests]
    if (mine) {
      // The customer's own requests.
      results = results.filter((r) => ownsRequest(r.id))
    } else if (status === 'published') {
      // The provider Browse feed. You never see, or bid on, your own request.
      results = results.filter((r) => !ownsRequest(r.id))
    }
    if (status) results = results.filter((r) => r.status === status)
    if (categoryId) results = results.filter((r) => r.categoryId === categoryId)
    if (search) {
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          (fullDescription.get(r.id) ?? '').toLowerCase().includes(search),
      )
    }
    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const signedIn = isSignedIn(request)
    return HttpResponse.json(page(results.map((r) => projectRequest(r, signedIn))))
  }),

  http.get(url('/requests/:id'), async ({ params, request }) => {
    await latency()
    const found = requests.find((r) => r.id === params.id)
    return found ? HttpResponse.json(projectRequest(found, isSignedIn(request))) : notFound('Request')
  }),

  http.post(url('/requests'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<RequestT> & { description?: string }
    const created: RequestT = {
      id: nextId('req'),
      title: body.title ?? '',
      categoryId: body.categoryId ?? categories[0]!.id,
      budgetMin: body.budgetMin ?? 0,
      budgetMax: body.budgetMax ?? 0,
      currency: body.currency ?? 'USD',
      deadline: body.deadline ?? null,
      status: 'draft',
      offerCount: 0,
      createdAt: new Date().toISOString(),
      description: null,
      descriptionPreview: '',
      descriptionTruncated: false,
      isMine: true,
    }
    requests.unshift(created)
    requestOwner.set(created.id, CURRENT_USER_ID)
    fullDescription.set(created.id, body.description ?? '')
    return HttpResponse.json(projectRequest(created, true), { status: 201 })
  }),

  http.patch(url('/requests/:id'), async ({ params, request }) => {
    await latency()
    const index = requests.findIndex((r) => r.id === params.id)
    if (index === -1) return notFound('Request')
    const body = (await request.json()) as Partial<RequestT> & { description?: string }
    if (typeof body.description === 'string') fullDescription.set(requests[index]!.id, body.description)
    const { description: _ignored, ...rest } = body
    requests[index] = { ...requests[index]!, ...rest }
    return HttpResponse.json(projectRequest(requests[index]!, true))
  }),

  http.post(url('/requests/:id/submit'), async ({ params }) => {
    await latency()
    const found = requests.find((r) => r.id === params.id)
    if (!found) return notFound('Request')
    if (found.status !== 'draft') return conflict('This request has already been submitted.')
    // Moderation is instant in the mock so the offer flow stays walkable.
    found.status = 'published'
    return HttpResponse.json(projectRequest(found, true))
  }),

  http.get(url('/requests/:id/offers'), async ({ params }) => {
    await latency()
    const found = requests.find((r) => r.id === params.id)
    if (!found) return notFound('Request')
    // Sealed bids: only the customer who posted the request reads its offers.
    // Public pitches would let providers undercut each other.
    if (!ownsRequest(found.id)) {
      return HttpResponse.json({ detail: 'Only the customer who posted this request can see its offers.' }, { status: 403 })
    }
    const list = offers
      .filter((o) => o.requestId === params.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(hydrateOffer)
    return HttpResponse.json(page(list))
  }),

  http.post(url('/requests/:id/offers'), async ({ params, request }) => {
    await latency()
    const target = requests.find((r) => r.id === params.id)
    if (!target) return notFound('Request')
    if (target.status !== 'published') return conflict('This request is not taking offers.')
    if (ownsRequest(target.id)) return conflict('You cannot bid on your own request.')

    const body = (await request.json()) as { price: number; deliveryDays: number; message: string }
    const created: Offer = {
      id: nextId('off'),
      requestId: target.id,
      providerId: MY_PROVIDER_ID,
      price: body.price,
      currency: target.currency,
      deliveryDays: body.deliveryDays,
      message: body.message,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    }
    offers.push(created)
    target.offerCount += 1
    return HttpResponse.json(hydrateOffer(created), { status: 201 })
  }),

  // ---------------------------------------------------------------- offers
  http.get(url('/providers/me/offers'), async () => {
    await latency()
    const mine = offers
      .filter((o) => o.providerId === MY_PROVIDER_ID)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(hydrateOffer)
    return HttpResponse.json(page(mine))
  }),

  http.post(url('/offers/:id/accept'), async ({ params }) => {
    await latency()
    const offer = offers.find((o) => o.id === params.id)
    if (!offer) return notFound('Offer')
    if (offer.status !== 'submitted') return conflict('This offer is no longer open.')

    const parent = requests.find((r) => r.id === offer.requestId)
    if (!parent) return notFound('Request')

    // Accepting one bid resolves the whole request: siblings are rejected and
    // the request closes, so no second order can ever be created from it.
    offer.status = 'accepted'
    for (const sibling of offers) {
      if (sibling.requestId === offer.requestId && sibling.id !== offer.id && sibling.status === 'submitted') {
        sibling.status = 'rejected'
      }
    }
    parent.status = 'closed_fulfilled'

    const provider = providers.find((p) => p.id === offer.providerId)
    const commission = commissionFor(offer.price)
    const order: OrderT = {
      id: nextId('ord'),
      offerId: offer.id,
      requestId: parent.id,
      customerId: CURRENT_USER_ID,
      providerId: offer.providerId,
      price: offer.price,
      commissionAmount: commission,
      totalCharged: offer.price + commission,
      currency: offer.currency,
      status: 'awaiting_payment',
      fundedAt: null,
      deliveredAt: null,
      reviewDeadlineAt: null,
      completedAt: null,
      requestTitle: parent.title,
      providerName: provider?.displayName ?? 'Provider',
      customerName: currentUser().fullName,
      payoutStatus: 'pending',
      payoutMethod: 'payoneer',
    }
    orders.unshift(order)
    return HttpResponse.json(hydrateOrder(order), { status: 201 })
  }),

  http.post(url('/offers/:id/withdraw'), async ({ params }) => {
    await latency()
    const offer = offers.find((o) => o.id === params.id)
    if (!offer) return notFound('Offer')
    if (offer.status !== 'submitted') return conflict('Only a submitted offer can be withdrawn.')
    offer.status = 'withdrawn'
    const parent = requests.find((r) => r.id === offer.requestId)
    if (parent) parent.offerCount = Math.max(0, parent.offerCount - 1)
    return HttpResponse.json(hydrateOffer(offer))
  }),

  // ---------------------------------------------------------------- orders
  http.get(url('/orders'), async ({ request }) => {
    await latency()
    const params = new URL(request.url).searchParams
    const role = params.get('role')
    const mine = params.get('mine') === 'true'
    let results = [...orders]
    if (role === 'provider') {
      results = results.filter((o) => o.providerId === MY_PROVIDER_ID)
    } else if (role === 'customer' || mine) {
      // `mine` with no role means the customer side — the Dashboard.
      results = results.filter((o) => o.customerId === CURRENT_USER_ID)
    }
    results.sort((a, b) => (b.fundedAt ?? '').localeCompare(a.fundedAt ?? ''))
    return HttpResponse.json(page(results.map(hydrateOrder)))
  }),

  http.get(url('/orders/:id'), async ({ params }) => {
    await latency()
    const order = orders.find((o) => o.id === params.id)
    return order ? HttpResponse.json(hydrateOrder(order)) : notFound('Order')
  }),

  http.post(url('/orders/:id/pay'), async ({ params }) => {
    await latency()
    const order = orders.find((o) => o.id === params.id)
    if (!order) return notFound('Order')
    if (order.status !== 'awaiting_payment') return conflict('This order has already been paid.')

    order.status = 'funded'
    order.fundedAt = new Date().toISOString()

    // The provider "delivers" shortly after funding so the review flow is
    // reachable in a single sitting without a second actor.
    window.setTimeout(() => {
      if (order.status !== 'funded') return
      order.status = 'delivered'
      order.deliveredAt = new Date().toISOString()
      order.reviewDeadlineAt = new Date(Date.now() + 3 * 86_400_000).toISOString()
      const file: Attachment = {
        id: nextId('att'),
        orderId: order.id,
        originalFilename: `${(order.requestTitle ?? 'delivery').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 1_942_310,
        avScanStatus: 'clean',
        uploadedAt: new Date().toISOString(),
      }
      attachments.push(file)
    }, 6000)

    return HttpResponse.json(hydrateOrder(order))
  }),

  http.post(url('/orders/:id/accept'), async ({ params }) => {
    await latency()
    const order = orders.find((o) => o.id === params.id)
    if (!order) return notFound('Order')
    if (order.status !== 'delivered' && order.status !== 'under_review') {
      return conflict('There is nothing to accept on this order yet.')
    }
    order.status = 'completed'
    order.completedAt = new Date().toISOString()
    order.payoutStatus = 'initiated'
    return HttpResponse.json(hydrateOrder(order))
  }),

  http.post(url('/orders/:id/request-correction'), async ({ params }) => {
    await latency()
    const order = orders.find((o) => o.id === params.id)
    if (!order) return notFound('Order')
    if (order.status !== 'delivered' && order.status !== 'under_review') {
      return conflict('A correction can only be requested on a delivered order.')
    }
    order.status = 'under_review'
    return HttpResponse.json(hydrateOrder(order))
  }),

  http.post(url('/orders/:id/dispute'), async ({ params }) => {
    await latency()
    const order = orders.find((o) => o.id === params.id)
    if (!order) return notFound('Order')
    if (order.status === 'completed' || order.status === 'refunded') {
      return conflict('This order is already closed.')
    }
    order.status = 'disputed'
    return HttpResponse.json(hydrateOrder(order))
  }),

  http.post(url('/orders/:id/review'), async ({ params, request }) => {
    await latency()
    const order = orders.find((o) => o.id === params.id)
    if (!order) return notFound('Order')
    if (reviews.some((r) => r.orderId === order.id)) {
      return conflict('You have already reviewed this order.')
    }
    const body = (await request.json()) as { rating: number; comment: string }
    const review: Review = {
      id: nextId('rev'),
      orderId: order.id,
      authorId: CURRENT_USER_ID,
      rating: body.rating,
      comment: body.comment,
      createdAt: new Date().toISOString(),
    }
    reviews.push(review)
    return HttpResponse.json(review, { status: 201 })
  }),

  http.get(url('/attachments/:id/download'), async ({ params }) => {
    await latency()
    const file = attachments.find((a) => a.id === params.id)
    if (!file) return notFound('File')
    if (file.avScanStatus !== 'clean') return conflict('This file has not passed the malware scan.')
    return HttpResponse.text(`Mock contents of ${file.originalFilename}`, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${file.originalFilename}"`,
      },
    })
  }),

  // ------------------------------------------------------------- providers
  http.get(url('/providers'), async ({ request }) => {
    await latency()
    const categoryId = new URL(request.url).searchParams.get('categoryId')
    let list = [...providers]
    if (categoryId) list = list.filter((p) => p.categories.includes(categoryId))
    list.sort((a, b) => b.completedOrders - a.completedOrders)
    return HttpResponse.json(page(list.map(projectProvider)))
  }),

  http.get(url('/providers/me'), async () => {
    await latency()
    const profile = myProvider()
    return profile ? HttpResponse.json(profile) : notFound('Provider profile')
  }),

  http.patch(url('/providers/me'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Record<string, unknown>
    let profile = myProvider()
    if (!profile) {
      profile = {
        id: MY_PROVIDER_ID,
        userId: CURRENT_USER_ID,
        displayName: '',
        bio: '',
        categories: [],
        kycStatus: 'not_started',
        ratingAvg: 0,
        ratingCount: 0,
        completedOrders: 0,
      }
      providers.push(profile)
    }
    Object.assign(profile, body)
    users[0] = { ...currentUser(), isProvider: true }
    return HttpResponse.json(profile)
  }),

  http.get(url('/providers/:id'), async ({ params }) => {
    await latency()
    const found = providers.find((p) => p.id === params.id)
    return found ? HttpResponse.json(projectProvider(found)) : notFound('Provider')
  }),

  http.post(url('/providers/me/kyc'), async () => {
    await latency()
    const profile = myProvider()
    if (!profile) return notFound('Provider profile')
    if (profile.kycStatus === 'verified') return conflict('You are already verified.')
    profile.kycStatus = 'pending'
    return HttpResponse.json(profile)
  }),
]
