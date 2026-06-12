import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { checkPlanLimit, getUserPlan } from '@/lib/plan-limits'
import { getSubscriptionByUserId } from '@/db/queries/subscriptions'
import { BillingView } from '@/components/billing/billing-view'

const RESOURCES = [
  { resource: 'clients', label: 'Clientes' },
  { resource: 'projects', label: 'Projetos' },
  { resource: 'contracts', label: 'Contratos' },
  { resource: 'recurrences', label: 'Recorrências' },
] as const

export default async function BillingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const [planId, subscription, ...limits] = await Promise.all([
    getUserPlan(user.id),
    getSubscriptionByUserId(user.id),
    ...RESOURCES.map((r) => checkPlanLimit(user.id, r.resource)),
  ])

  const usage = RESOURCES.map((r, index) => ({
    resource: r.resource,
    label: r.label,
    current: limits[index].current,
    limit: limits[index].limit,
  }))

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Plano
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Veja seu uso atual e gerencie sua assinatura.
        </p>
      </div>
      <BillingView
        planId={planId}
        usage={usage}
        hasStripeCustomer={!!subscription?.stripeCustomerId}
      />
    </div>
  )
}
