'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  TagInput,
  Textarea,
  toast,
} from 'buildgrid-ui'
import { createClient, updateClient } from '@/actions/clients'
import type { Client } from '@/db/schema'

interface ClientFormProps {
  client?: Client
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientForm({ client, open, onOpenChange }: ClientFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setName(client?.name ?? '')
      setEmail(client?.email ?? '')
      setPhone(client?.phone ?? '')
      setNotes(client?.notes ?? '')
      setTags(client?.tags ?? [])
    }
  }, [open, client])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)

    const input = { name, email, phone, notes, tags }
    const result = client
      ? await updateClient(client.id, input)
      : await createClient(input)

    setSubmitting(false)
    if (result.success) {
      toast.success(client ? 'Cliente atualizado' : 'Cliente criado')
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Editar cliente' : 'Novo cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-name">Nome *</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente ou empresa"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="client-phone">Telefone</Label>
              <Input
                id="client-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tags</Label>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="Digite e pressione Enter"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-notes">Notas</Label>
            <Textarea
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações internas sobre o cliente"
              rows={3}
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
              {client ? 'Salvar' : 'Criar cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
