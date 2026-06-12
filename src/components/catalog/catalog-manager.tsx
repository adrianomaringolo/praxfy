'use client'

import { useEffect, useState } from 'react'
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
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  toast,
} from 'buildgrid-ui'
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createCatalogItem,
  deleteCatalogItem,
  updateCatalogItem,
} from '@/actions/catalog'
import { formatCurrency } from '@/lib/format'
import type { CatalogItem } from '@/db/schema'

function CatalogItemDialog({
  item,
  open,
  onOpenChange,
}: {
  item?: CatalogItem
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '')
      setDescription(item?.description ?? '')
      setBasePrice(item?.basePrice ? Number(item.basePrice) : null)
    }
  }, [open, item])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    const input = { name, description, basePrice, currency: 'BRL' }
    const result = item
      ? await updateCatalogItem(item.id, input)
      : await createCatalogItem(input)
    setSubmitting(false)
    if (result.success) {
      toast.success(item ? 'Serviço atualizado' : 'Serviço criado')
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cat-name">Nome *</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Criação de site institucional"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cat-desc">Descrição</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cat-price">Preço base</Label>
            <CurrencyInput
              id="cat-price"
              currencySymbol="R$"
              decimalSeparator=","
              thousandSeparator="."
              value={basePrice ?? ''}
              onValueChange={(v) => setBasePrice(v)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting} disabled={submitting}>
              {item ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CatalogManager({ items }: { items: CatalogItem[] }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | undefined>()
  const [deleting, setDeleting] = useState<CatalogItem | undefined>()

  async function handleDelete() {
    if (!deleting) return
    const result = await deleteCatalogItem(deleting.id)
    setDeleting(undefined)
    if (result.success) {
      toast.success('Serviço excluído')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Catálogo
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Os serviços que você oferece, com preço base de referência.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <Plus size={16} className="mr-2" />
          Novo serviço
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BookOpen size={40} className="text-text-muted" />
          <p className="text-sm font-medium text-text-primary">
            Catálogo vazio
          </p>
          <p className="text-sm text-text-muted max-w-sm">
            Cadastre os serviços que você oferece para usar nos projetos e
            contratos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-text-primary">
                  {item.name}
                </h2>
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar serviço"
                    onClick={() => {
                      setEditing(item)
                      setFormOpen(true)
                    }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir serviço"
                    onClick={() => setDeleting(item)}
                  >
                    <Trash2 size={14} className="text-danger" />
                  </Button>
                </div>
              </div>
              {item.description && (
                <p className="text-sm text-text-secondary line-clamp-3">
                  {item.description}
                </p>
              )}
              <p className="text-lg font-display font-bold text-primary-700 mt-auto">
                {formatCurrency(item.basePrice, item.currency ?? 'BRL')}
              </p>
            </div>
          ))}
        </div>
      )}

      <CatalogItemDialog
        item={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir <strong>{deleting?.name}</strong> do catálogo? Serviços
              usados em projetos ou contratos não podem ser excluídos.
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
