/**
 * In-memory fixture store for the MSW dev server.
 *
 * Content is lifted from `sabil_design_v1.html` so every screen boots looking
 * like the mockup. Deadlines are computed from `Date.now()` at module load
 * (never hardcoded), with a half-day of slack so "4 days left" reads as 4
 * rather than flooring to 3.
 *
 * The signed-in user is deliberately BOTH sides of the marketplace so all ten
 * screens are reachable from one session — but they are two distinct
 * identities: Alisher B. the customer owns `myRequestIds`, and Alisher B. the
 * provider (`prv-me`) only ever bids on requests owned by someone else. A
 * provider never sees or bids on their own request.
 *
 * Mutations keep the graph consistent: accepting an offer rejects its siblings,
 * closes the request, and creates the order the customer pays for.
 */
import type {
  Attachment,
  Category,
  Offer,
  OrderT,
  ProviderProfile,
  RequestT,
  Review,
  User,
} from '@/types/entities'

const DAY = 86_400_000
const HOUR = 3_600_000
const now = Date.now()
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString()
/** Deadlines carry +12h so a "4 day" deadline does not floor to "3 days left". */
const deadlineIn = (days: number) => iso(days * DAY + 12 * HOUR)

/** The platform's cut. $480 → $58 fee → $538 total, matching the checkout screen. */
export const COMMISSION_RATE = 0.12
export const commissionFor = (price: number) => Math.round(price * COMMISSION_RATE)

export const CURRENT_USER_ID = 'usr-me'
export const MY_PROVIDER_ID = 'prv-me'

export const users: User[] = [
  {
    id: CURRENT_USER_ID,
    email: 'alisher@example.kz',
    fullName: 'Alisher Bekov',
    isProvider: true,
    isAdmin: false,
    country: 'Kazakhstan',
    preferredLanguage: 'en',
  },
]

export const categories: Category[] = [
  { id: 'cat-research', name: 'Research brief', description: 'Market, competitor or industry analysis' },
  { id: 'cat-template', name: 'Template & SOP', description: 'Reusable process or document template' },
  { id: 'cat-certification', name: 'Certification prep', description: 'Study materials for a professional exam' },
]

export const providers: ProviderProfile[] = [
  {
    id: MY_PROVIDER_ID,
    userId: CURRENT_USER_ID,
    displayName: 'Alisher B.',
    bio: 'Procurement and operations background. I write buyer-side comparisons, onboarding SOPs and exam prep material.',
    categories: ['cat-research', 'cat-template'],
    kycStatus: 'verified',
    ratingAvg: 4.8,
    ratingCount: 22,
    completedOrders: 31,
  },
  {
    id: 'prv-aigerim',
    userId: 'usr-aigerim',
    displayName: 'Aigerim K.',
    bio: 'I publish landscape reports on enterprise infrastructure buyers.',
    categories: ['cat-research'],
    kycStatus: 'verified',
    ratingAvg: 4.9,
    ratingCount: 17,
    completedOrders: 18,
  },
  {
    id: 'prv-nurlan',
    userId: 'usr-nurlan',
    displayName: 'Nurlan T.',
    bio: 'Former analyst at a data-infrastructure vendor.',
    categories: ['cat-research', 'cat-certification'],
    kycStatus: 'verified',
    ratingAvg: 4.7,
    ratingCount: 26,
    completedOrders: 31,
  },
  {
    id: 'prv-dana',
    userId: 'usr-dana',
    displayName: 'Dana S.',
    bio: 'I run primary interviews rather than relying only on public materials.',
    categories: ['cat-research', 'cat-template'],
    kycStatus: 'verified',
    ratingAvg: 5.0,
    ratingCount: 9,
    completedOrders: 9,
  },
]

/**
 * Request ownership. Not part of the public `RequestT` shape (the real API
 * scopes by the authenticated user), so it lives beside the fixtures.
 */
export const requestOwner = new Map<string, string>()

/**
 * The full brief, held apart from the request record. Handlers decide per
 * viewer whether to serve it — a guest only ever receives the preview.
 */
export const fullDescription = new Map<string, string>()

type RequestSeed = Omit<
  RequestT,
  | 'currency'
  | 'createdAt'
  | 'description'
  | 'descriptionPreview'
  | 'descriptionTruncated'
  | 'isMine'
> & {
  currency?: string
  createdAt?: string
  description: string
}

