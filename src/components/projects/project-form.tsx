'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  CurrencyInput,
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from 'buildgrid-ui'
import { format } from 'date-fns'
import { createProject, updateProject } from '@/actions/projects'
import type {
  CatalogItem,
  Client,
  Pipeline,
  PipelineStage,
  Project,
} from '@/db/schema'

type PipelineWithStages = Pipeline & { stages: PipelineStage[] }

interface ProjectFormProps {
  project?: Project
  clients: Client[]
  pipelines: PipelineWithStages[]
  catalogItems: CatalogItem[]
  onSuccess?: () => void
}

const NONE = '__none__'

function toDateString(date: Date | undefined) {
  return date ? format(date, 'yyyy-MM-dd') : null
}

function fromDateString(value: string | null | undefined) {
  return value ? new Date(`${value}T00:00:00`) : undefined
}

export function ProjectForm({
  project,
  clients,
  pipelines,
  catalogItems,
  onSuccess,
}: ProjectFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [clientId, setClientId] = useState(project?.clientId ?? '')
  const [pipelineId, setPipelineId] = useState(project?.pipelineId ?? '')
  const [stageId, setStageId] = useState(project?.currentStageId ?? '')
  const [catalogItemId, setCatalogItemId] = useState(
    project?.catalogItemId ?? NONE
  )
  const [value, setValue] = useState<number | null>(
    project?.value ? Number(project.value) : null
  )
  const [currency, setCurrency] = useState(project?.currency ?? 'BRL')
  const [startDate, setStartDate] = useState<Date | undefined>(
    fromDateString(project?.startDate)
  )
  const [dueDate, setDueDate] = useState<Date | undefined>(
    fromDateString(project?.dueDate)
  )

  const stages = useMemo(
    () => pipelines.find((p) => p.id === pipelineId)?.stages ?? [],
    [pipelines, pipelineId]
  )

  function handlePipelineChange(id: string) {
    setPipelineId(id)
    const first = pipelines.find((p) => p.id === id)?.stages[0]
    setStageId(first?.id ?? '')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!clientId || !pipelineId || !stageId) {
      toast.error('Selecione cliente, pipeline e etapa inicial.')
      return
    }
    setSubmitting(true)

    const input = {
      name,
      description,
      clientId,
      pipelineId,
      currentStageId: stageId,
      catalogItemId: catalogItemId === NONE ? null : catalogItemId,
      value,
      currency,
      startDate: toDateString(startDate),
      dueDate: toDateString(dueDate),
    }

    const result = project
      ? await updateProject(project.id, input)
      : await createProject(input)

    setSubmitting(false)
    if (result.success) {
      toast.success(project ? 'Projeto atualizado' : 'Projeto criado')
      onSuccess?.()
      router.push(`/projects/${result.data.id}`)
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
        <Label htmlFor="prj-name">Nome do projeto *</Label>
        <Input
          id="prj-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Site institucional"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="prj-desc">Descrição</Label>
        <Textarea
          id="prj-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Cliente *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Serviço do catálogo</Label>
          <Select value={catalogItemId} onValueChange={setCatalogItemId}>
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhum</SelectItem>
              {catalogItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Pipeline *</Label>
          <Select value={pipelineId} onValueChange={handlePipelineChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Etapa inicial *</Label>
          <Select
            value={stageId}
            onValueChange={setStageId}
            disabled={!pipelineId}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  pipelineId
                    ? 'Selecione a etapa'
                    : 'Escolha um pipeline antes'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="prj-value">Valor</Label>
          <CurrencyInput
            id="prj-value"
            currencySymbol="R$"
            decimalSeparator=","
            thousandSeparator="."
            value={value ?? ''}
            onValueChange={(v) => setValue(v)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Moeda</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">BRL — Real</SelectItem>
              <SelectItem value="USD">USD — Dólar</SelectItem>
              <SelectItem value="EUR">EUR — Euro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Data de início</Label>
          <DatePicker
            date={startDate}
            onDateChange={setStartDate}
            placeholder="Selecionar data"
            language="ptBR"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Prazo</Label>
          <DatePicker
            date={dueDate}
            onDateChange={setDueDate}
            placeholder="Selecionar data"
            language="ptBR"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" isLoading={submitting} disabled={submitting}>
          {project ? 'Salvar alterações' : 'Criar projeto'}
        </Button>
      </div>
    </form>
  )
}
