import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { updateSubscriptionByCustomerId } from '@/db/queries/subscriptions'

type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'incomplete':
      return 'incomplete'
    default:
      return 'canceled'
  }
}

function periodDates(subscription: Stripe.Subscription) {
  // Em versões recentes da API o período fica no item da assinatura
  const item = subscription.items.data[0] as
    | (Stripe.SubscriptionItem & {
        current_period_start?: number
        current_period_end?: number
      })
    | undefined
  const legacy = subscription as unknown as {
    current_period_start?: number
    current_period_end?: number
  }
  const start = item?.current_period_start ?? legacy.current_period_start
  const end = item?.current_period_end ?? legacy.current_period_end
  return {
    currentPeriodStart: start ? new Date(start * 1000) : null,
    currentPeriodEnd: end ? new Date(end * 1000) : null,
  }
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id
  const priceId = subscription.items.data[0]?.price.id ?? null
  const isPro = priceId === process.env.STRIPE_PRO_PRICE_ID
  const status = mapStatus(subscription.status)

  await updateSubscriptionByCustomerId(customerId, {
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    planId: isPro && ['active', 'trialing'].includes(status) ? 'pro' : 'free',
    status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    ...periodDates(subscription),
  })
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id
        )
        await syncSubscription(subscription)
      }
      break
    }
    case 'customer.subscription.updated': {
      await syncSubscription(event.data.object)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id
      await updateSubscriptionByCustomerId(customerId, {
        planId: 'free',
        status: 'canceled',
        stripeSubscriptionId: null,
        stripePriceId: null,
      })
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id
      if (customerId) {
        await updateSubscriptionByCustomerId(customerId, {
          status: 'past_due',
        })
      }
      break
    }
  }

  return Response.json({ received: true })
}