function request(seed: RequestSeed, ownerId: string): RequestT {
  const { description, ...rest } = seed
  const full: RequestT = {
    currency: 'USD',
    createdAt: iso(-7 * DAY),
    ...rest,
    // Both fields are filled per-viewer by the handler's projection.
    description: null,
    descriptionPreview: '',
    descriptionTruncated: false,
    isMine: false,
  }
  requestOwner.set(full.id, ownerId)
  fullDescription.set(full.id, description)
  return full
}

export const requests: RequestT[] = [
  // ---- owned by the signed-in customer (the Dashboard's two lists) ----
  request(
    {
      id: 'req-observability',
      title: 'Competitive landscape brief: enterprise data-observability tools',
      description:
        'Need a comparison of the top 5 vendors in the data-observability space, covering pricing tiers, integration depth, and recent funding. Will use this for an internal buy decision.',
      categoryId: 'cat-research',
      budgetMin: 450,
      budgetMax: 650,
      deadline: deadlineIn(4),
      status: 'published',
      offerCount: 3,
      createdAt: iso(-6 * DAY),
    },
    CURRENT_USER_ID,
  ),
  request(
    {
      id: 'req-vendor-sop',
      title: 'Vendor onboarding SOP for a 40-person procurement team',
      description:
        'A step-by-step onboarding process our procurement team can follow without training, with role-based sign-offs we can drop into our existing wiki.',
      categoryId: 'cat-template',
      budgetMin: 300,
      budgetMax: 400,
      deadline: deadlineIn(2),
      status: 'published',
      offerCount: 0,
      createdAt: iso(-3 * DAY),
    },
    CURRENT_USER_ID,
  ),
  request(
    {
      id: 'req-pmp',
      title: 'PMP exam practice set with worked scenarios',
      description:
        'Practice questions with fully worked scenario answers for the first four weeks of a PMP study plan.',
      categoryId: 'cat-certification',
      budgetMin: 180,
      budgetMax: 260,
      deadline: deadlineIn(6),
      status: 'closed_fulfilled',
      offerCount: 1,
      createdAt: iso(-12 * DAY),
    },
    CURRENT_USER_ID,
  ),

  // ---- owned by others: the provider Browse feed ----
  request(
    {
      id: 'req-okr',
      title: 'Quarterly OKR template for a marketing team',
      description: 'A quarterly OKR template with worked examples for a ten-person marketing team.',
      categoryId: 'cat-template',
      budgetMin: 220,
      budgetMax: 300,
      deadline: deadlineIn(5),
      status: 'published',
      offerCount: 2,
      createdAt: iso(-6 * DAY),
    },
    'usr-aliya',
  ),
  request(
    {
      id: 'req-intake',
      title: 'Supplier intake questionnaire for a logistics operator',
      description:
        'An intake questionnaire we can send new suppliers, covering compliance, insurance and capacity, with a short scoring rubric.',
      categoryId: 'cat-template',
      budgetMin: 260,
      budgetMax: 360,
      deadline: deadlineIn(9),
      status: 'published',
      offerCount: 1,
      createdAt: iso(-1 * DAY),
    },
    'usr-bekzat',
  ),
  request(
    {
      id: 'req-cfa',
      title: 'CFA Level I ethics drill set with explanations',
      description:
        'Drill questions on the ethics section with an explanation of why each distractor is wrong.',
      categoryId: 'cat-certification',
      budgetMin: 200,
      budgetMax: 300,
      deadline: deadlineIn(11),
      status: 'published',
      offerCount: 1,
      createdAt: iso(-4 * HOUR),
    },
    'usr-aliya',
  ),
  request(
    {
      id: 'req-bench',
      title: 'Benefits benchmarking pack for a 200-person employer',
      description: 'Benchmark our benefits package against comparable employers in the region.',
      categoryId: 'cat-research',
      budgetMin: 480,
      budgetMax: 620,
      deadline: iso(-60 * DAY),
      status: 'closed_fulfilled',
      offerCount: 1,
      createdAt: iso(-75 * DAY),
    },
    'usr-bekzat',
  ),
]

