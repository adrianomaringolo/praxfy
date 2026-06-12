import { and, eq, desc } from 'drizzle-orm'
import { db } from '@/db'
import { clients, type NewClient } from '@/db/schema'

export async function getClients(userId: string) {
  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.createdAt))
}

export async function getClientById(id: string, userId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
  return client
}

export async function createClient(data: NewClient) {
  const [client] = await db.insert(clients).values(data).returning()
  return client
}

export async function updateClient(
  id: string,
  userId: string,
  data: Partial<NewClient>
) {
  const [client] = await db
    .update(clients)
    .set(data)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .returning()
  return client
}

export async function deleteClient(id: string, userId: string) {
  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
}
