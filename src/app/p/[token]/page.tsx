import { notFound } from 'next/navigation'
import {
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
} from 'lucide-react'
import { getProjectByToken } from '@/db/queries/projects'
import { getContractByToken } from '@/db/queries/contracts'
import { getClientById } from '@/db/queries/clients'
import { getUserById } from '@/db/queries/users'
import { getStagesByPipeline } from '@/db/queries/pipelines'
import { getPublicProjectLogs } from '@/db/queries/project-logs'
import { getPublicProjectLinks } from '@/db/queries/project-links'
import { getPublicProjectDocuments } from '@/db/queries/project-documents'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/format'
import type { PipelineStage } from '@/db/schema'

export const dynamic = 'force-dynamic'

function StagesStepper({
  stages,
  currentStageId,
}: {
  stages: PipelineStage[]
  currentStageId: string
}) {
  const currentIndex = stages.findIndex((s) => s.id === currentStageId)
  return (
    <div className="flex items-center gap-0 flex-wrap">
      {stages.map((stage, index) => (
        <div key={stage.id} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
              ${index < currentIndex ? 'bg-success-light text-success' : ''}
              ${index === currentIndex ? 'text-white' : ''}
              ${index > currentIndex ? 'bg-gray-100 text-text-muted' : ''}`}
            style={
              index === currentIndex
                ? { backgroundColor: stage.color }
                : undefined
            }
          >
            {index < currentIndex && <CheckCircle2 size={12} />}
            {stage.name}
          </div>
          {index < stages.length - 1 && (
            <ChevronRight size={14} className="text-gray-300 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}

function PortalShell({
  ownerName,
  children,
}: {
  ownerName: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-primary-950 px-6 py-4">
        <p className="text-white font-display font-semibold">{ownerName}</p>
        <p className="text-xs text-sidebar-text">
          Acompanhamento de serviço
        </p>
      </header>
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        {children}
      </main>
      <footer className="py-6 text-center">
        <p className="text-xs text-text-muted">
          Acompanhamento gerado pelo{' '}
          <span className="font-display font-semibold text-primary-700">
            Prax<span className="text-accent">fy</span>
          </span>
        </p>
      </footer>
    </div>
  )
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const project = await getProjectByToken(token)

  if (project) {
    const [owner, client, stages, logs, links, documents] = await Promise.all([
      getUserById(project.userId),
      getClientById(project.clientId, project.userId),
      getStagesByPipeline(project.pipelineId),
      getPublicProjectLogs(project.id),
      getPublicProjectLinks(project.id),
      getPublicProjectDocuments(project.id),
    ])

    return (
      <PortalShell ownerName={owner?.name ?? 'Profissional'}>
        {/* Hero */}
        <div className="bg-surface rounded-xl p-6">
          <h1 className="text-2xl font-display font-bold text-text-primary">
            {project.name}
          </h1>
          {client && (
            <p className="text-sm text-text-secondary mt-1">
              Cliente: {client.name}
            </p>
          )}
          {project.description && (
            <p className="text-sm text-text-secondary mt-3 whitespace-pre-wrap">
              {project.description}
            </p>
          )}
        </div>

        {/* Stepper */}
        {stages.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-muted">
              Andamento
            </h2>
            <StagesStepper
              stages={stages}
              currentStageId={project.currentStageId}
            />
          </section>
        )}

        {/* Timeline de logs públicos */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium tracking-wide uppercase text-text-muted">
            Atualizações
          </h2>
          {logs.length === 0 ? (
            <p className="text-sm text-text-muted">
              Nenhuma atualização publicada ainda.
            </p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-2 flex flex-col gap-5">
              {logs.map((log) => (
                <li key={log.id} className="ml-4">
                  <span className="absolute w-2.5 h-2.5 bg-accent rounded-full -left-[5px] mt-1.5" />
                  <p className="text-xs text-text-muted">
                    {formatDate(log.createdAt)}
                  </p>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">
                    {log.content}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Links e documentos */}
        {(links.length > 0 || documents.length > 0) && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-muted">
              Links e documentos
            </h2>
            <div className="flex flex-col gap-2">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline"
                >
                  <ExternalLink size={14} />
                  {link.label}
                </a>
              ))}
              {documents.map((document) => (
                <a
                  key={document.id}
                  href={document.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline"
                >
                  <Download size={14} />
                  {document.name}
                </a>
              ))}
            </div>
          </section>
        )}
      </PortalShell>
    )
  }

  const contract = await getContractByToken(token)

  if (contract) {
    const [owner, client] = await Promise.all([
      getUserById(contract.userId),
      getClientById(contract.clientId, contract.userId),
    ])

    return (
      <PortalShell ownerName={owner?.name ?? 'Profissional'}>
        <div className="bg-surface rounded-xl p-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-text-primary">
              {contract.name}
            </h1>
            <StatusBadge status={contract.status ?? 'active'} />
          </div>
          {client && (
            <p className="text-sm text-text-secondary mt-1">
              Cliente: {client.name}
            </p>
          )}
          {contract.description && (
            <p className="text-sm text-text-secondary mt-3 whitespace-pre-wrap">
              {contract.description}
            </p>
          )}
        </div>
        <p className="text-sm text-text-muted">
          Este é um contrato de serviço recorrente. Entre em contato com o
          profissional para mais detalhes.
        </p>
      </PortalShell>
    )
  }

  notFound()
}
