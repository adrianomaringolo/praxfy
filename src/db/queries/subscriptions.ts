import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { subscriptions } from '@/db/schema'

type SubscriptionData = Partial<typeof subscriptions.$inferInsert>

export async function getSubscriptionByUserId(userId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
  return subscription
}

export async function getSubscriptionByCustomerId(stripeCustomerId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
  return subscription
}

/** Cria ou atualiza a linha de assinatura do usuário */
export async function upsertSubscription(
  userId: string,
  data: SubscriptionData
) {
  const existing = await getSubscriptionByUserId(userId)
  if (existing) {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId))
      .returning()
    return updated
  }
  const [created] = await db
    .insert(subscriptions)
    .values({ userId, ...data })
    .returning()
  return created
}

export async function updateSubscriptionByCustomerId(
  stripeCustomerId: string,
  data: SubscriptionData
) {
  const [updated] = await db
    .update(subscriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
    .returning()
  return updated
}
