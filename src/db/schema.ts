import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  numeric,
  integer,
} from 'drizzle-orm/pg-core'

// ── Enums ────────────────────────────────────────────────────────────────────

export const contractStatusEnum = pgEnum('contract_status', [
  'active',
  'paused',
  'cancelled',
])

export const frequencyTypeEnum = pgEnum('frequency_type', [
  'days',
  'weeks',
  'months',
  'years',
])

export const occurrenceStatusEnum = pgEnum('occurrence_status', [
  'pending',
  'done',
  'skipped',
])

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
])

// ── Tabelas ──────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clerkId: text('clerk_id').unique().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const clients = pgTable('clients', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  notes: text('notes'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const pipelines = pgTable('pipelines', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const pipelineStages = pgTable('pipeline_stages', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pipelineId: uuid('pipeline_id')
    .notNull()
    .references(() => pipelines.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(), // hex, ex: "#3b82f6"
  order: integer('order').notNull(),
})

export const serviceCatalog = pgTable('service_catalog', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }),
  currency: text('currency').default('BRL'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  pipelineId: uuid('pipeline_id')
    .notNull()
    .references(() => pipelines.id),
  currentStageId: uuid('current_stage_id')
    .notNull()
    .references(() => pipelineStages.id),
  catalogItemId: uuid('catalog_item_id').references(() => serviceCatalog.id),
  name: text('name').notNull(),
  description: text('description'),
  value: numeric('value', { precision: 10, scale: 2 }),
  currency: text('currency').default('BRL'),
  startDate: date('start_date'),
  dueDate: date('due_date'),
  publicToken: text('public_token').unique().notNull(), // nanoid(16)
  publicTokenActive: boolean('public_token_active').default(true),
  publicTokenExpiresAt: timestamp('public_token_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const projectLogs = pgTable('project_logs', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  stageId: uuid('stage_id').references(() => pipelineStages.id),
  content: text('content').notNull(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const projectLinks = pgTable('project_links', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  label: text('label').notNull(), // ex: "Repositório", "Staging", "Figma"
  url: text('url').notNull(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const projectDocuments = pgTable('project_documents', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  storagePath: text('storage_path').notNull(), // ex: "documents/{projectId}/{timestamp}-{filename}"
  publicUrl: text('public_url').notNull(),
  mimeType: text('mime_type').notNull(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const contracts = pgTable('contracts', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  catalogItemId: uuid('catalog_item_id').references(() => serviceCatalog.id),
  name: text('name').notNull(),
  description: text('description'),
  value: numeric('value', { precision: 10, scale: 2 }),
  currency: text('currency').default('BRL'),
  status: contractStatusEnum('status').default('active'),
  publicToken: text('public_token').unique().notNull(), // nanoid(16)
  publicTokenActive: boolean('public_token_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const recurrences = pgTable('recurrences', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id),
  contractId: uuid('contract_id').references(() => contracts.id),
  name: text('name').notNull(),
  description: text('description'),
  frequencyType: frequencyTypeEnum('frequency_type').notNull(),
  frequencyValue: integer('frequency_value').notNull(),
  startDate: date('start_date').notNull(),
  nextOccurrenceAt: date('next_occurrence_at').notNull(),
  status: contractStatusEnum('status').default('active'),
  notifyEmails: text('notify_emails').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
})

export const recurrenceOccurrences = pgTable('recurrence_occurrences', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  recurrenceId: uuid('recurrence_id')
    .notNull()
    .references(() => recurrences.id, { onDelete: 'cascade' }),
  scheduledAt: date('scheduled_at').notNull(),
  executedAt: timestamp('executed_at'),
  status: occurrenceStatusEnum('status').default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  planId: text('plan_id').notNull().default('free'),
  status: subscriptionStatusEnum('status').default('active'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ── Tipos inferidos ──────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type Client = typeof clients.$inferSelect
export type Pipeline = typeof pipelines.$inferSelect
export type PipelineStage = typeof pipelineStages.$inferSelect
export type CatalogItem = typeof serviceCatalog.$inferSelect
export type Project = typeof projects.$inferSelect
export type ProjectLog = typeof projectLogs.$inferSelect
export type ProjectLink = typeof projectLinks.$inferSelect
export type ProjectDocument = typeof projectDocuments.$inferSelect
export type Contract = typeof contracts.$inferSelect
export type Recurrence = typeof recurrences.$inferSelect
export type RecurrenceOccurrence = typeof recurrenceOccurrences.$inferSelect
export type Subscription = typeof subscriptions.$inferSelect

export type NewClient = typeof clients.$inferInsert
export type NewPipeline = typeof pipelines.$inferInsert
export type NewPipelineStage = typeof pipelineStages.$inferInsert
export type NewCatalogItem = typeof serviceCatalog.$inferInsert
export type NewProject = typeof projects.$inferInsert
export type NewProjectLog = typeof projectLogs.$inferInsert
export type NewProjectLink = typeof projectLinks.$inferInsert
export type NewProjectDocument = typeof projectDocuments.$inferInsert
export type NewContract = typeof contracts.$inferInsert
export type NewRecurrence = typeof recurrences.$inferInsert
export type NewRecurrenceOccurrence = typeof recurrenceOccurrences.$inferInsert
