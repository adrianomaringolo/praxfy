'use client'

import { useRouter } from 'next/navigation'
import { Button, Input, Label, Switch, toast } from 'buildgrid-ui'
import { Copy, ExternalLink } from 'lucide-react'
import { toggleContractToken } from '@/actions/contracts'
import type { Contract } from '@/db/schema'

export function ContractPortalCard({ contract }: { contract: Contract }) {
  const router = useRouter()
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/p/${contract.publicToken}`

  async function handleCopy() {
    await navigator.clipboard.writeText(portalUrl)
    toast.success('URL copiada')
  }

  async function handleToggle(active: boolean) {
    const result = await toggleContractToken(contract.id, active)
    if (result.success) {
      toast.success(active ? 'Portal ativado' : 'Portal desativado')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <h2 className="text-lg font-display font-semibold text-text-primary">
        Portal do cliente
      </h2>
      <div className="flex flex-col gap-2">
        <Label>URL pública</Label>
        <div className="flex gap-2">
          <Input
            value={portalUrl}
            readOnly
            className="flex-1 font-mono text-xs"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            aria-label="Copiar URL"
          >
            <Copy size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Abrir portal"
            onClick={() => window.open(portalUrl, '_blank')}
          >
            <ExternalLink size={16} />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Portal ativo</p>
        <Switch
          checked={contract.publicTokenActive ?? false}
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  )
}
