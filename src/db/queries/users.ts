import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

export async function getOrCreateUser(
  clerkId: string,
  name: string,
  email: string
) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
  if (existing) return existing

  const [created] = await db
    .insert(users)
    .values({ clerkId, name, email })
    .onConflictDoNothing({ target: users.clerkId })
    .returning()
  if (created) return created

  // Corrida: outro request inseriu entre o select e o insert
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
  return user
}

export async function getUserByClerkId(clerkId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
  return user
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id))
  return user
}
