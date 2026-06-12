'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { checkPlanLimit, planLimitMessage } from '@/lib/plan-limits'
import { clientSchema, type ClientInput } from '@/lib/validations/client'
import * as queries from '@/db/queries/clients'
import type { ActionResult } from '@/types/actions'
import type { Client } from '@/db/schema'

export async function createClient(
  input: ClientInput
): Promise<ActionResult<Client>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const limitCheck = await checkPlanLimit(user.id, 'clients')
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: planLimitMessage('clients', limitCheck.limit),
      }
    }

    const parsed = clientSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const client = await queries.createClient({
      userId: user.id,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      tags: parsed.data.tags ?? [],
    })

    revalidatePath('/clients')
    return { success: true, data: client }
  } catch {
    return { success: false, error: 'Erro ao criar cliente. Tente novamente.' }
  }
}

export async function updateClient(
  id: string,
  input: ClientInput
): Promise<ActionResult<Client>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const parsed = clientSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const client = await queries.updateClient(id, user.id, {
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      tags: parsed.data.tags ?? [],
    })
    if (!client) return { success: false, error: 'Cliente não encontrado.' }

    revalidatePath('/clients')
    revalidatePath(`/clients/${id}`)
    return { success: true, data: client }
  } catch {
    return {
      success: false,
      error: 'Erro ao atualizar cliente. Tente novamente.',
    }
  }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    await queries.deleteClient(id, user.id)

    revalidatePath('/clients')
    return { success: true, data: undefined }
  } catch {
    return {
      success: false,
      error:
        'Erro ao excluir cliente. Verifique se não há projetos ou contratos vinculados.',
    }
  }
}
