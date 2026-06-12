'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import * as queries from '@/db/queries/catalog'
import type { ActionResult } from '@/types/actions'
import type { CatalogItem } from '@/db/schema'

const catalogItemSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do serviço'),
  description: z.string().trim().optional(),
  basePrice: z.number().nonnegative().nullable().optional(),
  currency: z.string().default('BRL'),
})

export type CatalogItemInput = z.infer<typeof catalogItemSchema>

function toDbValues(data: CatalogItemInput) {
  return {
    name: data.name,
    description: data.description || null,
    basePrice: data.basePrice != null ? String(data.basePrice) : null,
    currency: data.currency || 'BRL',
  }
}

export async function createCatalogItem(
  input: CatalogItemInput
): Promise<ActionResult<CatalogItem>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const parsed = catalogItemSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const item = await queries.createCatalogItem({
      userId: user.id,
      ...toDbValues(parsed.data),
    })

    revalidatePath('/catalog')
    return { success: true, data: item }
  } catch {
    return { success: false, error: 'Erro ao criar serviço.' }
  }
}

export async function updateCatalogItem(
  id: string,
  input: CatalogItemInput
): Promise<ActionResult<CatalogItem>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const parsed = catalogItemSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const item = await queries.updateCatalogItem(
      id,
      user.id,
      toDbValues(parsed.data)
    )
    if (!item) return { success: false, error: 'Serviço não encontrado.' }

    revalidatePath('/catalog')
    return { success: true, data: item }
  } catch {
    return { success: false, error: 'Erro ao atualizar serviço.' }
  }
}

export async function deleteCatalogItem(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const item = await queries.getCatalogItemById(id, user.id)
    if (!item) return { success: false, error: 'Serviço não encontrado.' }

    const usage = await queries.countCatalogItemUsage(id)
    if (usage > 0) {
      return {
        success: false,
        error: `Este serviço é usado em ${usage} projeto(s)/contrato(s) e não pode ser excluído.`,
      }
    }

    await queries.deleteCatalogItem(id, user.id)

    revalidatePath('/catalog')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Erro ao excluir serviço.' }
  }
}
