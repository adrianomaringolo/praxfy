'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  CurrencyInput,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from 'buildgrid-ui'
import { createContract, updateContract } from '@/actions/contracts'
import type { CatalogItem, Client, Contract } from '@/db/schema'

const NONE = '__none__'

interface ContractFormProps {
  contract?: Contract
  clients: Client[]
  catalogItems: CatalogItem[]
}

export function ContractForm({
  contract,
  clients,
  catalogItems,
}: ContractFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState(contract?.name ?? '')
  const [description, setDescription] = useState(contract?.description ?? '')
  const [clientId, setClientId] = useState(contract?.clientId ?? '')
  const [catalogItemId, setCatalogItemId] = useState(
    contract?.catalogItemId ?? NONE
  )
  const [value, setValue] = useState<number | null>(
    contract?.value ? Number(contract.value) : null
  )
  const [currency, setCurrency] = useState(contract?.currency ?? 'BRL')
  const [status, setStatus] = useState<'active' | 'paused' | 'cancelled'>(
    contract?.status ?? 'active'
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!clientId) {
      toast.error('Selecione um cliente.')
      return
    }
    setSubmitting(true)

    const input = {
      name,
      description,
      clientId,
      catalogItemId: catalogItemId === NONE ? null : catalogItemId,
      value,
      currency,
      status,
    }

    const result = contract
      ? await updateContract(contract.id, input)
      : await createContract(input)

    setSubmitting(false)
    if (result.success) {
      toast.success(contract ? 'Contrato atualizado' : 'Contrato criado')
      router.push(`/contracts/${result.data.id}`)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 bg-surface-card rounded-xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="ct-name">Nome do contrato *</Label>
        <Input
          id="ct-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Manutenção mensal do site"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ct-desc">Descrição</Label>
        <Textarea
          id="ct-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Cliente *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Serviço do catálogo</Label>
          <Select value={catalogItemId} onValueChange={setCatalogItemId}>
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhum</SelectItem>
              {catalogItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ct-value">Valor</Label>
          <CurrencyInput
            id="ct-value"
            currencySymbol="R$"
            decimalSeparator=","
            thousandSeparator="."
            value={value ?? ''}
            onValueChange={(v) => setValue(v)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Moeda</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">BRL — Real</SelectItem>
              <SelectItem value="USD">USD — Dólar</SelectItem>
              <SelectItem value="EUR">EUR — Euro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) =>
              setStatus(v as 'active' | 'paused' | 'cancelled')
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={submitting} disabled={submitting}>
          {contract ? 'Salvar alterações' : 'Criar contrato'}
        </Button>
      </div>
    </form>
  )
}
