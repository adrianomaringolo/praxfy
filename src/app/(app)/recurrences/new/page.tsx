import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProjects } from '@/db/queries/projects'
import { getContracts } from '@/db/queries/contracts'
import { RecurrenceForm } from '@/components/recurrences/recurrence-form'

export default async function NewRecurrencePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; contractId?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const { projectId, contractId } = await searchParams
  const [projects, contracts] = await Promise.all([
    getProjects(user.id),
    getContracts(user.id),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Nova recorrência
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Configure um lembrete que se repete automaticamente.
        </p>
      </div>
      <RecurrenceForm
        projects={projects.map(({ project }) => ({
          id: project.id,
          name: project.name,
        }))}
        contracts={contracts.map(({ contract }) => ({
          id: contract.id,
          name: contract.name,
        }))}
        defaultProjectId={projectId}
        defaultContractId={contractId}
      />
    </div>
  )
}
