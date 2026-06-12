'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, toast } from 'buildgrid-ui'
import { Plus, Trash2 } from 'lucide-react'
import { createPipelineWithStages } from '@/actions/pipelines'
import { STAGE_COLORS } from '@/lib/stage-colors'

const MIN_STAGES = 3
const MAX_STAGES = 5

const defaultStages = [
  { name: 'A fazer', color: STAGE_COLORS[1] },
  { name: 'Em andamento', color: STAGE_COLORS[4] },
  { name: 'Em revisão', color: STAGE_COLORS[7] },
  { name: 'Concluído', color: STAGE_COLORS[3] },
]

export function OnboardingForm() {
  const router = useRouter()
  const [name, setName] = useState('Meus Projetos')
  const [stages, setStages] = useState(defaultStages)
  const [submitting, setSubmitting] = useState(false)

  function updateStage(index: number, data: Partial<(typeof stages)[0]>) {
    setStages((prev) =>
      prev.map((stage, i) => (i === index ? { ...stage, ...data } : stage))
    )
  }

  function addStage() {
    if (stages.length >= MAX_STAGES) return
    setStages((prev) => [
      ...prev,
      { name: '', color: STAGE_COLORS[prev.length % STAGE_COLORS.length] },
    ])
  }

  function removeStage(index: number) {
    if (stages.length <= MIN_STAGES) return
    setStages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)

    const result = await createPipelineWithStages({ name, stages })
    if (result.success) {
      toast.success('Pipeline criado! Vamos começar.')
      router.push('/dashboard')
      router.refresh()
    } else {
      toast.error(result.error)
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 bg-surface-card rounded-xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="pipeline-name">Nome do pipeline</Label>
        <Input
          id="pipeline-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Meus Projetos"
          required
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label>Etapas ({MIN_STAGES} a {MAX_STAGES})</Label>
        {stages.map((stage, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={stage.name}
              onChange={(e) => updateStage(index, { name: e.target.value })}
              placeholder={`Etapa ${index + 1}`}
              required
              className="flex-1"
            />
            <div className="flex items-center gap-1">
              {STAGE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Cor ${color}`}
                  onClick={() => updateStage(index, { color })}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    stage.color === color
                      ? 'border-primary-700 scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remover etapa"
              onClick={() => removeStage(index)}
              disabled={stages.length <= MIN_STAGES}
            >
              <Trash2 size={16} className="text-text-muted" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStage}
          disabled={stages.length >= MAX_STAGES}
          className="self-start"
        >
          <Plus size={16} className="mr-2" />
          Adicionar etapa
        </Button>
      </div>

      <Button type="submit" isLoading={submitting} disabled={submitting}>
        Criar pipeline e começar
      </Button>
    </form>
  )
}
