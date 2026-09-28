import { z } from 'zod'

export const requestSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  budget: z.string(),
  days: z.number(),
  offers: z.number(),
  description: z.string(),
})
export const expertSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  bio: z.string(),
  tags: z.array(z.string()),
  rating: z.string(),
  reviews: z.number(),
  orders: z.number(),
})
export const userSchema = z.object({ id: z.string(), name: z.string(), email: z.string() })
export const requestDraftSchema = z.object({
  category: z.string().min(1, 'Choose a category'),
  title: z.string().trim().min(5, 'Add a descriptive title'),
  description: z.string().trim().min(20, 'Describe the work in at least 20 characters'),
  budget: z.coerce.number().positive('Enter a budget greater than zero'),
  deadline: z.string().min(1, 'Choose a deadline'),
})
export const offerDraftSchema = z.object({
  price: z.coerce.number().positive('Enter your price'),
  days: z.coerce.number().int().positive('Enter the delivery time'),
  message: z.string().trim().min(20, 'Explain your approach in at least 20 characters').max(1000),
})
export type MarketplaceRequest = z.infer<typeof requestSchema>
export type Expert = z.infer<typeof expertSchema>
export type User = z.infer<typeof userSchema>
export type RequestDraft = z.infer<typeof requestDraftSchema>
export type OfferDraft = z.infer<typeof offerDraftSchema>
export const categories = [
  ['Research', 'Briefs, synthesis and evidence-led reports'],
  ['Process documents', 'Guides, playbooks and operating procedures'],
  ['Exam preparation', 'Original revision material and study guides'],
  ['Training materials', 'Lessons and clear learning resources'],
] as const
