import {
  getOverdueRecurrences,
  updateNextOccurrence,
} from '@/db/queries/recurrences'
import {
  createOccurrence,
  getOccurrencesByRecurrence,
} from '@/db/queries/recurrence-occurrences'
import { getProjectById } from '@/db/queries/projects'
import { getContractById } from '@/db/queries/contracts'
import { getClientById } from '@/db/queries/clients'
import { nextOccurrenceDate } from '@/lib/recurrence-dates'
import { formatDate, todayISO } from '@/lib/format'
import { EMAIL_FROM, resend } from '@/lib/resend'
import RecurrenceAlert from '@/emails/recurrence-alert'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const today = todayISO()
  const overdue = await getOverdueRecurrences(today)
  let processed = 0
  const errors: string[] = []

  for (const recurrence of overdue) {
    try {
      const dueDate = recurrence.nextOccurrenceAt

      // 1. Cria a ocorrência do ciclo, se ainda não existir
      const existing = await getOccurrencesByRecurrence(recurrence.id)
      const alreadyCreated = existing.some(
        (occurrence) => occurrence.scheduledAt === dueDate
      )
      if (!alreadyCreated) {
        await createOccurrence({
          recurrenceId: recurrence.id,
          scheduledAt: dueDate,
          status: 'pending',
        })
      }

      // 2. Notifica por email
      if (recurrence.notifyEmails.length > 0 && process.env.RESEND_API_KEY) {
        let clientName: string | undefined
        if (recurrence.projectId) {
          const project = await getProjectById(
            recurrence.projectId,
            recurrence.userId
          )
          if (project) {
            const client = await getClientById(
              project.clientId,
              recurrence.userId
            )
            clientName = client?.name
          }
        } else if (recurrence.contractId) {
          const contract = await getContractById(
            recurrence.contractId,
            recurrence.userId
          )
          if (contract) {
            const client = await getClientById(
              contract.clientId,
              recurrence.userId
            )
            clientName = client?.name
          }
        }

        await resend.emails.send({
          from: EMAIL_FROM,
          to: recurrence.notifyEmails,
          subject: `Lembrete: ${recurrence.name}`,
          react: RecurrenceAlert({
            recurrenceName: recurrence.name,
            clientName,
            scheduledDate: formatDate(dueDate),
            linkUrl: `${process.env.NEXT_PUBLIC_APP_URL}/recurrences/${recurrence.id}`,
          }),
        })
      }

      // 3. Avança a próxima ocorrência
      await updateNextOccurrence(
        recurrence.id,
        nextOccurrenceDate(
          dueDate,
          recurrence.frequencyType,
          recurrence.frequencyValue
        )
      )

      processed++
    } catch (error) {
      errors.push(
        `${recurrence.id}: ${error instanceof Error ? error.message : 'erro'}`
      )
    }
  }

  return Response.json({ ok: true, processed, errors })
}
