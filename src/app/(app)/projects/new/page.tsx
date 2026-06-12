import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getClients } from '@/db/queries/clients'
import { getPipelinesWithStages } from '@/db/queries/pipelines'
import { getCatalogItems } from '@/db/queries/catalog'
import { ProjectForm } from '@/components/projects/project-form'

export default async function NewProjectPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const [clients, pipelines, catalogItems] = await Promise.all([
    getClients(user.id),
    getPipelinesWithStages(user.id),
    getCatalogItems(user.id),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Novo projeto
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Defina cliente, pipeline e os detalhes do serviço.
        </p>
      </div>
      <ProjectForm
        clients={clients}
        pipelines={pipelines}
        catalogItems={catalogItems}
      />
    </div>
  )
}