export const offers: Offer[] = [
  // Three bids on the customer's open request — the comparison screen.
  {
    id: 'off-aigerim',
    requestId: 'req-observability',
    providerId: 'prv-aigerim',
    price: 520,
    currency: 'USD',
    deliveryDays: 3,
    message:
      "I've published two landscape reports on enterprise infrastructure buyers this year, both cited by procurement teams. I'll include a comparison matrix and named vendor sourcing.",
    status: 'submitted',
    createdAt: iso(-3 * DAY),
  },
  {
    id: 'off-nurlan',
    requestId: 'req-observability',
    providerId: 'prv-nurlan',
    price: 480,
    currency: 'USD',
    deliveryDays: 2,
    message:
      'Former analyst at a data-infra vendor, so I know the category from the inside. Can turn this around fast without losing depth on the technical comparison.',
    status: 'submitted',
    createdAt: iso(-2 * DAY),
  },
  {
    id: 'off-dana',
    requestId: 'req-observability',
    providerId: 'prv-dana',
    price: 610,
    currency: 'USD',
    deliveryDays: 5,
    message:
      "I'll run primary interviews with two vendors' sales engineers rather than relying only on public materials, so the brief has findings your team can't get from a search engine.",
    status: 'submitted',
    createdAt: iso(-1 * DAY),
  },
  // The customer's accepted offer, which became their active order.
  {
    id: 'off-pmp-nurlan',
    requestId: 'req-pmp',
    providerId: 'prv-nurlan',
    price: 220,
    currency: 'USD',
    deliveryDays: 6,
    message:
      'I have run PMP study cohorts twice. Each practice question comes with a worked scenario answer explaining why the other options fail.',
    status: 'accepted',
    createdAt: iso(-11 * DAY),
  },

  // ---- the signed-in provider's own bids: the "My offers" screen ----
  {
    id: 'off-me-bench',
    requestId: 'req-bench',
    providerId: MY_PROVIDER_ID,
    price: 480,
    currency: 'USD',
    deliveryDays: 7,
    message:
      'I benchmark benefits packages for mid-size employers regularly and will source comparators from named local employers, not survey averages.',
    status: 'accepted',
    createdAt: iso(-74 * DAY),
  },
  {
    id: 'off-me-intake',
    requestId: 'req-intake',
    providerId: MY_PROVIDER_ID,
    price: 320,
    currency: 'USD',
    deliveryDays: 5,
    message:
      'I have built supplier intake questionnaires for two logistics operators. I will include the scoring rubric and a one-page reviewer guide so the result is usable without training.',
    status: 'submitted',
    createdAt: iso(-5 * HOUR),
  },
  {
    id: 'off-me-cfa',
    requestId: 'req-cfa',
    providerId: MY_PROVIDER_ID,
    price: 240,
    currency: 'USD',
    deliveryDays: 6,
    message:
      'Each drill question will come with a short explanation of why every distractor fails, which is what makes the ethics section stick.',
    status: 'submitted',
    createdAt: iso(-2 * HOUR),
  },
  {
    id: 'off-me-okr',
    requestId: 'req-okr',
    providerId: MY_PROVIDER_ID,
    price: 260,
    currency: 'USD',
    deliveryDays: 4,
    message:
      'I would structure this as a quarterly template with two worked examples, one for demand generation and one for brand.',
    status: 'withdrawn',
    createdAt: iso(-6 * DAY),
  },
]

export const attachments: Attachment[] = [
  {
    id: 'att-pmp',
    orderId: 'ord-pmp',
    originalFilename: 'pmp-practice-set-weeks-1-4.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2_516_582, // 2.4 MB, as on the order-status screen
    avScanStatus: 'clean',
    uploadedAt: iso(-6 * HOUR),
  },
]

/**
 * Pins a date inside the CURRENT calendar month regardless of today's date, so
 * the Earnings "This month" stat is stable. Provider fixtures are tuned so the
 * three derived stats land on the mockup's figures exactly:
 * total earned $4,260 · pending payout $480 · this month $1,120.
 */
function thisMonth(day: number): string {
  const d = new Date(now)
  d.setDate(1)
  d.setHours(9, 0, 0, 0)
  d.setDate(Math.min(day, new Date(now).getDate()))
  return d.toISOString()
}

function providerOrder(
  key: string,
  requestTitle: string,
  price: number,
  payoutStatus: NonNullable<OrderT['payoutStatus']>,
  completedAt: string,
  payoutMethod = 'payoneer',
  customerName = 'Aliya M.',
): OrderT {
  const commission = commissionFor(price)
  return {
    id: `ord-${key}`,
    offerId: `off-${key}`,
    requestId: `req-${key}`,
    customerId: 'usr-aliya',
    providerId: MY_PROVIDER_ID,
    price,
    commissionAmount: commission,
    totalCharged: price + commission,
    currency: 'USD',
    status: 'completed',
    fundedAt: completedAt,
    deliveredAt: completedAt,
    reviewDeadlineAt: completedAt,
    completedAt,
    requestTitle,
    providerName: 'Alisher B.',
    customerName,
    payoutStatus,
    payoutMethod,
  }
}

