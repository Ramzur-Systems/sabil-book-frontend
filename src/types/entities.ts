/**
 * Mirrors the backend's source-of-truth enums (technical spec §4).
 * Never add a frontend-only status here.
 */

export type RequestStatus =
  | 'draft'
  | 'pending_moderation'
  | 'published'
  | 'closed_fulfilled'
  | 'closed_no_offer'
  | 'cancelled'

export type OfferStatus = 'submitted' | 'accepted' | 'rejected' | 'withdrawn'

export type OrderStatus =
  | 'awaiting_payment'
  | 'funded'
  | 'delivered'
  | 'under_review'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'partially_resolved'
  | 'cancelled'

export type PayoutStatus = 'pending' | 'initiated' | 'paid' | 'failed' | 'cancelled'

export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected'

export type AvScanStatus = 'pending' | 'clean' | 'infected'

export interface User {
  id: string
  email: string
  fullName: string
  isProvider: boolean
  isAdmin: boolean
  country: string
  preferredLanguage: string
}

export interface ProviderProfile {
  id: string
  /** Omitted on public profiles — the account behind a provider is not public. */
  userId?: string
  displayName: string
  bio: string
  categories: string[]
  kycStatus: KycStatus
  ratingAvg: number
  ratingCount: number
  completedOrders: number
}

export interface Category {
  id: string
  name: string
  description: string
}

export interface RequestT {
  id: string
  title: string
  /**
   * The full brief. `null` for anonymous visitors — a customer's description
   * carries procurement detail we don't index publicly. Signing in reveals it.
   */
  description: string | null
  /** Always present: the first ~200 characters, safe to show publicly. */
  descriptionPreview: string
  /**
   * True when the preview is actually shorter than the brief. A short brief is
   * fully visible to a guest, so the UI must not claim they're seeing an excerpt.
   */
  descriptionTruncated: boolean
  /** True when the viewer owns this request. Only the owner may read its offers. */
  isMine: boolean
  categoryId: string
  budgetMin: number
  budgetMax: number
  currency: string
  deadline: string | null
  status: RequestStatus
  offerCount: number
  createdAt: string
}

export interface Offer {
  id: string
  requestId: string
  providerId: string
  price: number
  currency: string
  deliveryDays: number
  message: string
  status: OfferStatus
  createdAt: string
  /** Denormalised by the API for list rendering; absent on write payloads. */
  provider?: ProviderProfile
  /** Denormalised request title, used on the provider's "My offers" list. */
  requestTitle?: string
}

export interface OrderT {
  id: string
  offerId: string
  requestId: string
  customerId: string
  providerId: string
  price: number
  commissionAmount: number
  totalCharged: number
  currency: string
  status: OrderStatus
  fundedAt: string | null
  deliveredAt: string | null
  reviewDeadlineAt: string | null
  completedAt: string | null
  /** Denormalised for list and header rendering. */
  requestTitle?: string
  providerName?: string
  customerName?: string
  payoutStatus?: PayoutStatus
  payoutMethod?: string
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  orderId: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  avScanStatus: AvScanStatus
  uploadedAt: string
}

export interface Review {
  id: string
  orderId: string
  authorId: string
  rating: number
  comment: string
  createdAt: string
}

export interface Paginated<T> {
  results: T[]
  count: number
}
