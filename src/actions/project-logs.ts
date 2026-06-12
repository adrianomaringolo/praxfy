'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { getProjectById } from '@/db/queries/projects'
import * as queries from '@/db/queries/project-logs'
import type { ActionResult } from '@/types/actions'
import type { ProjectLog } from '@/db/schema'

export async function createProjectLog(
  projectId: string,
  content: string,
  isPublic: boolean
): Promise<ActionResult<ProjectLog>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const project = await getProjectById(projectId, user.id)
    if (!project) return { success: false, error: 'Projeto não encontrado.' }

    if (!content.trim()) {
      return { success: false, error: 'Escreva o conteúdo da atualização.' }
    }

    const log = await queries.createProjectLog({
      projectId,
      content: content.trim(),
      isPublic,
      stageId: project.currentStageId,
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: log }
  } catch {
    return { success: false, error: 'Erro ao registrar atualização.' }
  }
}

export async function updateProjectLogVisibility(
  id: string,
  isPublic: boolean
): Promise<ActionResult<ProjectLog>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const log = await queries.getProjectLogById(id)
    if (!log) return { success: false, error: 'Registro não encontrado.' }

    const project = await getProjectById(log.projectId, user.id)
    if (!project) return { success: false, error: 'Projeto não encontrado.' }

    const updated = await queries.updateProjectLogVisibility(id, isPublic)

    revalidatePath(`/projects/${log.projectId}`)
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Erro ao atualizar visibilidade.' }
  }
}
