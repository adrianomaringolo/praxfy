import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getClientById } from '@/db/queries/clients'
import { getProjectsByClient } from '@/db/queries/projects'
import { getContractsByClient } from '@/db/queries/contracts'
import { ClientDetailActions } from '@/components/clients/client-detail-actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/lib/format'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const { id } = await params
  const client = await getClientById(id, user.id)
  if (!client) notFound()

  const [projects, contracts] = await Promise.all([
    getProjectsByClient(id, user.id),
    getContractsByClient(id, user.id),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            {client.name}
          </h1>
          {client.tags && client.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {client.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-accent-light text-primary-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <ClientDetailActions client={client} />
      </div>

      <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
            Email
          </p>
          <p className="text-sm text-text-primary mt-1">
            {client.email || '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
            Telefone
          </p>
          <p className="text-sm text-text-primary mt-1">
            {client.phone || '—'}
          </p>
        </div>
        <div className="sm:col-span-3">
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
            Notas
          </p>
          <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">
            {client.notes || '—'}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-display font-semibold text-text-primary">
          Projetos
        </h2>
        {projects.length === 0 ? (
          <p className="text-sm text-text-muted">
            Nenhum projeto vinculado a este cliente.
          </p>
        ) : (
          <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {projects.map(({ project, stageName, stageColor }) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted"
              >
                <span className="text-sm font-medium text-text-primary">
                  {project.name}
                </span>
                <span className="flex items-center gap-4">
                  {stageName && (
                    <span
                      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: stageColor ?? '#6366f1' }}
                    >
                      {stageName}
                    </span>
                  )}
                  <span className="text-sm text-text-secondary">
                    {formatCurrency(project.value, project.currency ?? 'BRL')}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-display font-semibold text-text-primary">
          Contratos
        </h2>
        {contracts.length === 0 ? (
          <p className="text-sm text-text-muted">
            Nenhum contrato vinculado a este cliente.
          </p>
        ) : (
          <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {contracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted"
              >
                <span className="text-sm font-medium text-text-primary">
                  {contract.name}
                </span>
                <span className="flex items-center gap-4">
                  <StatusBadge status={contract.status ?? 'active'} />
                  <span className="text-sm text-text-secondary">
                    {formatCurrency(
                      contract.value,
                      contract.currency ?? 'BRL'
                    )}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
