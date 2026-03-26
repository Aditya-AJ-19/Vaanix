import { db } from '../../core/db';
import {
    conversations,
    conversationMessages,
    eq,
    and,
    desc,
    asc,
    count,
} from '@vaanix/database';

// ===========================
// Types
// ===========================

export interface ConversationCreateData {
    organizationId: string;
    agentId: string;
    userId: string;
    channel?: string;
    metadata?: string | null;
}

export interface MessageCreateData {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokenCount?: number | null;
    latencyMs?: number | null;
}

// ===========================
// Repository
// ===========================

export const chatRepository = {
    // --- Conversations ---

    async createConversation(data: ConversationCreateData) {
        if (!db) throw new Error('Database not configured');
        const results = await db.insert(conversations).values({
            organizationId: data.organizationId,
            agentId: data.agentId,
            userId: data.userId,
            channel: data.channel ?? 'browser_test',
            status: 'active',
            metadata: data.metadata ?? null,
        }).returning();
        return results[0];
    },

    async getConversation(id: string, orgId: string) {
        if (!db) return null;
        const results = await db
            .select()
            .from(conversations)
            .where(and(eq(conversations.id, id), eq(conversations.organizationId, orgId)));
        return results[0] || null;
    },

    async listConversations(agentId: string, orgId: string, page = 1, pageSize = 20) {
        if (!db) return { data: [], total: 0 };

        const offset = (page - 1) * pageSize;
        const whereClause = and(
            eq(conversations.agentId, agentId),
            eq(conversations.organizationId, orgId),
        );

        const [data, totalResult] = await Promise.all([
            db
                .select()
                .from(conversations)
                .where(whereClause)
                .orderBy(desc(conversations.createdAt))
                .limit(pageSize)
                .offset(offset),
            db
                .select({ count: count() })
                .from(conversations)
                .where(whereClause),
        ]);

        return { data, total: totalResult[0]?.count ?? 0 };
    },

    async endConversation(id: string, orgId: string) {
        if (!db) throw new Error('Database not configured');
        const results = await db
            .update(conversations)
            .set({ status: 'ended' })
            .where(and(eq(conversations.id, id), eq(conversations.organizationId, orgId)))
            .returning();
        return results[0];
    },

    // --- Messages ---

    async addMessage(data: MessageCreateData) {
        if (!db) throw new Error('Database not configured');
        const results = await db.insert(conversationMessages).values({
            conversationId: data.conversationId,
            role: data.role,
            content: data.content,
            tokenCount: data.tokenCount ?? null,
            latencyMs: data.latencyMs ?? null,
        }).returning();
        return results[0];
    },

    async getMessages(conversationId: string) {
        if (!db) return [];
        return db
            .select()
            .from(conversationMessages)
            .where(eq(conversationMessages.conversationId, conversationId))
            .orderBy(asc(conversationMessages.createdAt));
    },

    async getMessageCount(conversationId: string) {
        if (!db) return 0;
        const result = await db
            .select({ count: count() })
            .from(conversationMessages)
            .where(eq(conversationMessages.conversationId, conversationId));
        return result[0]?.count ?? 0;
    },
};
