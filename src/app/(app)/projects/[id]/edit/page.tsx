import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProjectById } from '@/db/queries/projects'
import { getClients } from '@/db/queries/clients'
import { getPipelinesWithStages } from '@/db/queries/pipelines'
import { getCatalogItems } from '@/db/queries/catalog'
import { ProjectForm } from '@/components/projects/project-form'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const { id } = await params
  const project = await getProjectById(id, user.id)
  if (!project) notFound()

  const [clients, pipelines, catalogItems] = await Promise.all([
    getClients(user.id),
    getPipelinesWithStages(user.id),
    getCatalogItems(user.id),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Editar projeto
        </h1>
        <p className="text-sm text-text-secondary mt-1">{project.name}</p>
      </div>
      <ProjectForm
        project={project}
        clients={clients}
        pipelines={pipelines}
        catalogItems={catalogItems}
      />
    </div>
  )
}
