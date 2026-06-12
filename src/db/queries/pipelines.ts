import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  pipelines,
  pipelineStages,
  type NewPipeline,
  type NewPipelineStage,
} from '@/db/schema'

export async function getPipelines(userId: string) {
  return db
    .select()
    .from(pipelines)
    .where(eq(pipelines.userId, userId))
    .orderBy(asc(pipelines.createdAt))
}

export async function getPipelineWithStages(id: string, userId: string) {
  const [pipeline] = await db
    .select()
    .from(pipelines)
    .where(and(eq(pipelines.id, id), eq(pipelines.userId, userId)))
  if (!pipeline) return undefined

  const stages = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.pipelineId, id))
    .orderBy(asc(pipelineStages.order))

  return { ...pipeline, stages }
}

export async function getStagesByPipeline(pipelineId: string) {
  return db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.pipelineId, pipelineId))
    .orderBy(asc(pipelineStages.order))
}

export async function createPipeline(data: NewPipeline) {
  const [pipeline] = await db.insert(pipelines).values(data).returning()
  return pipeline
}

export async function updatePipeline(
  id: string,
  userId: string,
  data: Partial<NewPipeline>
) {
  const [pipeline] = await db
    .update(pipelines)
    .set(data)
    .where(and(eq(pipelines.id, id), eq(pipelines.userId, userId)))
    .returning()
  return pipeline
}

export async function deletePipeline(id: string, userId: string) {
  await db
    .delete(pipelines)
    .where(and(eq(pipelines.id, id), eq(pipelines.userId, userId)))
}

export async function createStage(data: NewPipelineStage) {
  const [stage] = await db.insert(pipelineStages).values(data).returning()
  return stage
}

export async function updateStage(
  id: string,
  data: Partial<NewPipelineStage>
) {
  const [stage] = await db
    .update(pipelineStages)
    .set(data)
    .where(eq(pipelineStages.id, id))
    .returning()
  return stage
}

export async function updateStagesOrder(
  stages: { id: string; order: number }[]
) {
  await db.transaction(async (tx) => {
    for (const stage of stages) {
      await tx
        .update(pipelineStages)
        .set({ order: stage.order })
        .where(eq(pipelineStages.id, stage.id))
    }
  })
}

export async function deleteStage(id: string) {
  await db.delete(pipelineStages).where(eq(pipelineStages.id, id))
}