function customerOrder(key: string, requestTitle: string, price: number, providerName: string, completedAt: string): OrderT {
  const commission = commissionFor(price)
  return {
    id: `ord-${key}`,
    offerId: `off-${key}`,
    requestId: `req-${key}`,
    customerId: CURRENT_USER_ID,
    providerId: 'prv-nurlan',
    price,
    commissionAmount: commission,
    totalCharged: price + commission,
    currency: 'USD',
    status: 'completed',
    fundedAt: completedAt,
    deliveredAt: completedAt,
    reviewDeadlineAt: completedAt,
    completedAt,
    requestTitle,
    providerName,
    customerName: 'Alisher Bekov',
    payoutStatus: 'paid',
    payoutMethod: 'payoneer',
  }
}

export const orders: OrderT[] = [
  // The customer's live order — the Dashboard "Active orders" row and the
  // order-status screen. Delivered and awaiting the customer's acceptance.
  {
    id: 'ord-pmp',
    offerId: 'off-pmp-nurlan',
    requestId: 'req-pmp',
    customerId: CURRENT_USER_ID,
    providerId: 'prv-nurlan',
    price: 220,
    commissionAmount: commissionFor(220),
    totalCharged: 220 + commissionFor(220),
    currency: 'USD',
    status: 'under_review',
    fundedAt: iso(-3 * DAY),
    deliveredAt: iso(-6 * HOUR),
    reviewDeadlineAt: iso(2 * DAY + 12 * HOUR),
    completedAt: null,
    requestTitle: 'PMP exam practice set with worked scenarios',
    providerName: 'Nurlan T.',
    customerName: 'Alisher Bekov',
    payoutStatus: 'pending',
    payoutMethod: 'payoneer',
  },

  // The customer's history — the Dashboard's "Completed" stat.
  customerOrder('c1', 'Data warehouse vendor shortlist', 430, 'Aigerim K.', iso(-40 * DAY)),
  customerOrder('c2', 'Contract review checklist for SaaS purchases', 260, 'Dana S.', iso(-62 * DAY)),
  customerOrder('c3', 'Procurement policy refresh for a growing team', 510, 'Nurlan T.', iso(-88 * DAY)),
  customerOrder('c4', 'Interview guide for hiring a category manager', 190, 'Dana S.', iso(-110 * DAY)),
  customerOrder('c5', 'Total-cost-of-ownership model for fleet leasing', 620, 'Aigerim K.', iso(-135 * DAY)),
  customerOrder('c6', 'Supplier consolidation options memo', 380, 'Nurlan T.', iso(-160 * DAY)),

  // ---- the signed-in provider's ledger: the Earnings screen ----
  // Completed but payout still moving — with ord-pmp's $220 this is $480 pending.
  // This month: 480 + 640 = $1,120. The $480 is still moving, so it is also
  // the whole of "Pending payout".
  providerOrder('bench', 'Benefits benchmarking pack for a 200-person employer', 480, 'initiated', thisMonth(4), 'payoneer', 'Bekzat S.'),
  providerOrder('sop-intake', 'Supplier intake SOP for a logistics operator', 640, 'paid', thisMonth(9)),
  // Earlier months. Everything completed sums to $4,260 total earned.
  providerOrder('prep-cfa', 'CFA Level I ethics drill set', 240, 'paid', iso(-45 * DAY), 'local_bank_kz'),
  providerOrder('okr-done', 'Quarterly OKR template for a fintech marketing team', 260, 'paid', iso(-80 * DAY)),
  providerOrder('risk', 'Vendor risk-assessment checklist', 240, 'paid', iso(-120 * DAY), 'local_bank_kz'),
  providerOrder('mkt-entry', 'Market-entry brief: fintech licensing in Uzbekistan', 700, 'paid', iso(-95 * DAY), 'payoneer', 'Bekzat S.'),
  providerOrder('sec-audit', 'Security questionnaire response playbook', 720, 'paid', iso(-140 * DAY)),
  providerOrder('pmo', 'PMO reporting pack for a construction programme', 680, 'paid', iso(-170 * DAY), 'local_bank_kz', 'Bekzat S.'),
  providerOrder('policy', 'Procurement policy template for a scale-up', 300, 'paid', iso(-155 * DAY)),
]

export const reviews: Review[] = []

let sequence = 100
export const nextId = (prefix: string) => `${prefix}-${sequence++}`
