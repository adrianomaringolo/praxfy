'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/db/queries/users'
import { createPipeline, createStage } from '@/db/queries/pipelines'
import {
  createPipelineWithStagesSchema,
  type CreatePipelineWithStagesInput,
} from '@/lib/validations/pipeline'
import type { ActionResult } from '@/types/actions'
import type { Pipeline } from '@/db/schema'

export async function createPipelineWithStages(
  input: CreatePipelineWithStagesInput
): Promise<ActionResult<Pipeline>> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: 'Não autenticado.' }

    const user = await getUserByClerkId(clerkId)
    if (!user) return { success: false, error: 'Usuário não encontrado.' }

    const parsed = createPipelineWithStagesSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const pipeline = await createPipeline({
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
    })

    for (const [index, stage] of parsed.data.stages.entries()) {
      await createStage({
        pipelineId: pipeline.id,
        name: stage.name,
        color: stage.color,
        order: index,
      })
    }

    revalidatePath('/onboarding')
    revalidatePath('/settings/pipelines')
    return { success: true, data: pipeline }
  } catch {
    return {
      success: false,
      error: 'Erro ao criar pipeline. Tente novamente.',
    }
  }
}
