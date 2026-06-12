import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/db/queries/users'

/**
 * Retorna o usuário do banco correspondente à sessão Clerk atual,
 * ou null se não autenticado / ainda não sincronizado.
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  return (await getUserByClerkId(clerkId)) ?? null
}
