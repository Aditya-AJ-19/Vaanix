import { db } from '../../core/db';
import {
    knowledgeBases,
    knowledgeDocuments,
    agentKnowledgeBases,
    eq,
    and,
    desc,
    count,
    ilike,
} from '@vaanix/database';

// ===========================
// Types
// ===========================

export interface KnowledgeBaseCreateData {
    organizationId: string;
    name: string;
    description?: string | null;
}

export interface KnowledgeBaseUpdateData {
    name?: string;
    description?: string | null;
}

export interface DocumentCreateData {
    knowledgeBaseId: string;
    fileName: string;
    fileType: string;
    fileSize?: number | null;
    sourceUrl?: string | null;
    content?: string | null;
    status?: string;
}

export interface DocumentUpdateData {
    content?: string | null;
    status?: string;
    errorMessage?: string | null;
    chunkCount?: number;
}

export interface KnowledgeBaseListParams {
    orgId: string;
    page?: number;
    pageSize?: number;
    search?: string;
}

// ===========================
// Repository
// ===========================

export const knowledgeRepository = {
    // --- Knowledge Bases ---

    async findByOrgId(orgId: string) {
        if (!db) return [];
        return db
            .select()
            .from(knowledgeBases)
            .where(eq(knowledgeBases.organizationId, orgId))
            .orderBy(desc(knowledgeBases.updatedAt));
    },

    async findByOrgIdPaginated(params: KnowledgeBaseListParams) {
        if (!db) return { data: [], total: 0 };

        const { orgId, page = 1, pageSize = 20, search } = params;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(knowledgeBases.organizationId, orgId)];
        if (search) {
            conditions.push(ilike(knowledgeBases.name, `%${search}%`));
        }

        const whereClause = and(...conditions);

        const [data, totalResult] = await Promise.all([
            db
                .select()
                .from(knowledgeBases)
                .where(whereClause)
                .orderBy(desc(knowledgeBases.updatedAt))
                .limit(pageSize)
                .offset(offset),
            db
                .select({ count: count() })
                .from(knowledgeBases)
                .where(whereClause),
        ]);

        return { data, total: totalResult[0]?.count ?? 0 };
    },

    async findById(id: string, orgId: string) {
        if (!db) return null;
        const results = await db
            .select()
            .from(knowledgeBases)
            .where(and(eq(knowledgeBases.id, id), eq(knowledgeBases.organizationId, orgId)));
        return results[0] || null;
    },

    async createKnowledgeBase(data: KnowledgeBaseCreateData) {
        if (!db) throw new Error('Database not configured');
        const results = await db.insert(knowledgeBases).values({
            organizationId: data.organizationId,
            name: data.name,
            description: data.description ?? null,
        }).returning();
        return results[0];
    },

    async updateKnowledgeBase(id: string, orgId: string, data: KnowledgeBaseUpdateData) {
        if (!db) throw new Error('Database not configured');
        const results = await db
            .update(knowledgeBases)
            .set(data)
            .where(and(eq(knowledgeBases.id, id), eq(knowledgeBases.organizationId, orgId)))
            .returning();
        return results[0];
    },

    async removeKnowledgeBase(id: string, orgId: string) {
        if (!db) throw new Error('Database not configured');
        await db.delete(knowledgeBases).where(
            and(eq(knowledgeBases.id, id), eq(knowledgeBases.organizationId, orgId)),
        );
    },

    // --- Documents ---

    async findDocumentsByKbId(knowledgeBaseId: string) {
        if (!db) return [];
        return db
            .select()
            .from(knowledgeDocuments)
            .where(eq(knowledgeDocuments.knowledgeBaseId, knowledgeBaseId))
            .orderBy(desc(knowledgeDocuments.createdAt));
    },

    async findDocumentById(id: string) {
        if (!db) return null;
        const results = await db
            .select()
            .from(knowledgeDocuments)
            .where(eq(knowledgeDocuments.id, id));
        return results[0] || null;
    },

    async createDocument(data: DocumentCreateData) {
        if (!db) throw new Error('Database not configured');
        const results = await db.insert(knowledgeDocuments).values({
            knowledgeBaseId: data.knowledgeBaseId,
            fileName: data.fileName,
            fileType: data.fileType,
            fileSize: data.fileSize ?? null,
            sourceUrl: data.sourceUrl ?? null,
            content: data.content ?? null,
            status: data.status ?? 'pending',
        }).returning();
        return results[0];
    },

    async updateDocument(id: string, data: DocumentUpdateData) {
        if (!db) throw new Error('Database not configured');
        const results = await db
            .update(knowledgeDocuments)
            .set(data)
            .where(eq(knowledgeDocuments.id, id))
            .returning();
        return results[0];
    },

    async removeDocument(id: string) {
        if (!db) throw new Error('Database not configured');
        await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
    },

    // --- Agent ↔ KB Linking ---

    async linkAgentToKb(agentId: string, knowledgeBaseId: string) {
        if (!db) throw new Error('Database not configured');
        const results = await db.insert(agentKnowledgeBases).values({
            agentId,
            knowledgeBaseId,
        }).returning();
        return results[0];
    },

    async unlinkAgentFromKb(agentId: string, knowledgeBaseId: string) {
        if (!db) throw new Error('Database not configured');
        await db.delete(agentKnowledgeBases).where(
            and(
                eq(agentKnowledgeBases.agentId, agentId),
                eq(agentKnowledgeBases.knowledgeBaseId, knowledgeBaseId),
            ),
        );
    },

    async findKbsByAgentId(agentId: string) {
        if (!db) return [];
        return db
            .select({
                id: knowledgeBases.id,
                name: knowledgeBases.name,
                description: knowledgeBases.description,
                organizationId: knowledgeBases.organizationId,
                createdAt: knowledgeBases.createdAt,
                updatedAt: knowledgeBases.updatedAt,
            })
            .from(agentKnowledgeBases)
            .innerJoin(knowledgeBases, eq(agentKnowledgeBases.knowledgeBaseId, knowledgeBases.id))
            .where(eq(agentKnowledgeBases.agentId, agentId));
    },

    async findAgentsByKbId(knowledgeBaseId: string) {
        if (!db) return [];
        return db
            .select({
                agentId: agentKnowledgeBases.agentId,
            })
            .from(agentKnowledgeBases)
            .where(eq(agentKnowledgeBases.knowledgeBaseId, knowledgeBaseId));
    },
};
