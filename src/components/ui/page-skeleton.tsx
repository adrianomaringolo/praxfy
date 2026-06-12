'use client'

import { Skeleton } from 'buildgrid-ui'

/** Skeleton padrão de página para loading.tsx (GUIDE seção 9) */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
