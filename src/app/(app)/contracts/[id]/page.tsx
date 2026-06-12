import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getContractById } from '@/db/queries/contracts'
import { getClientById } from '@/db/queries/clients'
import { getRecurrencesByContract } from '@/db/queries/recurrences'
import { ContractPortalCard } from '@/components/contracts/contract-portal-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/format'

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const { id } = await params
  const contract = await getContractById(id, user.id)
  if (!contract) notFound()

  const [client, recurrences] = await Promise.all([
    getClientById(contract.clientId, user.id),
    getRecurrencesByContract(id, user.id),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-text-primary">
              {contract.name}
            </h1>
            <StatusBadge status={contract.status ?? 'active'} />
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {client?.name ?? 'Cliente'}
          </p>
        </div>
        <Link
          href={`/contracts/${contract.id}/edit`}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-input bg-white text-sm font-medium text-text-primary hover:bg-surface-muted"
        >
          Editar
        </Link>
      </div>

      <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
            Valor
          </p>
          <p className="text-sm text-text-primary mt-1">
            {formatCurrency(contract.value, contract.currency ?? 'BRL')}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
            Criado em
          </p>
          <p className="text-sm text-text-primary mt-1">
            {formatDate(contract.createdAt)}
          </p>
        </div>
        {contract.description && (
          <div className="col-span-2 sm:col-span-4">
            <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
              Descrição
            </p>
            <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">
              {contract.description}
            </p>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-text-primary">
            Recorrências
          </h2>
          <Link
            href={`/recurrences/new?contractId=${contract.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            <Plus size={14} />
            Nova Recorrência
          </Link>
        </div>
        {recurrences.length === 0 ? (
          <p className="text-sm text-text-muted">
            Nenhuma recorrência vinculada. Configure lembretes automáticos
            para este contrato.
          </p>
        ) : (
          <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {recurrences.map((recurrence) => (
              <Link
                key={recurrence.id}
                href={`/recurrences/${recurrence.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted"
              >
                <span className="text-sm font-medium text-text-primary">
                  {recurrence.name}
                </span>
                <span className="flex items-center gap-4">
                  <StatusBadge status={recurrence.status ?? 'active'} />
                  <span className="text-sm text-text-secondary">
                    Próxima: {formatDate(recurrence.nextOccurrenceAt)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <ContractPortalCard contract={contract} />
    </div>
  )
}
