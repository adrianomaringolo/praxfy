import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getCatalogItems } from '@/db/queries/catalog'
import { CatalogManager } from '@/components/catalog/catalog-manager'

export default async function CatalogPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const items = await getCatalogItems(user.id)

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <CatalogManager items={items} />
    </div>
  )
}
