'use client'

import { Button } from 'buildgrid-ui'
import { AlertCircle } from 'lucide-react'

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <AlertCircle size={40} className="text-danger" />
      <div>
        <h2 className="text-lg font-display font-semibold text-text-primary">
          Algo deu errado
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Ocorreu um erro inesperado. Tente novamente em instantes.
        </p>
      </div>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
