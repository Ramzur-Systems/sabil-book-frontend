<script setup lang="ts">
/**
 * The mechanic, written out for a stranger who is about to spend company money
 * here. Two tracks, each a genuine ordered sequence — which is the one place in
 * this product where numbered steps are earned.
 *
 * Nothing on this page states a fee, a timeline or a guarantee that isn't
 * pinned down in the system. The single number is the 12% service fee, shown
 * at checkout the same way.
 */
import Button from '@/components/ui/Button.vue'

interface Step {
  title: string
  body: string
}

const customerSteps: Step[] = [
  {
    title: 'Post the request',
    body: 'Describe the document you need, pick a category, set a budget range and a deadline. Posting commits you to nothing — you are asking for prices, not placing an order. You pay only when you accept an offer.',
  },
  {
    title: 'Moderation reads it',
    body: 'A request is checked before it reaches the expert feed. Until it is approved it sits in moderation, and the status is shown on the request itself.',
  },
  {
    title: 'Experts bid',
    body: 'Each offer carries a price, a delivery window and a few sentences from the expert about how they would approach the work. Offers are sealed: only you can read them, so nobody is pricing against a rival bid.',
  },
  {
    title: 'Compare the offers and accept one',
    body: 'The offers sit side by side on your request, each next to the rating and completed-order count of the person who wrote it. Accepting one closes the request to further bids.',
  },
  {
    title: 'Fund escrow',
    body: 'At checkout you pay the accepted price plus a 12% service fee. The money is held by Sabil rather than passed to the expert, and the expert starts only once the order shows as funded.',
  },
  {
    title: 'Receive the delivery and review it',
    body: 'The expert uploads the work to the order, which opens a review window — its deadline is shown on the order. If the delivery misses the brief, ask for a correction with a reason instead of accepting it.',
  },
  {
    title: 'Accept the work',
    body: 'Accepting releases the escrowed money to the expert and closes the order. You then rate the delivery, which is what builds the public rating on their profile.',
  },
  {
    title: 'Open a dispute if you cannot agree',
    body: 'If the correction does not settle it, open a dispute instead of accepting. The money stays in escrow while the dispute is reviewed, and the order ends as released, refunded or partially resolved depending on the outcome.',
  },
]

const providerSteps: Step[] = [
  {
    title: 'Create a provider profile',
    body: 'Your display name, the categories you work in and a short bio in your own words. That profile is what a customer reads in the public expert directory.',
  },
  {
    title: 'Pass the identity check',
    body: 'Identity verification is required before money can be paid out to you. A verified profile carries that state publicly, because the customer is paying a stranger.',
  },
  {
    title: 'Read the open requests',
    body: 'The feed lists published requests with their budget range, deadline and how many offers each has already drawn.',
  },
  {
    title: 'Bid on the ones you can do',
    body: 'An offer is a price, a number of delivery days and a short pitch. Only the customer sees it. You can withdraw it while the request is still open.',
  },
  {
    title: 'Wait for acceptance and funding',
    body: 'If your offer is accepted, the customer funds escrow. The order status tells you when the money is in, which is the point at which the work is worth starting.',
  },
  {
    title: 'Deliver into the order',
    body: 'Upload the finished file to the order. Attachments are virus-scanned before the customer can download them, so a file is briefly pending after upload.',
  },
  {
    title: 'Sit through the review window',
    body: 'The customer accepts the delivery or asks for a correction, and a correction request comes with a written reason. A dispute, if one is opened, holds the escrow until it is resolved.',
  },
  {
    title: 'Get paid',
    body: 'Acceptance releases escrow and sends the payout to your chosen method. The 12% service fee is added to the customer’s total at checkout rather than deducted from you, so your payout is the price you bid.',
  },
]
</script>

<template>
  <section>
    <header class="hiw__intro">
      <h1 class="hiw__title">How Sabil Books works</h1>
      <p class="hiw__lede">
        Sabil Books runs in reverse to a marketplace of listings: you describe the document you
        need, and experts compete for it with their own prices. Money sits in escrow from the moment
        you fund the order until you accept the delivery. Both sides of that transaction are written
        out below.
      </p>
    </header>

    <section class="hiw__track">
      <h2 class="hiw__track-title">If you need something written</h2>
      <p class="hiw__track-note">
        From an empty brief to an accepted document. You never pay before you have chosen a person
        and a price.
      </p>

      <ol class="steps">
        <li v-for="step in customerSteps" :key="step.title" class="step">
          <h3 class="step__title">{{ step.title }}</h3>
          <p class="step__body">{{ step.body }}</p>
        </li>
      </ol>
    </section>

    <section class="hiw__track">
      <h2 class="hiw__track-title">If you write</h2>
      <p class="hiw__track-note">
        From a profile to a payout. You bid against other experts, and you find out the money exists
        before you write a word.
      </p>

      <ol class="steps">
        <li v-for="step in providerSteps" :key="step.title" class="step">
          <h3 class="step__title">{{ step.title }}</h3>
          <p class="step__body">{{ step.body }}</p>
        </li>
      </ol>
    </section>

    <div class="hiw__close">
      <p class="hiw__close-body">
        Both tracks start in the same place: a request on the open feed.
      </p>
      <div class="hiw__close-actions">
        <Button :to="{ name: 'request-new' }">Post a request</Button>
        <Button variant="secondary" :to="{ name: 'browse' }">Read the open requests</Button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hiw__intro {
  padding-bottom: 32px;
  border-bottom: 1px solid var(--line);
}

.hiw__title {
  max-width: 640px;
  margin: 0 0 20px;
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 500;
  line-height: 1.3;
}

.hiw__lede {
  max-width: 68ch;
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--slate);
}

.hiw__track {
  margin-top: 56px;
}

.hiw__track-title {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
}

.hiw__track-note {
  max-width: 65ch;
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--slate);
}

/* A real sequence, so it is numbered — and numbered like clauses in a record,
   not as ornament. The counter sits in the title's own gutter. */
.steps {
  padding: 0;
  margin: 0;
  counter-reset: step;
  list-style: none;
  border-top: 1px solid var(--line);
}

.step {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 8px 32px;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
  counter-increment: step;
}

.step__title {
  position: relative;
  padding-left: 32px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.step__title::before {
  position: absolute;
  left: 0;
  color: var(--slate);
  content: counter(step) '.';
  font-variant-numeric: tabular-nums;
}

.step__body {
  max-width: 60ch;
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--slate);
}

.hiw__close {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 32px;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  margin-top: 56px;
  background: var(--paper);
  border: 1px solid var(--line);
}

.hiw__close-body {
  max-width: 48ch;
  margin: 0;
  font-size: 14px;
  color: var(--slate);
}

.hiw__close-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 720px) {
  .step {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .step__body {
    padding-left: 32px;
  }
}

@media (max-width: 560px) {
  .hiw__title {
    font-size: 24px;
  }

  .hiw__lede {
    font-size: 15px;
  }

  .hiw__close {
    padding: 20px;
  }
}
</style>
