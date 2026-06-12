import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { serviceCatalog, type NewCatalogItem } from '@/db/schema'

export async function getCatalogItems(userId: string) {
  return db
    .select()
    .from(serviceCatalog)
    .where(eq(serviceCatalog.userId, userId))
    .orderBy(asc(serviceCatalog.name))
}

export async function getCatalogItemById(id: string, userId: string) {
  const [item] = await db
    .select()
    .from(serviceCatalog)
    .where(and(eq(serviceCatalog.id, id), eq(serviceCatalog.userId, userId)))
  return item
}

export async function createCatalogItem(data: NewCatalogItem) {
  const [item] = await db.insert(serviceCatalog).values(data).returning()
  return item
}

export async function updateCatalogItem(
  id: string,
  userId: string,
  data: Partial<NewCatalogItem>
) {
  const [item] = await db
    .update(serviceCatalog)
    .set(data)
    .where(and(eq(serviceCatalog.id, id), eq(serviceCatalog.userId, userId)))
    .returning()
  return item
}

export async function deleteCatalogItem(id: string, userId: string) {
  await db
    .delete(serviceCatalog)
    .where(and(eq(serviceCatalog.id, id), eq(serviceCatalog.userId, userId)))
}
