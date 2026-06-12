'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TagInput,
  Textarea,
  toast,
} from 'buildgrid-ui'
import { format } from 'date-fns'
import { createRecurrence, updateRecurrence } from '@/actions/recurrences'
import type { FrequencyType } from '@/lib/recurrence-dates'
import type { Contract, Project, Recurrence } from '@/db/schema'

type LinkKind = 'none' | 'project' | 'contract'

interface RecurrenceFormProps {
  recurrence?: Recurrence
  projects: Pick<Project, 'id' | 'name'>[]
  contracts: Pick<Contract, 'id' | 'name'>[]
  defaultContractId?: string
  defaultProjectId?: string
}

export function RecurrenceForm({
  recurrence,
  projects,
  contracts,
  defaultContractId,
  defaultProjectId,
}: RecurrenceFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState(recurrence?.name ?? '')
  const [description, setDescription] = useState(
    recurrence?.description ?? ''
  )
  const initialKind: LinkKind = recurrence?.projectId
    ? 'project'
    : recurrence?.contractId
      ? 'contract'
      : defaultProjectId
        ? 'project'
        : defaultContractId
          ? 'contract'
          : 'none'
  const [linkKind, setLinkKind] = useState<LinkKind>(initialKind)
  const [projectId, setProjectId] = useState(
    recurrence?.projectId ?? defaultProjectId ?? ''
  )
  const [contractId, setContractId] = useState(
    recurrence?.contractId ?? defaultContractId ?? ''
  )
  const [frequencyValue, setFrequencyValue] = useState(
    recurrence?.frequencyValue ?? 1
  )
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(
    recurrence?.frequencyType ?? 'months'
  )
  const [startDate, setStartDate] = useState<Date | undefined>(
    recurrence?.startDate
      ? new Date(`${recurrence.startDate}T00:00:00`)
      : undefined
  )
  const [notifyEmails, setNotifyEmails] = useState<string[]>(
    recurrence?.notifyEmails ?? []
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!startDate) {
      toast.error('Informe a data de início.')
      return
    }
    if (linkKind === 'project' && !projectId) {
      toast.error('Selecione o projeto vinculado.')
      return
    }
    if (linkKind === 'contract' && !contractId) {
      toast.error('Selecione o contrato vinculado.')
      return
    }
    setSubmitting(true)

    const input = {
      name,
      description,
      projectId: linkKind === 'project' ? projectId : null,
      contractId: linkKind === 'contract' ? contractId : null,
      frequencyType,
      frequencyValue: Number(frequencyValue),
      startDate: format(startDate, 'yyyy-MM-dd'),
      notifyEmails,
    }

    const result = recurrence
      ? await updateRecurrence(recurrence.id, input)
      : await createRecurrence(input)

    setSubmitting(false)
    if (result.success) {
      toast.success(
        recurrence ? 'Recorrência atualizada' : 'Recorrência criada'
      )
      router.push(`/recurrences/${result.data.id}`)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 bg-surface-card rounded-xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="rec-name">Nome *</Label>
        <Input
          id="rec-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Renovação do domínio"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rec-desc">Descrição</Label>
        <Textarea
          id="rec-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Vínculo</Label>
          <Select
            value={linkKind}
            onValueChange={(v) => setLinkKind(v as LinkKind)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum (global)</SelectItem>
              <SelectItem value="project">Projeto</SelectItem>
              <SelectItem value="contract">Contrato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {linkKind === 'project' && (
          <div className="flex flex-col gap-2">
            <Label>Projeto *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {linkKind === 'contract' && (
          <div className="flex flex-col gap-2">
            <Label>Contrato *</Label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o contrato" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="rec-freq">Repetir a cada *</Label>
          <div className="flex gap-2">
            <Input
              id="rec-freq"
              type="number"
              min={1}
              value={frequencyValue}
              onChange={(e) => setFrequencyValue(Number(e.target.value))}
              className="w-24"
              required
            />
            <Select
              value={frequencyType}
              onValueChange={(v) => setFrequencyType(v as FrequencyType)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Dias</SelectItem>
                <SelectItem value="weeks">Semanas</SelectItem>
                <SelectItem value="months">Meses</SelectItem>
                <SelectItem value="years">Anos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Data de início *</Label>
          <DatePicker
            date={startDate}
            onDateChange={setStartDate}
            placeholder="Selecionar data"
            language="ptBR"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Emails para notificar</Label>
        <TagInput
          value={notifyEmails}
          onChange={setNotifyEmails}
          placeholder="Digite o email e pressione Enter"
          helperText="Esses endereços recebem um aviso quando a recorrência vence."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={submitting} disabled={submitting}>
          {recurrence ? 'Salvar alterações' : 'Criar recorrência'}
        </Button>
      </div>
    </form>
  )
}
