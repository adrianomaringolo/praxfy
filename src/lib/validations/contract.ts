import { z } from 'zod'

export const contractSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do contrato'),
  description: z.string().trim().optional(),
  clientId: z.string().uuid('Selecione um cliente'),
  catalogItemId: z.string().uuid().nullable().optional(),
  value: z.number().nonnegative().nullable().optional(),
  currency: z.string().default('BRL'),
  status: z.enum(['active', 'paused', 'cancelled']).default('active'),
})

export type ContractInput = z.infer<typeof contractSchema>
