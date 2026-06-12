import { and, asc, count, eq } from 'drizzle-orm'
import { db } from '@/db'
import { contracts, projects, serviceCatalog, type NewCatalogItem } from '@/db/schema'

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

export async function countCatalogItemUsage(catalogItemId: string) {
  const [{ value: projectCount }] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.catalogItemId, catalogItemId))
  const [{ value: contractCount }] = await db
    .select({ value: count() })
    .from(contracts)
    .where(eq(contracts.catalogItemId, catalogItemId))
  return projectCount + contractCount
}
