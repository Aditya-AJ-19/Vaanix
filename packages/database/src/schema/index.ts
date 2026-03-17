import { pgTable, uuid, varchar, timestamp, text, boolean, integer, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===========================
// Organizations (Tenants)
// ===========================
export const organizations = pgTable('organizations', {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkOrgId: varchar('clerk_org_id', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    plan: varchar('plan', { length: 50 }).notNull().default('free'),
    isActive: boolean('is_active').notNull().default(true),
    metadata: text('metadata'), // JSON string for extensible data
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// ===========================
// Users
// ===========================
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// ===========================
// Organization Members (join table)
// ===========================
export const organizationMembers = pgTable('organization_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 50 }).notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// ===========================
// Agents (tenant-scoped)
// ===========================
export const agents = pgTable('agents', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull().default('draft'), // draft | published | archived
    // --- Personality & Prompt ---
    systemPrompt: text('system_prompt'),
    personality: text('personality'), // JSON: tone, style
    greeting: text('greeting'),
    fallbackMessage: text('fallback_message'),
    // --- Voice & Language ---
    language: varchar('language', { length: 10 }).notNull().default('en'), // en, hi, ta, te, etc.
    voiceId: varchar('voice_id', { length: 255 }),
    // --- LLM Configuration ---
    modelProvider: varchar('model_provider', { length: 50 }), // openai | google | azure (null = use .env default)
    modelId: varchar('model_id', { length: 100 }), // gpt-4o-mini, gemini-2.0-flash, etc.
    temperature: real('temperature').default(0.7),
    maxTokens: integer('max_tokens').default(1024),
    // --- Response Style ---
    responseStyle: varchar('response_style', { length: 50 }).default('conversational'), // concise | detailed | conversational
    responseFormat: varchar('response_format', { length: 50 }).default('text'), // text | structured | bullet_points
    customInstructions: text('custom_instructions'), // additional instructions for response behavior
    // --- Workflow ---
    workflowData: text('workflow_data'), // JSON: React Flow serialization
    // --- Metadata ---
    version: varchar('version', { length: 50 }).notNull().default('1.0.0'),
    isPublished: boolean('is_published').notNull().default(false),
    tags: text('tags'), // JSON array for tagging/filtering
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// ===========================
// Agent Templates
// ===========================
export const agentTemplates = pgTable('agent_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull().default('general'), // general, sales, support, booking
    icon: varchar('icon', { length: 50 }), // lucide icon name
    templateData: text('template_data').notNull(), // JSON: pre-filled agent config
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// ===========================
// Knowledge Bases (tenant-scoped)
// ===========================
export const knowledgeBases = pgTable('knowledge_bases', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// ===========================
// Knowledge Documents
// ===========================
export const knowledgeDocuments = pgTable('knowledge_documents', {
    id: uuid('id').defaultRandom().primaryKey(),
    knowledgeBaseId: uuid('knowledge_base_id')
        .notNull()
        .references(() => knowledgeBases.id, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 500 }).notNull(),
    fileType: varchar('file_type', { length: 50 }).notNull(), // pdf, txt, csv, url, manual, faq, gsheet
    fileSize: integer('file_size'), // bytes
    sourceUrl: text('source_url'), // for URL-scraped content
    content: text('content'), // extracted text content
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending | processing | ready | failed
    errorMessage: text('error_message'),
    chunkCount: integer('chunk_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// ===========================
// Agent ↔ Knowledge Base (many-to-many)
// ===========================
export const agentKnowledgeBases = pgTable('agent_knowledge_bases', {
    id: uuid('id').defaultRandom().primaryKey(),
    agentId: uuid('agent_id')
        .notNull()
        .references(() => agents.id, { onDelete: 'cascade' }),
    knowledgeBaseId: uuid('knowledge_base_id')
        .notNull()
        .references(() => knowledgeBases.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===========================
// Knowledge Chunks (for vector embeddings)
// ===========================
export const knowledgeChunks = pgTable('knowledge_chunks', {
    id: varchar('id', { length: 500 }).primaryKey(), // format: {documentId}_chunk_{index}
    documentId: uuid('document_id')
        .notNull()
        .references(() => knowledgeDocuments.id, { onDelete: 'cascade' }),
    knowledgeBaseId: uuid('knowledge_base_id')
        .notNull()
        .references(() => knowledgeBases.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: text('embedding'), // JSON-encoded vector (MVP). Upgrade to VECTOR(1536) with pgvector extension.
    chunkIndex: integer('chunk_index').notNull().default(0),
    metadata: text('metadata'), // JSON string for extensible metadata
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// ===========================
// Relations
// ===========================
export const organizationsRelations = relations(organizations, ({ many }) => ({
    members: many(organizationMembers),
    agents: many(agents),
    knowledgeBases: many(knowledgeBases),
}));

export const usersRelations = relations(users, ({ many }) => ({
    memberships: many(organizationMembers),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
    organization: one(organizations, {
        fields: [organizationMembers.organizationId],
        references: [organizations.id],
    }),
    user: one(users, {
        fields: [organizationMembers.userId],
        references: [users.id],
    }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [agents.organizationId],
        references: [organizations.id],
    }),
    creator: one(users, {
        fields: [agents.createdBy],
        references: [users.id],
    }),
    knowledgeBases: many(agentKnowledgeBases),
}));

export const knowledgeBasesRelations = relations(knowledgeBases, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [knowledgeBases.organizationId],
        references: [organizations.id],
    }),
    documents: many(knowledgeDocuments),
    agents: many(agentKnowledgeBases),
}));

export const knowledgeDocumentsRelations = relations(knowledgeDocuments, ({ one }) => ({
    knowledgeBase: one(knowledgeBases, {
        fields: [knowledgeDocuments.knowledgeBaseId],
        references: [knowledgeBases.id],
    }),
}));

export const agentKnowledgeBasesRelations = relations(agentKnowledgeBases, ({ one }) => ({
    agent: one(agents, {
        fields: [agentKnowledgeBases.agentId],
        references: [agents.id],
    }),
    knowledgeBase: one(knowledgeBases, {
        fields: [agentKnowledgeBases.knowledgeBaseId],
        references: [knowledgeBases.id],
    }),
}));
