import { z } from 'zod'

export const stageInputSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da etapa'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
})

export const createPipelineWithStagesSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do pipeline'),
  description: z.string().trim().optional(),
  stages: z
    .array(stageInputSchema)
    .min(1, 'Adicione pelo menos uma etapa')
    .max(10, 'Máximo de 10 etapas'),
})

export type CreatePipelineWithStagesInput = z.infer<
  typeof createPipelineWithStagesSchema
>
