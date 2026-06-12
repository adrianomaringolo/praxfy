import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { checkPlanLimit, getUserPlan } from '@/lib/plan-limits'

const RESOURCE_LABELS = {
  clients: 'clientes',
  projects: 'projetos',
  contracts: 'contratos',
  recurrences: 'recorrências',
} as const

/**
 * Banner global exibido quando o usuário do plano Gratuito atinge
 * algum limite (GUIDE 7.7). Server component — renderizado no layout.
 */
export async function UpgradeBanner() {
  const user = await getCurrentUser()
  if (!user) return null

  const planId = await getUserPlan(user.id)
  if (planId !== 'FREE') return null

  const resources = Object.keys(RESOURCE_LABELS) as Array<
    keyof typeof RESOURCE_LABELS
  >
  const checks = await Promise.all(
    resources.map(async (resource) => ({
      resource,
      ...(await checkPlanLimit(user.id, resource)),
    }))
  )
  const reached = checks.find((check) => !check.allowed)
  if (!reached) return null

  return (
    <div className="bg-accent-light border-b border-accent px-4 py-2.5 text-sm text-primary-800 flex flex-wrap items-center justify-center gap-2 text-center">
      <span>
        Você atingiu o limite de {reached.limit}{' '}
        {RESOURCE_LABELS[reached.resource]} no plano Gratuito.
      </span>
      <Link
        href="/settings/billing"
        className="font-semibold underline hover:text-primary-900"
      >
        Fazer upgrade →
      </Link>
    </div>
  )
}
