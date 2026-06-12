'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  toast,
} from 'buildgrid-ui'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createPipeline,
  createStage,
  deletePipeline,
  deleteStage,
  updatePipeline,
  updateStage,
  updateStagesOrder,
} from '@/actions/pipelines'
import { STAGE_COLORS } from '@/lib/stage-colors'
import type { Pipeline, PipelineStage } from '@/db/schema'

type PipelineWithStages = Pipeline & { stages: PipelineStage[] }

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {STAGE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Cor ${color}`}
          onClick={() => onChange(color)}
          className={`w-5 h-5 rounded-full border-2 transition-transform ${
            value === color
              ? 'border-primary-700 scale-110'
              : 'border-transparent'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

function PipelineDialog({
  pipeline,
  open,
  onOpenChange,
}: {
  pipeline?: Pipeline
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [name, setName] = useState(pipeline?.name ?? '')
  const [description, setDescription] = useState(pipeline?.description ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    const result = pipeline
      ? await updatePipeline(pipeline.id, { name, description })
      : await createPipeline(name, description)
    setSubmitting(false)
    if (result.success) {
      toast.success(pipeline ? 'Pipeline atualizado' : 'Pipeline criado')
      onOpenChange(false)
      if (!pipeline) {
        setName('')
        setDescription('')
      }
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {pipeline ? 'Editar pipeline' : 'Novo pipeline'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pl-name">Nome *</Label>
            <Input
              id="pl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Projetos Web"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pl-desc">Descrição</Label>
            <Textarea
              id="pl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting} disabled={submitting}>
              {pipeline ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StageRow({
  stage,
  isFirst,
  isLast,
  onMove,
}: {
  stage: PipelineStage
  isFirst: boolean
  isLast: boolean
  onMove: (stageId: string, direction: -1 | 1) => void
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(stage.name)
  const [color, setColor] = useState(stage.color)
  const [submitting, setSubmitting] = useState(false)

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    const result = await updateStage(stage.id, { name, color })
    setSubmitting(false)
    if (result.success) {
      toast.success('Etapa atualizada')
      setEditOpen(false)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleDelete() {
    const result = await deleteStage(stage.id)
    setDeleteOpen(false)
    if (result.success) {
      toast.success('Etapa excluída')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: stage.color }}
      />
      <span className="flex-1 text-sm text-text-primary">{stage.name}</span>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Mover para cima"
          disabled={isFirst}
          onClick={() => onMove(stage.id, -1)}
        >
          <ArrowUp size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Mover para baixo"
          disabled={isLast}
          onClick={() => onMove(stage.id, 1)}
        >
          <ArrowDown size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editar etapa"
          onClick={() => setEditOpen(true)}
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir etapa"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={16} className="text-danger" />
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar etapa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`stage-name-${stage.id}`}>Nome *</Label>
              <Input
                id={`stage-name-${stage.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Cor</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                disabled={submitting}
              >
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir a etapa <strong>{stage.name}</strong>? Projetos nessa
              etapa impedem a exclusão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-danger hover:bg-danger/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PipelineCard({ pipeline }: { pipeline: PipelineWithStages }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newStageName, setNewStageName] = useState('')
  const [newStageColor, setNewStageColor] = useState(STAGE_COLORS[0])
  const [addingStage, setAddingStage] = useState(false)

  async function handleMoveStage(stageId: string, direction: -1 | 1) {
    const index = pipeline.stages.findIndex((s) => s.id === stageId)
    const target = index + direction
    if (target < 0 || target >= pipeline.stages.length) return

    const reordered = [...pipeline.stages]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)

    const result = await updateStagesOrder(
      reordered.map((stage, order) => ({ id: stage.id, order }))
    )
    if (result.success) {
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleAddStage(event: React.FormEvent) {
    event.preventDefault()
    setAddingStage(true)
    const result = await createStage(pipeline.id, newStageName, newStageColor)
    setAddingStage(false)
    if (result.success) {
      toast.success('Etapa adicionada')
      setNewStageName('')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleDeletePipeline() {
    const result = await deletePipeline(pipeline.id)
    setDeleteOpen(false)
    if (result.success) {
      toast.success('Pipeline excluído')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-display font-semibold text-text-primary">
            {pipeline.name}
          </h2>
          {pipeline.description && (
            <p className="text-sm text-text-secondary mt-0.5">
              {pipeline.description}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar pipeline"
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir pipeline"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={16} className="text-danger" />
          </Button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {pipeline.stages.map((stage, index) => (
          <StageRow
            key={stage.id}
            stage={stage}
            isFirst={index === 0}
            isLast={index === pipeline.stages.length - 1}
            onMove={handleMoveStage}
          />
        ))}
      </div>

      <form
        onSubmit={handleAddStage}
        className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-gray-100 bg-surface-muted rounded-b-xl"
      >
        <Input
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          placeholder="Nova etapa"
          required
          className="flex-1 min-w-40 bg-white"
        />
        <ColorPicker value={newStageColor} onChange={setNewStageColor} />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          isLoading={addingStage}
          disabled={addingStage}
        >
          <Plus size={16} className="mr-1" />
          Adicionar
        </Button>
      </form>

      <PipelineDialog
        pipeline={pipeline}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir <strong>{pipeline.name}</strong> e todas as suas etapas?
              Pipelines com projetos vinculados não podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePipeline}
              className="bg-danger hover:bg-danger/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function PipelinesManager({
  pipelines,
}: {
  pipelines: PipelineWithStages[]
}) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Pipelines
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Configure as etapas pelas quais seus projetos passam.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} className="mr-2" />
          Novo pipeline
        </Button>
      </div>

      {pipelines.length === 0 ? (
        <p className="text-sm text-text-muted">
          Nenhum pipeline criado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {pipelines.map((pipeline) => (
            <PipelineCard key={pipeline.id} pipeline={pipeline} />
          ))}
        </div>
      )}

      <PipelineDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
