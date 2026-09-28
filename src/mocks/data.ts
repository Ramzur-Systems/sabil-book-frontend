import type { Expert, MarketplaceRequest } from '../api/types'

export const requests: MarketplaceRequest[] = [
  {
    id: 'market-entry',
    category: 'Research',
    title: 'Market entry brief for a sustainable homeware brand',
    budget: '$350–$500',
    days: 6,
    offers: 4,
    description:
      'We need a concise research brief on the Kazakhstan homeware market. Cover customer segments, five relevant competitors, pricing, and practical entry opportunities. Please cite sources and deliver a clearly structured PDF.',
  },
  {
    id: 'operations-guide',
    category: 'Process documents',
    title: 'A clear onboarding guide for our small operations team',
    budget: '$180–$260',
    days: 9,
    offers: 2,
    description:
      'Turn our notes and current workflow into an onboarding guide for new team members. We will share internal reference material after selecting a provider. The result should be easy to maintain.',
  },
  {
    id: 'exam-notes',
    category: 'Exam preparation',
    title: 'Structured study notes for introductory economics',
    budget: '$120–$190',
    days: 4,
    offers: 6,
    description:
      'Create original, easy-to-follow revision notes covering the central ideas in introductory microeconomics. Include short examples and a glossary.',
  },
  {
    id: 'policy-summary',
    category: 'Research',
    title: 'Evidence summary on urban mobility programs',
    budget: '$280–$420',
    days: 12,
    offers: 1,
    description:
      'We are looking for a neutral evidence summary of urban mobility programs, with links to primary research and a brief comparison of outcomes.',
  },
]
export const experts: Expert[] = [
  {
    id: 'aida',
    name: 'Aida Nurgaliyeva',
    initials: 'AN',
    bio: 'Research writer turning complex findings into clear, decision-ready briefs.',
    tags: ['Research', 'Business'],
    rating: '4.9',
    reviews: 18,
    orders: 34,
  },
  {
    id: 'marat',
    name: 'Marat Seitzhan',
    initials: 'MS',
    bio: 'Operations specialist creating practical playbooks and process documentation.',
    tags: ['Process documents', 'Training'],
    rating: '4.8',
    reviews: 12,
    orders: 26,
  },
  {
    id: 'dana',
    name: 'Dana Kim',
    initials: 'DK',
    bio: 'Educator writing thoughtful study guides and original learning materials.',
    tags: ['Exam preparation', 'Education'],
    rating: 'New to Sabil',
    reviews: 0,
    orders: 0,
  },
]
