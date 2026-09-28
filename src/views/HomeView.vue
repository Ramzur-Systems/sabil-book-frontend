<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { marketplace } from '../api/marketplace'
import RequestRow from '../components/RequestRow.vue'
import ExpertCard from '../components/ExpertCard.vue'
import BaseButton from '../components/BaseButton.vue'

const requestQuery = useQuery({ queryKey: ['requests'], queryFn: marketplace.requests })
const expertQuery = useQuery({ queryKey: ['experts'], queryFn: marketplace.experts })
const isMock = import.meta.env.VITE_USE_MOCKS !== 'false'
const journey = [
  {
    number: '01',
    title: 'Post your need',
    copy: 'Set out the scope, budget and deadline.',
    image: '/hero-style-01-warm.png',
    alt: 'A customer writes a brief',
  },
  {
    number: '02',
    title: 'Choose an expert',
    copy: 'Compare private offers, prices and delivery times.',
    image: '/hero-style-02-warm.png',
    alt: 'A customer compares offers',
  },
  {
    number: '03',
    title: 'Payment is held',
    copy: 'Pay after accepting an offer. The funds stay in escrow.',
    image: '/hero-style-03-warm.png',
    alt: 'A customer places payment in safekeeping',
  },
  {
    number: '04',
    title: 'Accept the work',
    copy: 'Review the file. The expert is paid when you confirm receipt.',
    image: '/hero-style-04-warm.png',
    alt: 'A customer receives the work',
  },
]
</script>
<template>
  <section class="hero">
    <div class="shell hero-grid">
      <div class="hero-copy">
        <div class="eyebrow">Sabil Qalam · A marketplace for knowledge</div>
        <h1>The document you need, <em>thoughtfully written.</em></h1>
        <p>
          Tell us what you need and set your budget. Experts offer their approach, price and
          delivery time. Your payment is held until you accept the finished work.
        </p>
        <div class="hero-actions">
          <BaseButton to="/requests/new">Post a request ↗</BaseButton
          ><RouterLink to="/requests" class="hero-secondary"
            >I write this kind of material ↗</RouterLink
          >
        </div>
      </div>
      <div class="hero-art">
        <ul class="hero-notes" aria-label="What you can do next">
          <li>Decide with evidence</li>
          <li>Prepare with confidence</li>
          <li>Give your team a clear process</li>
        </ul>
        <img
          class="hero-vector"
          src="/hero-falling-books-paper.svg"
          alt="A student braces three giant books leaning toward him"
          fetchpriority="high"
        />
      </div>
    </div>
  </section>
  <section class="section">
    <div class="narrow">
      <div class="section-top">
        <div>
          <div class="eyebrow">The marketplace</div>
          <h2>Open requests</h2>
        </div>
        <p class="section-lead">
          Every project begins with a clear need. Explore what people are looking for.
        </p>
      </div>
      <p v-if="requestQuery.isPending.value" class="loading-state">Loading requests…</p>
      <p v-else-if="requestQuery.isError.value" class="error-state">Could not load requests.</p>
      <div v-else class="request-list">
        <RequestRow
          v-for="request in requestQuery.data.value?.slice(0, 3)"
          :key="request.id"
          :request="request"
        />
      </div>
      <div class="list-footer">
        <span class="meta">{{ isMock ? 'Illustrative requests for this design preview' : '' }}</span
        ><RouterLink to="/requests" class="link-arrow">See all open requests ↗</RouterLink>
      </div>
    </div>
  </section>
  <section class="section section-cream">
    <div class="narrow">
      <div class="eyebrow">A fair exchange</div>
      <div class="section-top">
        <h2>How the money moves</h2>
        <p class="section-lead">
          A straightforward path from your brief to a document you can use.
        </p>
      </div>
      <div class="journey-scene">
        <ol class="journey">
          <li v-for="step in journey" :key="step.number" class="journey-step">
            <div class="journey-figure">
              <img :src="step.image" :alt="step.alt" loading="lazy" />
            </div>
            <span class="journey-marker" aria-hidden="true">{{ step.number }}</span>
            <div class="journey-copy">
              <h3>{{ step.title }}</h3>
              <p>{{ step.copy }}</p>
            </div>
          </li>
        </ol>
      </div>
      <div class="list-footer">
        <RouterLink to="/how-it-works" class="link-arrow"
          >Fees, timing and what happens in a dispute ↗</RouterLink
        >
      </div>
    </div>
  </section>
  <section class="section section-white">
    <div class="narrow">
      <div class="section-top">
        <div>
          <div class="eyebrow">The people behind the work</div>
          <h2>Meet the experts</h2>
        </div>
        <p class="section-lead">Writers and specialists bringing care and context to every page.</p>
      </div>
      <p v-if="expertQuery.isPending.value" class="loading-state">Loading experts…</p>
      <p v-else-if="expertQuery.isError.value" class="error-state">Could not load experts.</p>
      <div v-else class="expert-list">
        <ExpertCard v-for="expert in expertQuery.data.value" :key="expert.id" :expert="expert" />
      </div>
      <div class="list-footer">
        <span class="meta">{{ isMock ? 'Illustrative profiles for this design preview' : '' }}</span
        ><RouterLink to="/experts" class="link-arrow">Explore all experts ↗</RouterLink>
      </div>
    </div>
  </section>
  <section class="section section-dark mission">
    <div class="narrow mission-inner">
      <div class="mission-copy">
        <div class="eyebrow">Why we exist</div>
        <h2>Knowledge grows when we share it.</h2>
        <p>
          Sabil Qalam brings people together to turn experience into something useful for someone
          else. Share what you know, find the help you need, and move forward together.
        </p>
      </div>
      <div class="mission-art">
        <img
          src="/mission-sharing-warm.png"
          alt="Two people exchange a useful document in green ink"
          loading="lazy"
        />
      </div>
    </div>
  </section>
  <section class="closing">
    <div class="narrow closing-inner">
      <div class="closing-copy">
        <div class="eyebrow">A place to begin</div>
        <h2>Post the need. <em>Find the right person.</em> Move forward.</h2>
        <BaseButton to="/requests/new">Post a request ↗</BaseButton>
      </div>
      <img class="closing-emblem" src="/nib-mark.svg" alt="" aria-hidden="true" />
    </div>
  </section>
</template>
