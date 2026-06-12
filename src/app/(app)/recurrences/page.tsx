import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getRecurrences } from '@/db/queries/recurrences'
import { formatFrequency } from '@/lib/recurrence-dates'
import {
  RecurrencesTable,
  type RecurrenceRow,
} from '@/components/recurrences/recurrences-table'

export default async function RecurrencesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const recurrences = await getRecurrences(user.id)

  const rows: RecurrenceRow[] = recurrences.map(
    ({ recurrence, projectName, contractName }) => ({
      id: recurrence.id,
      name: recurrence.name,
      linkedTo: projectName ?? contractName ?? '—',
      frequency: formatFrequency(
        recurrence.frequencyType,
        recurrence.frequencyValue
      ),
      nextOccurrenceAt: recurrence.nextOccurrenceAt,
      status: recurrence.status ?? 'active',
    })
  )

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <RecurrencesTable recurrences={rows} />
    </div>
  )
}
