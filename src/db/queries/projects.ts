import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  clients,
  pipelines,
  pipelineStages,
  projects,
  type NewProject,
} from '@/db/schema'

export async function getProjects(userId: string) {
  return db
    .select({
      project: projects,
      clientName: clients.name,
      pipelineName: pipelines.name,
      stageName: pipelineStages.name,
      stageColor: pipelineStages.color,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .leftJoin(pipelines, eq(projects.pipelineId, pipelines.id))
    .leftJoin(pipelineStages, eq(projects.currentStageId, pipelineStages.id))
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt))
}

export async function getProjectsByClient(clientId: string, userId: string) {
  return db
    .select({
      project: projects,
      stageName: pipelineStages.name,
      stageColor: pipelineStages.color,
    })
    .from(projects)
    .leftJoin(pipelineStages, eq(projects.currentStageId, pipelineStages.id))
    .where(and(eq(projects.clientId, clientId), eq(projects.userId, userId)))
    .orderBy(desc(projects.createdAt))
}

export async function getProjectById(id: string, userId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
  return project
}

/**
 * Busca para o portal público. Retorna undefined se o token não existir,
 * estiver desativado ou expirado.
 */
export async function getProjectByToken(token: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.publicToken, token))
  if (!project) return undefined
  if (!project.publicTokenActive) return undefined
  if (
    project.publicTokenExpiresAt &&
    project.publicTokenExpiresAt < new Date()
  ) {
    return undefined
  }
  return project
}

export async function createProject(data: NewProject) {
  const [project] = await db.insert(projects).values(data).returning()
  return project
}

export async function updateProject(
  id: string,
  userId: string,
  data: Partial<NewProject>
) {
  const [project] = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning()
  return project
}

export async function updateProjectStage(
  id: string,
  userId: string,
  stageId: string
) {
  const [project] = await db
    .update(projects)
    .set({ currentStageId: stageId, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning()
  return project
}

export async function toggleProjectToken(
  id: string,
  userId: string,
  active: boolean
) {
  const [project] = await db
    .update(projects)
    .set({ publicTokenActive: active, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning()
  return project
}
