'use client'

import { useRouter } from 'next/navigation'
import { Button, DataTable, type DataTableColumn } from 'buildgrid-ui'
import { Eye, Plus } from 'lucide-react'
import { tableLabels } from '@/lib/table-labels'
import { formatCurrency } from '@/lib/format'
import { StatusBadge } from '@/components/ui/status-badge'

export interface ContractRow extends Record<string, unknown> {
  id: string
  name: string
  clientName: string
  value: string | null
  currency: string
  status: string
}

export function ContractsTable({ contracts }: { contracts: ContractRow[] }) {
  const router = useRouter()

  const columns: DataTableColumn<ContractRow>[] = [
    { key: 'name', title: 'Nome', sortable: true },
    { key: 'clientName', title: 'Cliente', sortable: true },
    {
      key: 'value',
      title: 'Valor',
      align: 'right',
      customRenderer: (value, row) =>
        formatCurrency(value as string, row.currency),
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
          aria-label="Ver contrato"
          onClick={() => router.push(`/contracts/${row.id}`)}
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
            Contratos
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Serviços recorrentes sem prazo de término.
          </p>
        </div>
        <Button onClick={() => router.push('/contracts/new')}>
          <Plus size={16} className="mr-2" />
          Novo Contrato
        </Button>
      </div>

      <DataTable
        data={contracts}
        columns={columns}
        searchFields={['name', 'clientName']}
        filters={[
          {
            field: 'status',
            label: 'Status',
            options: [
              { label: 'Ativo', value: 'active' },
              { label: 'Pausado', value: 'paused' },
              { label: 'Cancelado', value: 'cancelled' },
            ],
          },
        ]}
        labels={tableLabels}
        pageSize={10}
      />
    </>
  )
}
