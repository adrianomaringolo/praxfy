import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { clients, contracts, type NewContract } from '@/db/schema'

export async function getContracts(userId: string) {
  return db
    .select({
      contract: contracts,
      clientName: clients.name,
    })
    .from(contracts)
    .leftJoin(clients, eq(contracts.clientId, clients.id))
    .where(eq(contracts.userId, userId))
    .orderBy(desc(contracts.createdAt))
}

export async function getContractsByClient(clientId: string, userId: string) {
  return db
    .select()
    .from(contracts)
    .where(and(eq(contracts.clientId, clientId), eq(contracts.userId, userId)))
    .orderBy(desc(contracts.createdAt))
}

export async function getContractById(id: string, userId: string) {
  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, id), eq(contracts.userId, userId)))
  return contract
}

/**
 * Busca para o portal público. Retorna undefined se o token não existir
 * ou estiver desativado.
 */
export async function getContractByToken(token: string) {
  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.publicToken, token))
  if (!contract) return undefined
  if (!contract.publicTokenActive) return undefined
  return contract
}

export async function createContract(data: NewContract) {
  const [contract] = await db.insert(contracts).values(data).returning()
  return contract
}

export async function updateContract(
  id: string,
  userId: string,
  data: Partial<NewContract>
) {
  const [contract] = await db
    .update(contracts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(contracts.id, id), eq(contracts.userId, userId)))
    .returning()
  return contract
}
