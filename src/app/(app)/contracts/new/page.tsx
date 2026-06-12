import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getClients } from '@/db/queries/clients'
import { getCatalogItems } from '@/db/queries/catalog'
import { ContractForm } from '@/components/contracts/contract-form'

export default async function NewContractPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const [clients, catalogItems] = await Promise.all([
    getClients(user.id),
    getCatalogItems(user.id),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Novo contrato
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Contratos representam serviços recorrentes, sem data de término.
        </p>
      </div>
      <ContractForm clients={clients} catalogItems={catalogItems} />
    </div>
  )
}
