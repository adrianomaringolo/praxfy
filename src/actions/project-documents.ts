'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { getProjectById } from '@/db/queries/projects'
import * as queries from '@/db/queries/project-documents'
import { deleteFile, uploadFile } from '@/lib/supabase-storage'
import type { ActionResult } from '@/types/actions'
import type { ProjectDocument } from '@/db/schema'

const BUCKET = 'documents'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadProjectDocument(
  projectId: string,
  formData: FormData
): Promise<ActionResult<ProjectDocument>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const project = await getProjectById(projectId, user.id)
    if (!project) return { success: false, error: 'Projeto não encontrado.' }

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: 'Selecione um arquivo.' }
    }
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'O arquivo excede o limite de 10MB.' }
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${projectId}/${Date.now()}-${safeName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const publicUrl = await uploadFile(
      BUCKET,
      storagePath,
      buffer,
      file.type || 'application/octet-stream'
    )

    const document = await queries.createProjectDocument({
      projectId,
      name: file.name,
      storagePath,
      publicUrl,
      mimeType: file.type || 'application/octet-stream',
      isPublic: false,
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: document }
  } catch {
    return { success: false, error: 'Erro ao enviar arquivo.' }
  }
}

async function getOwnedDocument(id: string, userId: string) {
  const document = await queries.getProjectDocumentById(id)
  if (!document) return undefined
  const project = await getProjectById(document.projectId, userId)
  return project ? document : undefined
}

export async function deleteProjectDocument(
  id: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const document = await getOwnedDocument(id, user.id)
    if (!document) return { success: false, error: 'Documento não encontrado.' }

    await deleteFile(BUCKET, document.storagePath)
    await queries.deleteProjectDocument(id)

    revalidatePath(`/projects/${document.projectId}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Erro ao excluir documento.' }
  }
}

export async function updateDocumentVisibility(
  id: string,
  isPublic: boolean
): Promise<ActionResult<ProjectDocument>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const document = await getOwnedDocument(id, user.id)
    if (!document) return { success: false, error: 'Documento não encontrado.' }

    const updated = await queries.updateDocumentVisibility(id, isPublic)

    revalidatePath(`/projects/${document.projectId}`)
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Erro ao atualizar visibilidade.' }
  }
}
