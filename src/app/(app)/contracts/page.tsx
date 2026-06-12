import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getContracts } from '@/db/queries/contracts'
import {
  ContractsTable,
  type ContractRow,
} from '@/components/contracts/contracts-table'

export default async function ContractsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const contracts = await getContracts(user.id)

  const rows: ContractRow[] = contracts.map(({ contract, clientName }) => ({
    id: contract.id,
    name: contract.name,
    clientName: clientName ?? '—',
    value: contract.value,
    currency: contract.currency ?? 'BRL',
    status: contract.status ?? 'active',
  }))

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <ContractsTable contracts={rows} />
    </div>
  )
}
