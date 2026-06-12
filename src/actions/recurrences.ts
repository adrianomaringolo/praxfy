'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { checkPlanLimit, planLimitMessage } from '@/lib/plan-limits'
import { nextOccurrenceDate } from '@/lib/recurrence-dates'
import {
  recurrenceSchema,
  type RecurrenceInput,
} from '@/lib/validations/recurrence'
import * as queries from '@/db/queries/recurrences'
import {
  completeOccurrence as completeOccurrenceQuery,
  createOccurrence,
  getOccurrenceById,
} from '@/db/queries/recurrence-occurrences'
import type { ActionResult } from '@/types/actions'
import type { Recurrence, RecurrenceOccurrence } from '@/db/schema'

function revalidateRecurrence(id?: string) {
  revalidatePath('/recurrences')
  revalidatePath('/dashboard')
  if (id) revalidatePath(`/recurrences/${id}`)
}

function toDbValues(data: RecurrenceInput) {
  return {
    name: data.name,
    description: data.description || null,
    projectId: data.projectId || null,
    contractId: data.contractId || null,
    frequencyType: data.frequencyType,
    frequencyValue: data.frequencyValue,
    startDate: data.startDate,
    notifyEmails: data.notifyEmails,
  }
}

export async function createRecurrence(
  input: RecurrenceInput
): Promise<ActionResult<Recurrence>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const limitCheck = await checkPlanLimit(user.id, 'recurrences')
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: planLimitMessage('recurrences', limitCheck.limit),
      }
    }

    const parsed = recurrenceSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const recurrence = await queries.createRecurrence({
      userId: user.id,
      ...toDbValues(parsed.data),
      nextOccurrenceAt: parsed.data.startDate,
    })

    // Primeira ocorrência pendente, agendada para a data de início
    await createOccurrence({
      recurrenceId: recurrence.id,
      scheduledAt: parsed.data.startDate,
      status: 'pending',
    })

    revalidateRecurrence(recurrence.id)
    return { success: true, data: recurrence }
  } catch {
    return { success: false, error: 'Erro ao criar recorrência.' }
  }
}

export async function updateRecurrence(
  id: string,
  input: RecurrenceInput
): Promise<ActionResult<Recurrence>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const parsed = recurrenceSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const recurrence = await queries.updateRecurrence(
      id,
      user.id,
      toDbValues(parsed.data)
    )
    if (!recurrence) {
      return { success: false, error: 'Recorrência não encontrada.' }
    }

    revalidateRecurrence(id)
    return { success: true, data: recurrence }
  } catch {
    return { success: false, error: 'Erro ao atualizar recorrência.' }
  }
}

async function setStatus(
  id: string,
  status: 'active' | 'paused' | 'cancelled'
): Promise<ActionResult<Recurrence>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const recurrence = await queries.updateRecurrence(id, user.id, { status })
    if (!recurrence) {
      return { success: false, error: 'Recorrência não encontrada.' }
    }

    revalidateRecurrence(id)
    return { success: true, data: recurrence }
  } catch {
    return { success: false, error: 'Erro ao atualizar status.' }
  }
}

export async function pauseRecurrence(id: string) {
  return setStatus(id, 'paused')
}

export async function resumeRecurrence(id: string) {
  return setStatus(id, 'active')
}

export async function cancelRecurrence(id: string) {
  return setStatus(id, 'cancelled')
}

export async function completeOccurrence(
  occurrenceId: string,
  notes?: string
): Promise<ActionResult<RecurrenceOccurrence>> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    const occurrence = await getOccurrenceById(occurrenceId)
    if (!occurrence) {
      return { success: false, error: 'Ocorrência não encontrada.' }
    }
    if (occurrence.status !== 'pending') {
      return { success: false, error: 'Esta ocorrência já foi concluída.' }
    }

    const recurrence = await queries.getRecurrenceById(
      occurrence.recurrenceId,
      user.id
    )
    if (!recurrence) {
      return { success: false, error: 'Recorrência não encontrada.' }
    }

    // 1. Marca como feita
    const completed = await completeOccurrenceQuery(occurrenceId, notes)

    // 2. Cria a próxima ocorrência pendente
    const nextDate = nextOccurrenceDate(
      occurrence.scheduledAt,
      recurrence.frequencyType,
      recurrence.frequencyValue
    )
    await createOccurrence({
      recurrenceId: recurrence.id,
      scheduledAt: nextDate,
      status: 'pending',
    })

    // 3. Atualiza a próxima data na recorrência
    await queries.updateNextOccurrence(recurrence.id, nextDate)

    revalidateRecurrence(recurrence.id)
    return { success: true, data: completed }
  } catch {
    return { success: false, error: 'Erro ao concluir ocorrência.' }
  }
}
