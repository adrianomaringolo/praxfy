import { and, asc, count, eq, gte, isNull, lt, lte, max, or } from 'drizzle-orm'
import { db } from '@/db'
import {
  contracts,
  pipelineStages,
  projectLogs,
  projects,
  recurrenceOccurrences,
  recurrences,
} from '@/db/schema'

export async function countProjects(userId: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.userId, userId))
  return value
}

export async function countActiveContracts(userId: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(contracts)
    .where(and(eq(contracts.userId, userId), eq(contracts.status, 'active')))
  return value
}

/** Ocorrências pendentes com data passada (recorrências vencidas) */
export async function countOverdueOccurrences(userId: string, today: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(recurrenceOccurrences)
    .innerJoin(
      recurrences,
      eq(recurrenceOccurrences.recurrenceId, recurrences.id)
    )
    .where(
      and(
        eq(recurrences.userId, userId),
        eq(recurrenceOccurrences.status, 'pending'),
        lt(recurrenceOccurrences.scheduledAt, today)
      )
    )
  return value
}

/** Ocorrências pendentes vencendo entre hoje e a data limite */
export async function countUpcomingOccurrences(
  userId: string,
  today: string,
  until: string
) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(recurrenceOccurrences)
    .innerJoin(
      recurrences,
      eq(recurrenceOccurrences.recurrenceId, recurrences.id)
    )
    .where(
      and(
        eq(recurrences.userId, userId),
        eq(recurrenceOccurrences.status, 'pending'),
        gte(recurrenceOccurrences.scheduledAt, today),
        lte(recurrenceOccurrences.scheduledAt, until)
      )
    )
  return value
}

/** As 5 recorrências ativas mais próximas de vencer */
export async function getUpcomingRecurrences(userId: string, limit = 5) {
  return db
    .select()
    .from(recurrences)
    .where(
      and(eq(recurrences.userId, userId), eq(recurrences.status, 'active'))
    )
    .orderBy(asc(recurrences.nextOccurrenceAt))
    .limit(limit)
}

/** Projetos sem nenhum log desde a data de corte */
export async function getStaleProjects(userId: string, cutoff: Date) {
  const lastLog = db
    .select({
      projectId: projectLogs.projectId,
      lastLogAt: max(projectLogs.createdAt).as('last_log_at'),
    })
    .from(projectLogs)
    .groupBy(projectLogs.projectId)
    .as('last_log')

  return db
    .select({
      project: projects,
      stageName: pipelineStages.name,
      stageColor: pipelineStages.color,
      lastLogAt: lastLog.lastLogAt,
    })
    .from(projects)
    .leftJoin(lastLog, eq(lastLog.projectId, projects.id))
    .leftJoin(pipelineStages, eq(projects.currentStageId, pipelineStages.id))
    .where(
      and(
        eq(projects.userId, userId),
        or(isNull(lastLog.lastLogAt), lt(lastLog.lastLogAt, cutoff))
      )
    )
    .orderBy(asc(projects.updatedAt))
}
