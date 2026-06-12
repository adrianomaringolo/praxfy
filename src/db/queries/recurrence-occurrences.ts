import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  recurrenceOccurrences,
  type NewRecurrenceOccurrence,
} from '@/db/schema'

export async function getOccurrencesByRecurrence(recurrenceId: string) {
  return db
    .select()
    .from(recurrenceOccurrences)
    .where(eq(recurrenceOccurrences.recurrenceId, recurrenceId))
    .orderBy(desc(recurrenceOccurrences.scheduledAt))
}

export async function getOccurrenceById(id: string) {
  const [occurrence] = await db
    .select()
    .from(recurrenceOccurrences)
    .where(eq(recurrenceOccurrences.id, id))
  return occurrence
}

export async function createOccurrence(data: NewRecurrenceOccurrence) {
  const [occurrence] = await db
    .insert(recurrenceOccurrences)
    .values(data)
    .returning()
  return occurrence
}

export async function completeOccurrence(id: string, notes?: string) {
  const [occurrence] = await db
    .update(recurrenceOccurrences)
    .set({ status: 'done', executedAt: new Date(), notes })
    .where(eq(recurrenceOccurrences.id, id))
    .returning()
  return occurrence
}
