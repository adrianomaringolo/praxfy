'use client'

import { useRouter } from 'next/navigation'
import { Button, DataTable, type DataTableColumn } from 'buildgrid-ui'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Eye, Plus } from 'lucide-react'
import { tableLabels } from '@/lib/table-labels'
import { formatDate } from '@/lib/format'
import { StatusBadge } from '@/components/ui/status-badge'

export interface RecurrenceRow extends Record<string, unknown> {
  id: string
  name: string
  linkedTo: string
  frequency: string
  nextOccurrenceAt: string
  status: string
}

function NextOccurrenceCell({
  date,
  status,
}: {
  date: string
  status: string
}) {
  const days = differenceInCalendarDays(parseISO(date), new Date())
  const isActive = status === 'active'
  const className =
    isActive && days < 0
      ? 'text-danger font-semibold'
      : isActive && days <= 7
        ? 'text-warning font-semibold'
        : 'text-text-secondary'
  return (
    <span className={`text-sm ${className}`}>
      {formatDate(date)}
      {isActive && days < 0 && ' (vencida)'}
    </span>
  )
}

export function RecurrencesTable({
  recurrences,
}: {
  recurrences: RecurrenceRow[]
}) {
  const router = useRouter()

  const columns: DataTableColumn<RecurrenceRow>[] = [
    { key: 'name', title: 'Nome', sortable: true },
    { key: 'linkedTo', title: 'Vinculado a' },
    { key: 'frequency', title: 'Frequência' },
    {
      key: 'nextOccurrenceAt',
      title: 'Próxima ocorrência',
      sortable: true,
      customRenderer: (value, row) => (
        <NextOccurrenceCell date={value as string} status={row.status} />
      ),
    },
    {
      key: 'status',
      title: 'Status',
      customRenderer: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'id',
      title: 'Ações',
      align: 'right',
      customRenderer: (_value, row) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ver recorrência"
          onClick={() => router.push(`/recurrences/${row.id}`)}
        >
          <Eye size={16} />
        </Button>
      ),
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Recorrências
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Lembretes automáticos para manutenções, renovações e mais.
          </p>
        </div>
        <Button onClick={() => router.push('/recurrences/new')}>
          <Plus size={16} className="mr-2" />
          Nova Recorrência
        </Button>
      </div>

      <DataTable
        data={recurrences}
        columns={columns}
        searchFields={['name', 'linkedTo']}
        filters={[
          {
            field: 'status',
            label: 'Status',
            options: [
              { label: 'Ativa', value: 'active' },
              { label: 'Pausada', value: 'paused' },
              { label: 'Cancelada', value: 'cancelled' },
            ],
          },
        ]}
        labels={tableLabels}
        className="overflow-x-auto"
        pageSize={10}
      />
    </>
  )
}
