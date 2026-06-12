import { addDays, addMonths, addWeeks, addYears, format, parseISO } from 'date-fns'

export type FrequencyType = 'days' | 'weeks' | 'months' | 'years'

/** Calcula a próxima data de ocorrência ('YYYY-MM-DD') a partir da atual */
export function nextOccurrenceDate(
  current: string,
  type: FrequencyType,
  value: number
): string {
  const date = parseISO(current)
  const next = {
    days: () => addDays(date, value),
    weeks: () => addWeeks(date, value),
    months: () => addMonths(date, value),
    years: () => addYears(date, value),
  }[type]()
  return format(next, 'yyyy-MM-dd')
}

export const frequencyLabels: Record<FrequencyType, [string, string]> = {
  days: ['dia', 'dias'],
  weeks: ['semana', 'semanas'],
  months: ['mês', 'meses'],
  years: ['ano', 'anos'],
}

/** "A cada 2 semanas", "A cada 1 mês" → "Mensal"-like simples */
export function formatFrequency(type: FrequencyType, value: number) {
  const [singular, plural] = frequencyLabels[type]
  return `A cada ${value} ${value === 1 ? singular : plural}`
}
