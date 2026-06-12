import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProjects } from '@/db/queries/projects'
import { getPipelines } from '@/db/queries/pipelines'
import {
  ProjectsTable,
  type ProjectRow,
} from '@/components/projects/projects-table'

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const [projects, pipelines] = await Promise.all([
    getProjects(user.id),
    getPipelines(user.id),
  ])

  const rows: ProjectRow[] = projects.map(
    ({ project, clientName, pipelineName, stageName, stageColor }) => ({
      id: project.id,
      name: project.name,
      clientName: clientName ?? '—',
      pipelineName: pipelineName ?? '—',
      stageName: stageName ?? '',
      stageColor: stageColor ?? '#6366f1',
      value: project.value,
      currency: project.currency ?? 'BRL',
      dueDate: project.dueDate,
    })
  )

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <ProjectsTable
        projects={rows}
        pipelineOptions={pipelines.map((p) => ({
          label: p.name,
          value: p.name,
        }))}
      />
    </div>
  )
}
