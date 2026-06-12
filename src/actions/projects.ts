'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getCurrentUser } from '@/lib/auth'
import { checkPlanLimit, planLimitMessage } from '@/lib/plan-limits'
import { projectSchema, type ProjectInput } from '@/lib/validations/project'
import * as queries from '@/db/queries/projects'
import { getStageById } from '@/db/queries/pipelines'
import { createProjectLog } from '@/db/queries/project-logs'
import type { ActionResult } from '@/types/actions'
import type { Project } from '@/db/schema'

function revalidateProject(id?: string) {
  revalidatePath('/projects')
  if (id) revalidatePath(`/projects/${id}`)
}

function toDbValues(data: ProjectInput) {
  return {
    name: data.name,
    description: data.description || null,
    clientId: data.clientId,
    pipelineId: data.pipelineId,
    currentStageId: data.currentStageId,
    catalogItemId: data.catalogItemId || null,
    value: data.value != null ? String(data.value) : null,
    currency: data.currency || 'BRL',
    startDate: data.startDate || null,
    dueDate: data.dueDate || null,
  }
}

export async function createProject(
  input: ProjectInput
): Promise<ActionResult<Project>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const limitCheck = await checkPlanLimit(user.id, 'projects')
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: planLimitMessage('projects', limitCheck.limit),
      }
    }

    const parsed = projectSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const project = await queries.createProject({
      userId: user.id,
      ...toDbValues(parsed.data),
      publicToken: nanoid(16),
    })

    revalidateProject(project.id)
    return { success: true, data: project }
  } catch {
    return { success: false, error: 'Erro ao criar projeto. Tente novamente.' }
  }
}

export async function updateProject(
  id: string,
  input: ProjectInput
): Promise<ActionResult<Project>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const parsed = projectSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const project = await queries.updateProject(
      id,
      user.id,
      toDbValues(parsed.data)
    )
    if (!project) return { success: false, error: 'Projeto não encontrado.' }

    revalidateProject(id)
    return { success: true, data: project }
  } catch {
    return { success: false, error: 'Erro ao atualizar projeto.' }
  }
}

export async function updateProjectStage(
  id: string,
  stageId: string
): Promise<ActionResult<Project>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const stage = await getStageById(stageId)
    if (!stage) return { success: false, error: 'Etapa não encontrada.' }

    const project = await queries.updateProjectStage(id, user.id, stageId)
    if (!project) return { success: false, error: 'Projeto não encontrado.' }

    // Log automático da mudança de etapa (SPEC: regras de negócio)
    await createProjectLog({
      projectId: id,
      stageId,
      content: `Etapa alterada para ${stage.name}`,
      isPublic: false,
    })

    revalidateProject(id)
    return { success: true, data: project }
  } catch {
    return { success: false, error: 'Erro ao mover etapa.' }
  }
}

export async function toggleProjectToken(
  id: string,
  active: boolean
): Promise<ActionResult<Project>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const project = await queries.toggleProjectToken(id, user.id, active)
    if (!project) return { success: false, error: 'Projeto não encontrado.' }

    revalidateProject(id)
    return { success: true, data: project }
  } catch {
    return { success: false, error: 'Erro ao atualizar o portal.' }
  }
}

export async function setProjectTokenExpiry(
  id: string,
  expiresAt: Date | null
): Promise<ActionResult<Project>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const project = await queries.updateProject(id, user.id, {
      publicTokenExpiresAt: expiresAt,
    })
    if (!project) return { success: false, error: 'Projeto não encontrado.' }

    revalidateProject(id)
    return { success: true, data: project }
  } catch {
    return { success: false, error: 'Erro ao definir expiração.' }
  }
}
