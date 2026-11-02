<script setup lang="ts">
import BaseButton from '../components/BaseButton.vue'
const principles = [
  {
    n: '01',
    title: 'Plain terms',
    text: 'Price, deadline and scope are written down before any work begins.',
  },
  {
    n: '02',
    title: 'Real people',
    text: 'Every offer is written by the expert who would do the job.',
  },
  { n: '03', title: 'Visible money', text: 'Both sides can always see where the payment is held.' },
  { n: '04', title: 'Fair review', text: 'Work is checked before payment is released.' },
]
</script>
<template>
  <div class="page narrow">
    <div class="eyebrow">About us</div>
    <h1>About Sabil Qalam</h1>
    <p class="page-intro">
      Sabil Qalam is a marketplace for expert-written material. A customer describes what they
      need, experts send offers, and the customer chooses the one that fits.
    </p>
    <section class="section section-flush-bottom">
      <h2>Mission</h2>
      <p>
        We all set our own life goals and define who we are, what we live for, and what our mission
        is. A significant part of our lives has always been dedicated to helping others and sharing our
        experiences in the hope of making people's lives better and happier.
      </p>
      <p>
        We cannot fully enjoy our lives knowing that there are people who need support. This is why
        we have always wanted to create something that would benefit not just a few individuals, but
        millions of people around the world.
      </p>
      <p>
        It started with books that share experiences of achieving life goals, overcoming
        challenges, becoming stronger, and never losing hope. We felt we could do more, and that is
        how the idea of Sabil Qalam was born.
      </p>
      <p>
        Sabil Qalam is a global community that connects people from around the world to share
        knowledge, experiences, expertise, ideas, books, and opportunities for personal growth and
        development.
      </p>
      <p>
        Behind Sabil Qalam is a dedicated team that strongly believes our mission is not only to
        consume from the world around us, but also to contribute to it and make a positive
        difference. We firmly believe that the best people are those who are most beneficial to
        others.
      </p>
      <p>
        We hope you will find inspiration in our vision and become part of the Sabil Qalam family.
      </p>
    </section>
    <section class="section section-flush-top section-flush-bottom">
      <h2>Vision</h2>
      <p>
        Our long-term vision is to connect millions of people worldwide by creating a simple and
        accessible platform where knowledge, experience, expertise, and opportunities can be shared
        to benefit others.
      </p>
    </section>
    <section class="section section-flush-top">
      <h2>What we stand for</h2>
      <div class="process-grid">
        <div v-for="item in principles" :key="item.n" class="process">
          <div class="steps">{{ item.n }}</div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </div>
      </div>
    </section>
    <div class="panel">
      <h2>Ready to start?</h2>
      <p>Post what you need, or see how the process works first.</p>
      <BaseButton to="/requests/new">Post a request ↗</BaseButton>
      <BaseButton to="/how-it-works" variant="outline">How it works</BaseButton>
    </div>
  </div>
</template>
