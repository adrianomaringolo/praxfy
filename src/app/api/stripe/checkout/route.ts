import { getCurrentUser } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import {
  getSubscriptionByUserId,
  upsertSubscription,
} from '@/db/queries/subscriptions'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    priceId?: string
  }
  const priceId = body.priceId ?? process.env.STRIPE_PRO_PRICE_ID
  if (!priceId) {
    return Response.json(
      { error: 'Plano não configurado.' },
      { status: 400 }
    )
  }

  // Recupera ou cria o customer no Stripe
  const subscription = await getSubscriptionByUserId(user.id)
  let customerId = subscription?.stripeCustomerId ?? null
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await upsertSubscription(user.id, { stripeCustomerId: customerId })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=1`,
    cancel_url: `${appUrl}/settings/billing`,
  })

  return Response.json({ url: session.url })
}
