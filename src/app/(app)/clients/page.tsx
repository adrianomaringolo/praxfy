import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getClients } from '@/db/queries/clients'
import { ClientsTable } from '@/components/clients/clients-table'

export default async function ClientsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const clients = await getClients(user.id)

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <ClientsTable clients={clients} />
    </div>
  )
}
