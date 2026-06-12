import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProjectById } from '@/db/queries/projects'
import { getClientById } from '@/db/queries/clients'
import {
  getPipelineWithStages,
  getStagesByPipeline,
} from '@/db/queries/pipelines'
import { getProjectLogs } from '@/db/queries/project-logs'
import { getProjectLinks } from '@/db/queries/project-links'
import { getProjectDocuments } from '@/db/queries/project-documents'
import { ProjectDetailTabs } from '@/components/projects/project-detail-tabs'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const { id } = await params
  const project = await getProjectById(id, user.id)
  if (!project) notFound()

  const [client, pipeline, stages, logs, links, documents] =
    await Promise.all([
      getClientById(project.clientId, user.id),
      getPipelineWithStages(project.pipelineId, user.id),
      getStagesByPipeline(project.pipelineId),
      getProjectLogs(id),
      getProjectLinks(id),
      getProjectDocuments(id),
    ])

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          {project.name}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {client?.name ?? 'Cliente'} · {pipeline?.name ?? 'Pipeline'}
        </p>
      </div>

      <ProjectDetailTabs
        project={project}
        clientName={client?.name ?? '—'}
        pipelineName={pipeline?.name ?? '—'}
        stages={stages}
        logs={logs}
        links={links}
        documents={documents}
      />
    </div>
  )
}
