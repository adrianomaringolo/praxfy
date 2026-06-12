import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do cliente'),
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
})

export type ClientInput = z.infer<typeof clientSchema>
