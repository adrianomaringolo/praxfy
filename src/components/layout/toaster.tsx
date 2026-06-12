'use client'

// buildgrid-ui não traz o banner "use client" no bundle — este wrapper
// permite usar o Toaster a partir de Server Components (layout raiz).
export { Toaster } from 'buildgrid-ui'
