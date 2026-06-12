import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Formata valores monetários: 1234.5 → "R$ 1.234,50" */
export function formatCurrency(
  value: string | number | null | undefined,
  currency = 'BRL'
) {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(
    num
  )
}

/** Formata datas (Date ou 'YYYY-MM-DD') → "11/06/2026" */
export function formatDate(value: Date | string | null | undefined) {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

/** Formata data e hora → "11/06/2026 às 14h30" */
export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, "dd/MM/yyyy 'às' HH'h'mm", { locale: ptBR })
}

/** Data de hoje no formato 'YYYY-MM-DD' (colunas date do Postgres) */
export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}
