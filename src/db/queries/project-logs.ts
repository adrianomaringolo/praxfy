import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { projectLogs, type NewProjectLog } from '@/db/schema'

export async function getProjectLogs(projectId: string) {
  return db
    .select()
    .from(projectLogs)
    .where(eq(projectLogs.projectId, projectId))
    .orderBy(desc(projectLogs.createdAt))
}

export async function getPublicProjectLogs(projectId: string) {
  return db
    .select()
    .from(projectLogs)
    .where(
      and(eq(projectLogs.projectId, projectId), eq(projectLogs.isPublic, true))
    )
    .orderBy(desc(projectLogs.createdAt))
}

export async function createProjectLog(data: NewProjectLog) {
  const [log] = await db.insert(projectLogs).values(data).returning()
  return log
}

export async function updateProjectLogVisibility(
  id: string,
  isPublic: boolean
) {
  const [log] = await db
    .update(projectLogs)
    .set({ isPublic })
    .where(eq(projectLogs.id, id))
    .returning()
  return log
}
