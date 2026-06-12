import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { projectLinks, type NewProjectLink } from '@/db/schema'

export async function getProjectLinks(projectId: string) {
  return db
    .select()
    .from(projectLinks)
    .where(eq(projectLinks.projectId, projectId))
    .orderBy(asc(projectLinks.createdAt))
}

export async function getPublicProjectLinks(projectId: string) {
  return db
    .select()
    .from(projectLinks)
    .where(
      and(
        eq(projectLinks.projectId, projectId),
        eq(projectLinks.isPublic, true)
      )
    )
    .orderBy(asc(projectLinks.createdAt))
}

export async function createProjectLink(data: NewProjectLink) {
  const [link] = await db.insert(projectLinks).values(data).returning()
  return link
}

export async function updateProjectLinkVisibility(
  id: string,
  isPublic: boolean
) {
  const [link] = await db
    .update(projectLinks)
    .set({ isPublic })
    .where(eq(projectLinks.id, id))
    .returning()
  return link
}

export async function deleteProjectLink(id: string) {
  await db.delete(projectLinks).where(eq(projectLinks.id, id))
}
