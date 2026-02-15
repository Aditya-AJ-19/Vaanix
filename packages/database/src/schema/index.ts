import { pgTable, uuid, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
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
    status: varchar('status', { length: 50 }).notNull().default('draft'),
    personality: text('personality'), // JSON: tone, style, language
    greeting: text('greeting'),
    fallbackMessage: text('fallback_message'),
    workflowData: text('workflow_data'), // JSON: React Flow serialization
    version: varchar('version', { length: 50 }).notNull().default('1.0.0'),
    isPublished: boolean('is_published').notNull().default(false),
    createdBy: uuid('created_by').references(() => users.id),
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

export const agentsRelations = relations(agents, ({ one }) => ({
    organization: one(organizations, {
        fields: [agents.organizationId],
        references: [organizations.id],
    }),
    creator: one(users, {
        fields: [agents.createdBy],
        references: [users.id],
    }),
}));
