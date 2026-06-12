import { z } from 'zod'

export const recurrenceSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da recorrência'),
  description: z.string().trim().optional(),
  projectId: z.string().uuid().nullable().optional(),
  contractId: z.string().uuid().nullable().optional(),
  frequencyType: z.enum(['days', 'weeks', 'months', 'years']),
  frequencyValue: z
    .number()
    .int()
    .positive('A frequência deve ser maior que zero'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de início'),
  notifyEmails: z.array(z.string().email('Email inválido')).default([]),
})

export type RecurrenceInput = z.infer<typeof recurrenceSchema>
