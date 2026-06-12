'use server'

import { currentUser } from '@clerk/nextjs/server'
import { getOrCreateUser } from '@/db/queries/users'

/**
 * Garante que o usuário autenticado no Clerk existe na tabela `users`.
 * Idempotente — chamado no layout autenticado a cada request.
 */
export async function syncUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.username ||
    'Usuário'
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''

  return getOrCreateUser(clerkUser.id, name, email)
}
