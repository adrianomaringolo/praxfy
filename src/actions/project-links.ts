'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { getProjectById } from '@/db/queries/projects'
import * as queries from '@/db/queries/project-links'
import type { ActionResult } from '@/types/actions'
import type { ProjectLink } from '@/db/schema'

const linkSchema = z.object({
  label: z.string().trim().min(1, 'Informe o nome do link'),
  url: z.string().trim().url('URL inválida'),
})

export async function createProjectLink(
  projectId: string,
  label: string,
  url: string,
  isPublic: boolean
): Promise<ActionResult<ProjectLink>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const project = await getProjectById(projectId, user.id)
    if (!project) return { success: false, error: 'Projeto não encontrado.' }

    const parsed = linkSchema.safeParse({ label, url })
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const link = await queries.createProjectLink({
      projectId,
      label: parsed.data.label,
      url: parsed.data.url,
      isPublic,
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: link }
  } catch {
    return { success: false, error: 'Erro ao adicionar link.' }
  }
}

async function getOwnedLink(id: string, userId: string) {
  const link = await queries.getProjectLinkById(id)
  if (!link) return undefined
  const project = await getProjectById(link.projectId, userId)
  return project ? link : undefined
}

export async function deleteProjectLink(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const link = await getOwnedLink(id, user.id)
    if (!link) return { success: false, error: 'Link não encontrado.' }

    await queries.deleteProjectLink(id)

    revalidatePath(`/projects/${link.projectId}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Erro ao excluir link.' }
  }
}

export async function updateProjectLinkVisibility(
  id: string,
  isPublic: boolean
): Promise<ActionResult<ProjectLink>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const link = await getOwnedLink(id, user.id)
    if (!link) return { success: false, error: 'Link não encontrado.' }

    const updated = await queries.updateProjectLinkVisibility(id, isPublic)

    revalidatePath(`/projects/${link.projectId}`)
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Erro ao atualizar visibilidade.' }
  }
}
