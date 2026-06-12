import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do projeto'),
  description: z.string().trim().optional(),
  clientId: z.string().uuid('Selecione um cliente'),
  pipelineId: z.string().uuid('Selecione um pipeline'),
  currentStageId: z.string().uuid('Selecione a etapa inicial'),
  catalogItemId: z.string().uuid().nullable().optional(),
  value: z.number().nonnegative().nullable().optional(),
  currency: z.string().default('BRL'),
  startDate: z.string().nullable().optional(), // 'YYYY-MM-DD'
  dueDate: z.string().nullable().optional(),
})

export type ProjectInput = z.infer<typeof projectSchema>
