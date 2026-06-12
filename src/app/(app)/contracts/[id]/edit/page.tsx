import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getContractById } from '@/db/queries/contracts'
import { getClients } from '@/db/queries/clients'
import { getCatalogItems } from '@/db/queries/catalog'
import { ContractForm } from '@/components/contracts/contract-form'

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const { id } = await params
  const contract = await getContractById(id, user.id)
  if (!contract) notFound()

  const [clients, catalogItems] = await Promise.all([
    getClients(user.id),
    getCatalogItems(user.id),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Editar contrato
        </h1>
        <p className="text-sm text-text-secondary mt-1">{contract.name}</p>
      </div>
      <ContractForm
        contract={contract}
        clients={clients}
        catalogItems={catalogItems}
      />
    </div>
  )
}
