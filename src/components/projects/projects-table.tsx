'use client'

import { useRouter } from 'next/navigation'
import { Button, DataTable, type DataTableColumn } from 'buildgrid-ui'
import { Eye, Plus } from 'lucide-react'
import { tableLabels } from '@/lib/table-labels'
import { formatCurrency, formatDate } from '@/lib/format'

export interface ProjectRow extends Record<string, unknown> {
  id: string
  name: string
  clientName: string
  pipelineName: string
  stageName: string
  stageColor: string
  value: string | null
  currency: string
  dueDate: string | null
}

export function ProjectsTable({
  projects,
  pipelineOptions,
}: {
  projects: ProjectRow[]
  pipelineOptions: { label: string; value: string }[]
}) {
  const router = useRouter()

  const columns: DataTableColumn<ProjectRow>[] = [
    { key: 'name', title: 'Nome', sortable: true },
    { key: 'clientName', title: 'Cliente', sortable: true },
    {
      key: 'stageName',
      title: 'Etapa atual',
      customRenderer: (_value, row) =>
        row.stageName ? (
          <span
            className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: row.stageColor || '#6366f1' }}
          >
            {row.stageName}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'value',
      title: 'Valor',
      align: 'right',
      customRenderer: (value, row) => formatCurrency(value as string, row.currency),
    },
    {
      key: 'dueDate',
      title: 'Prazo',
      sortable: true,
      customRenderer: (value) => formatDate(value as string),
    },
    {
      key: 'id',
      title: 'Ações',
      align: 'right',
      customRenderer: (_value, row) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ver projeto"
          onClick={() => router.push(`/projects/${row.id}`)}
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
            Projetos
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Acompanhe cada etapa até a entrega.
          </p>
        </div>
        <Button onClick={() => router.push('/projects/new')}>
          <Plus size={16} className="mr-2" />
          Novo Projeto
        </Button>
      </div>

      <DataTable
        data={projects}
        columns={columns}
        searchFields={['name', 'clientName']}
        filters={[
          {
            field: 'pipelineName',
            label: 'Pipeline',
            options: pipelineOptions,
          },
        ]}
        labels={tableLabels}
        className="overflow-x-auto"
        pageSize={10}
      />
    </>
  )
}
