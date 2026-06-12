import { count, eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  clients,
  contracts,
  projects,
  recurrences,
  subscriptions,
} from '@/db/schema'
import { PLANS, type LimitedResource, type PlanId } from '@/lib/plans'

const resourceTables = {
  clients,
  projects,
  contracts,
  recurrences,
} as const

const resourceLabels: Record<LimitedResource, string> = {
  clients: 'clientes',
  projects: 'projetos',
  contracts: 'contratos',
  recurrences: 'recorrências',
}

export async function getUserPlan(userId: string): Promise<PlanId> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
  if (
    subscription?.planId === 'pro' &&
    ['active', 'trialing'].includes(subscription.status ?? '')
  ) {
    return 'PRO'
  }
  return 'FREE'
}

export async function checkPlanLimit(
  userId: string,
  resource: LimitedResource
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const planId = await getUserPlan(userId)
  const limit = PLANS[planId].limits[resource]

  const table = resourceTables[resource]
  const [{ value: current }] = await db
    .select({ value: count() })
    .from(table)
    .where(eq(table.userId, userId))

  return { allowed: current < limit, limit, current }
}

/** Mensagem de erro padrão quando o limite do plano é atingido */
export function planLimitMessage(resource: LimitedResource, limit: number) {
  return `Você atingiu o limite de ${limit} ${resourceLabels[resource]} no plano Gratuito. Faça upgrade para o Pro em Configurações → Plano.`
}
