import { getCurrentUser } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { getSubscriptionByUserId } from '@/db/queries/subscriptions'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const subscription = await getSubscriptionByUserId(user.id)
  if (!subscription?.stripeCustomerId) {
    return Response.json(
      { error: 'Nenhuma assinatura encontrada.' },
      { status: 400 }
    )
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })

  return Response.json({ url: session.url })
}
