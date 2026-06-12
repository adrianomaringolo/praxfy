'use client'

import { useState } from 'react'
import { Button } from 'buildgrid-ui'
import { Pencil } from 'lucide-react'
import { ClientForm } from './client-form'
import type { Client } from '@/db/schema'

export function ClientDetailActions({ client }: { client: Client }) {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setFormOpen(true)}>
        <Pencil size={16} className="mr-2" />
        Editar
      </Button>
      <ClientForm client={client} open={formOpen} onOpenChange={setFormOpen} />
    </>
  )
}
