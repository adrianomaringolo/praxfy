'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
  toast,
} from 'buildgrid-ui'
import { CheckCircle2, Pause, Play, XCircle } from 'lucide-react'
import {
  cancelRecurrence,
  completeOccurrence,
  pauseRecurrence,
  resumeRecurrence,
} from '@/actions/recurrences'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatDateTime } from '@/lib/format'
import type { Recurrence, RecurrenceOccurrence } from '@/db/schema'

export function RecurrenceStatusActions({
  recurrence,
}: {
  recurrence: Recurrence
}) {
  const router = useRouter()

  async function run(
    action: (id: string) => Promise<{ success: boolean; error?: string }>,
    message: string
  ) {
    const result = await action(recurrence.id)
    if (result.success) {
      toast.success(message)
      router.refresh()
    } else {
      toast.error(result.error ?? 'Erro.')
    }
  }

  return (
    <div className="flex gap-2">
      {recurrence.status === 'active' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => run(pauseRecurrence, 'Recorrência pausada')}
        >
          <Pause size={14} className="mr-1" />
          Pausar
        </Button>
      )}
      {recurrence.status === 'paused' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => run(resumeRecurrence, 'Recorrência reativada')}
        >
          <Play size={14} className="mr-1" />
          Reativar
        </Button>
      )}
      {recurrence.status !== 'cancelled' && (
        <Button
          variant="outline"
          size="sm"
          className="text-danger"
          onClick={() => run(cancelRecurrence, 'Recorrência cancelada')}
        >
          <XCircle size={14} className="mr-1" />
          Cancelar
        </Button>
      )}
    </div>
  )
}

export function OccurrencesList({
  occurrences,
}: {
  occurrences: RecurrenceOccurrence[]
}) {
  const router = useRouter()
  const [completing, setCompleting] = useState<
    RecurrenceOccurrence | undefined
  >()
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleComplete(event: React.FormEvent) {
    event.preventDefault()
    if (!completing) return
    setSubmitting(true)
    const result = await completeOccurrence(completing.id, notes || undefined)
    setSubmitting(false)
    if (result.success) {
      toast.success('Ocorrência concluída')
      setCompleting(undefined)
      setNotes('')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  if (occurrences.length === 0) {
    return (
      <p className="text-sm text-text-muted">Nenhuma ocorrência registrada.</p>
    )
  }

  return (
    <>
      <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {occurrences.map((occurrence) => (
          <div
            key={occurrence.id}
            className="flex items-center gap-4 px-5 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                Prevista para {formatDate(occurrence.scheduledAt)}
              </p>
              {occurrence.executedAt && (
                <p className="text-xs text-text-muted">
                  Concluída em {formatDateTime(occurrence.executedAt)}
                </p>
              )}
              {occurrence.notes && (
                <p className="text-xs text-text-secondary mt-1">
                  {occurrence.notes}
                </p>
              )}
            </div>
            <StatusBadge status={occurrence.status ?? 'pending'} />
            {occurrence.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCompleting(occurrence)}
              >
                <CheckCircle2 size={14} className="mr-1" />
                Marcar como feita
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={!!completing}
        onOpenChange={(open) => !open && setCompleting(undefined)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir ocorrência</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleComplete} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="occ-notes">Observações (opcional)</Label>
              <Textarea
                id="occ-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="O que foi feito neste ciclo?"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCompleting(undefined)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                disabled={submitting}
              >
                Concluir
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
