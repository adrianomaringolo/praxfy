import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPipelinesWithStages } from '@/db/queries/pipelines'
import { PipelinesManager } from '@/components/pipelines/pipelines-manager'

export default async function PipelinesSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const pipelines = await getPipelinesWithStages(user.id)

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <PipelinesManager pipelines={pipelines} />
    </div>
  )
}
