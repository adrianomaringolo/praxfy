import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getRecurrenceById } from '@/db/queries/recurrences'
import { getOccurrencesByRecurrence } from '@/db/queries/recurrence-occurrences'
import { getProjectById } from '@/db/queries/projects'
import { getContractById } from '@/db/queries/contracts'
import {
  OccurrencesList,
  RecurrenceStatusActions,
} from '@/components/recurrences/recurrence-detail'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/format'
import { formatFrequency } from '@/lib/recurrence-dates'

export default async function RecurrenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const { id } = await params
  const recurrence = await getRecurrenceById(id, user.id)
  if (!recurrence) notFound()

  const [occurrences, project, contract] = await Promise.all([
    getOccurrencesByRecurrence(id),
    recurrence.projectId
      ? getProjectById(recurrence.projectId, user.id)
      : Promise.resolve(undefined),
    recurrence.contractId
      ? getContractById(recurrence.contractId, user.id)
      : Promise.resolve(undefined),
  ])

  const linkedTo = project
    ? { label: project.name, href: `/projects/${project.id}` }
    : contract
      ? { label: contract.name, href: `/contracts/${contract.id}` }
      : undefined

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-text-primary">
              {recurrence.name}
            </h1>
            <StatusBadge status={recurrence.status ?? 'active'} />
          </div>
          {recurrence.description && (
            <p className="text-sm text-text-secondary mt-1">
              {recurrence.description}
            </p>
          )}
        </div>
        <RecurrenceStatusActions recurrence={recurrence} />
      </div>

      <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
            Frequência
          </p>
          <p className="text-sm text-text-primary mt-1">
            {formatFrequency(
              recurrence.frequencyType,
              recurrence.frequencyValue
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
            Próxima ocorrência
          </p>
          <p className="text-sm text-text-primary mt-1">
            {formatDate(recurrence.nextOccurrenceAt)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
            Vinculado a
          </p>
          <p className="text-sm text-text-primary mt-1">
            {linkedTo ? (
              <Link
                href={linkedTo.href}
                className="text-primary-600 hover:underline"
              >
                {linkedTo.label}
              </Link>
            ) : (
              'Nenhum (global)'
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
            Notificações
          </p>
          <p className="text-sm text-text-primary mt-1">
            {recurrence.notifyEmails.length > 0
              ? recurrence.notifyEmails.join(', ')
              : '—'}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-display font-semibold text-text-primary">
          Ocorrências
        </h2>
        <OccurrencesList occurrences={occurrences} />
      </section>
    </div>
  )
}
