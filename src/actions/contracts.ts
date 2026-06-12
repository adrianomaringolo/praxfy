'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getCurrentUser } from '@/lib/auth'
import { checkPlanLimit, planLimitMessage } from '@/lib/plan-limits'
import {
  contractSchema,
  type ContractInput,
} from '@/lib/validations/contract'
import * as queries from '@/db/queries/contracts'
import type { ActionResult } from '@/types/actions'
import type { Contract } from '@/db/schema'

function revalidateContract(id?: string) {
  revalidatePath('/contracts')
  if (id) revalidatePath(`/contracts/${id}`)
}

function toDbValues(data: ContractInput) {
  return {
    name: data.name,
    description: data.description || null,
    clientId: data.clientId,
    catalogItemId: data.catalogItemId || null,
    value: data.value != null ? String(data.value) : null,
    currency: data.currency || 'BRL',
    status: data.status,
  }
}

export async function createContract(
  input: ContractInput
): Promise<ActionResult<Contract>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const limitCheck = await checkPlanLimit(user.id, 'contracts')
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: planLimitMessage('contracts', limitCheck.limit),
      }
    }

    const parsed = contractSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const contract = await queries.createContract({
      userId: user.id,
      ...toDbValues(parsed.data),
      publicToken: nanoid(16),
    })

    revalidateContract(contract.id)
    return { success: true, data: contract }
  } catch {
    return { success: false, error: 'Erro ao criar contrato. Tente novamente.' }
  }
}

export async function updateContract(
  id: string,
  input: ContractInput
): Promise<ActionResult<Contract>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const parsed = contractSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const contract = await queries.updateContract(
      id,
      user.id,
      toDbValues(parsed.data)
    )
    if (!contract) return { success: false, error: 'Contrato não encontrado.' }

    revalidateContract(id)
    return { success: true, data: contract }
  } catch {
    return { success: false, error: 'Erro ao atualizar contrato.' }
  }
}

export async function toggleContractToken(
  id: string,
  active: boolean
): Promise<ActionResult<Contract>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const contract = await queries.updateContract(id, user.id, {
      publicTokenActive: active,
    })
    if (!contract) return { success: false, error: 'Contrato não encontrado.' }

    revalidateContract(id)
    return { success: true, data: contract }
  } catch {
    return { success: false, error: 'Erro ao atualizar o portal.' }
  }
}
