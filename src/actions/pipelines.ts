'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import * as queries from '@/db/queries/pipelines'
import {
  countProjectsByPipeline,
  countProjectsByStage,
} from '@/db/queries/projects'
import {
  createPipelineWithStagesSchema,
  stageInputSchema,
  type CreatePipelineWithStagesInput,
} from '@/lib/validations/pipeline'
import type { ActionResult } from '@/types/actions'
import type { Pipeline, PipelineStage } from '@/db/schema'

function revalidatePipelinePaths() {
  revalidatePath('/settings/pipelines')
  revalidatePath('/onboarding')
  revalidatePath('/projects')
}

/** Valida que a etapa pertence a um pipeline do usuário */
async function getOwnedStage(stageId: string, userId: string) {
  const stage = await queries.getStageById(stageId)
  if (!stage) return undefined
  const pipeline = await queries.getPipelineWithStages(
    stage.pipelineId,
    userId
  )
  return pipeline ? stage : undefined
}

export async function createPipelineWithStages(
  input: CreatePipelineWithStagesInput
): Promise<ActionResult<Pipeline>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const parsed = createPipelineWithStagesSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const pipeline = await queries.createPipeline({
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
    })

    for (const [index, stage] of parsed.data.stages.entries()) {
      await queries.createStage({
        pipelineId: pipeline.id,
        name: stage.name,
        color: stage.color,
        order: index,
      })
    }

    revalidatePipelinePaths()
    return { success: true, data: pipeline }
  } catch {
    return {
      success: false,
      error: 'Erro ao criar pipeline. Tente novamente.',
    }
  }
}

export async function createPipeline(
  name: string,
  description?: string
): Promise<ActionResult<Pipeline>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }
    if (!name.trim()) {
      return { success: false, error: 'Informe o nome do pipeline.' }
    }

    const pipeline = await queries.createPipeline({
      userId: user.id,
      name: name.trim(),
      description: description?.trim() || null,
    })

    revalidatePipelinePaths()
    return { success: true, data: pipeline }
  } catch {
    return { success: false, error: 'Erro ao criar pipeline.' }
  }
}

export async function updatePipeline(
  id: string,
  data: { name?: string; description?: string }
): Promise<ActionResult<Pipeline>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const pipeline = await queries.updatePipeline(id, user.id, {
      name: data.name?.trim(),
      description: data.description?.trim() || null,
    })
    if (!pipeline) return { success: false, error: 'Pipeline não encontrado.' }

    revalidatePipelinePaths()
    return { success: true, data: pipeline }
  } catch {
    return { success: false, error: 'Erro ao atualizar pipeline.' }
  }
}

export async function deletePipeline(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const pipeline = await queries.getPipelineWithStages(id, user.id)
    if (!pipeline) return { success: false, error: 'Pipeline não encontrado.' }

    const projectCount = await countProjectsByPipeline(id)
    if (projectCount > 0) {
      return {
        success: false,
        error: `Este pipeline tem ${projectCount} projeto(s) vinculado(s) e não pode ser excluído.`,
      }
    }

    await queries.deletePipeline(id, user.id)
    revalidatePipelinePaths()
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Erro ao excluir pipeline.' }
  }
}

export async function createStage(
  pipelineId: string,
  name: string,
  color: string
): Promise<ActionResult<PipelineStage>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const pipeline = await queries.getPipelineWithStages(pipelineId, user.id)
    if (!pipeline) return { success: false, error: 'Pipeline não encontrado.' }

    const parsed = stageInputSchema.safeParse({ name, color })
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const stage = await queries.createStage({
      pipelineId,
      name: parsed.data.name,
      color: parsed.data.color,
      order: pipeline.stages.length,
    })

    revalidatePipelinePaths()
    return { success: true, data: stage }
  } catch {
    return { success: false, error: 'Erro ao criar etapa.' }
  }
}

export async function updateStage(
  id: string,
  data: { name?: string; color?: string }
): Promise<ActionResult<PipelineStage>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const owned = await getOwnedStage(id, user.id)
    if (!owned) return { success: false, error: 'Etapa não encontrada.' }

    const stage = await queries.updateStage(id, {
      name: data.name?.trim(),
      color: data.color,
    })

    revalidatePipelinePaths()
    return { success: true, data: stage }
  } catch {
    return { success: false, error: 'Erro ao atualizar etapa.' }
  }
}

export async function updateStagesOrder(
  stages: { id: string; order: number }[]
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    for (const stage of stages) {
      const owned = await getOwnedStage(stage.id, user.id)
      if (!owned) return { success: false, error: 'Etapa não encontrada.' }
    }

    await queries.updateStagesOrder(stages)
    revalidatePipelinePaths()
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Erro ao reordenar etapas.' }
  }
}

export async function deleteStage(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const owned = await getOwnedStage(id, user.id)
    if (!owned) return { success: false, error: 'Etapa não encontrada.' }

    const projectCount = await countProjectsByStage(id)
    if (projectCount > 0) {
      return {
        success: false,
        error: `Há ${projectCount} projeto(s) nesta etapa. Mova-os antes de excluí-la.`,
      }
    }

    await queries.deleteStage(id)
    revalidatePipelinePaths()
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Erro ao excluir etapa.' }
  }
}
