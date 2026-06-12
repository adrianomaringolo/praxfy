import { and, asc, eq, lte } from 'drizzle-orm'
import { db } from '@/db'
import {
  contracts,
  projects,
  recurrences,
  type NewRecurrence,
} from '@/db/schema'

export async function getRecurrences(userId: string) {
  return db
    .select({
      recurrence: recurrences,
      projectName: projects.name,
      contractName: contracts.name,
    })
    .from(recurrences)
    .leftJoin(projects, eq(recurrences.projectId, projects.id))
    .leftJoin(contracts, eq(recurrences.contractId, contracts.id))
    .where(eq(recurrences.userId, userId))
    .orderBy(asc(recurrences.nextOccurrenceAt))
}

export async function getRecurrencesByContract(
  contractId: string,
  userId: string
) {
  return db
    .select()
    .from(recurrences)
    .where(
      and(eq(recurrences.contractId, contractId), eq(recurrences.userId, userId))
    )
    .orderBy(asc(recurrences.nextOccurrenceAt))
}

export async function getRecurrenceById(id: string, userId: string) {
  const [recurrence] = await db
    .select()
    .from(recurrences)
    .where(and(eq(recurrences.id, id), eq(recurrences.userId, userId)))
  return recurrence
}

export async function createRecurrence(data: NewRecurrence) {
  const [recurrence] = await db.insert(recurrences).values(data).returning()
  return recurrence
}

export async function updateRecurrence(
  id: string,
  userId: string,
  data: Partial<NewRecurrence>
) {
  const [recurrence] = await db
    .update(recurrences)
    .set(data)
    .where(and(eq(recurrences.id, id), eq(recurrences.userId, userId)))
    .returning()
  return recurrence
}

/**
 * Recorrências ativas com nextOccurrenceAt <= data informada.
 * Usada pelo cron — não filtra por usuário.
 * @param date formato 'YYYY-MM-DD'
 */
export async function getOverdueRecurrences(date: string) {
  return db
    .select()
    .from(recurrences)
    .where(
      and(
        eq(recurrences.status, 'active'),
        lte(recurrences.nextOccurrenceAt, date)
      )
    )
}

/** @param nextOccurrenceAt formato 'YYYY-MM-DD' */
export async function updateNextOccurrence(
  id: string,
  nextOccurrenceAt: string
) {
  const [recurrence] = await db
    .update(recurrences)
    .set({ nextOccurrenceAt })
    .where(eq(recurrences.id, id))
    .returning()
  return recurrence
}
