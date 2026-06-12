import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { projectDocuments, type NewProjectDocument } from '@/db/schema'

export async function getProjectDocuments(projectId: string) {
  return db
    .select()
    .from(projectDocuments)
    .where(eq(projectDocuments.projectId, projectId))
    .orderBy(asc(projectDocuments.createdAt))
}

export async function getPublicProjectDocuments(projectId: string) {
  return db
    .select()
    .from(projectDocuments)
    .where(
      and(
        eq(projectDocuments.projectId, projectId),
        eq(projectDocuments.isPublic, true)
      )
    )
    .orderBy(asc(projectDocuments.createdAt))
}

export async function getProjectDocumentById(id: string) {
  const [document] = await db
    .select()
    .from(projectDocuments)
    .where(eq(projectDocuments.id, id))
  return document
}

export async function createProjectDocument(data: NewProjectDocument) {
  const [document] = await db
    .insert(projectDocuments)
    .values(data)
    .returning()
  return document
}

export async function updateDocumentVisibility(id: string, isPublic: boolean) {
  const [document] = await db
    .update(projectDocuments)
    .set({ isPublic })
    .where(eq(projectDocuments.id, id))
    .returning()
  return document
}

export async function deleteProjectDocument(id: string) {
  await db.delete(projectDocuments).where(eq(projectDocuments.id, id))
}
