'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DataTable,
  toast,
  type DataTableColumn,
} from 'buildgrid-ui'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteClient } from '@/actions/clients'
import { tableLabels } from '@/lib/table-labels'
import { ClientForm } from './client-form'
import type { Client } from '@/db/schema'

export function ClientsTable({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Client | undefined>(undefined)
  const [deleting, setDeleting] = useState<Client | undefined>(undefined)

  async function handleDelete() {
    if (!deleting) return
    const result = await deleteClient(deleting.id)
    setDeleting(undefined)
    if (result.success) {
      toast.success('Cliente excluído')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const columns: DataTableColumn<Client>[] = [
    { key: 'name', title: 'Nome', sortable: true },
    {
      key: 'email',
      title: 'Email',
      customRenderer: (value) => value || '—',
    },
    {
      key: 'phone',
      title: 'Telefone',
      customRenderer: (value) => value || '—',
    },
    {
      key: 'tags',
      title: 'Tags',
      customRenderer: (value: string[] | null) =>
        value?.length ? (
          <div className="flex flex-wrap gap-1">
            {value.map((tag) => (
              <span
                key={tag}
                className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-accent-light text-primary-800"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'id',
      title: 'Ações',
      align: 'right',
      customRenderer: (_value, row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ver detalhes"
            onClick={() => router.push(`/clients/${row.id}`)}
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar"
            onClick={() => {
              setEditing(row)
              setFormOpen(true)
            }}
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir"
            onClick={() => setDeleting(row)}
          >
            <Trash2 size={16} className="text-danger" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Clientes
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie seus clientes e veja os serviços vinculados.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <Plus size={16} className="mr-2" />
          Novo Cliente
        </Button>
      </div>

      <DataTable
        data={clients}
        columns={columns}
        searchFields={['name', 'email', 'phone']}
        labels={tableLabels}
        className="overflow-x-auto"
        pageSize={10}
      />

      <ClientForm
        client={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{' '}
              <strong>{deleting?.name}</strong>? Essa ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-danger hover:bg-danger/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
