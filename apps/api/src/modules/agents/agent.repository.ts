import { db } from '../../core/db';
import { agents, eq, and, ilike, desc, asc, count, sql } from '@vaanix/database';

export interface AgentCreateData {
    organizationId: string;
    createdBy: string;
    name: string;
    description?: string | null;
    systemPrompt?: string | null;
    personality?: string | null;
    greeting?: string | null;
    fallbackMessage?: string | null;
    language?: string;
    voiceId?: string | null;
    modelProvider?: string | null;
    modelId?: string | null;
    temperature?: number;
    maxTokens?: number;
    tags?: string | null;
    workflowData?: string | null;
}

export interface AgentUpdateData {
    name?: string;
    description?: string | null;
    systemPrompt?: string | null;
    personality?: string | null;
    greeting?: string | null;
    fallbackMessage?: string | null;
    language?: string;
    voiceId?: string | null;
    modelProvider?: string | null;
    modelId?: string | null;
    temperature?: number;
    maxTokens?: number;
    tags?: string | null;
    workflowData?: string | null;
    status?: string;
    isPublished?: boolean;
    version?: string;
}

export interface AgentListParams {
    orgId: string;
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

export const agentRepository = {
    async findByOrgId(orgId: string) {
        if (!db) return [];
        return db
            .select()
            .from(agents)
            .where(eq(agents.organizationId, orgId))
            .orderBy(desc(agents.updatedAt));
    },

    async findByOrgIdPaginated(params: AgentListParams) {
        if (!db) return { data: [], total: 0 };

        const { orgId, page = 1, pageSize = 20, search, status, sortBy = 'updatedAt', sortOrder = 'desc' } = params;
        const offset = (page - 1) * pageSize;

        // Build WHERE conditions
        const conditions = [eq(agents.organizationId, orgId)];
        if (search) {
            conditions.push(ilike(agents.name, `%${search}%`));
        }
        if (status && status !== 'all') {
            conditions.push(eq(agents.status, status));
        }

        const whereClause = and(...conditions);

        // Sort
        const sortColumn = sortBy === 'name' ? agents.name : sortBy === 'createdAt' ? agents.createdAt : agents.updatedAt;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, totalResult] = await Promise.all([
            db
                .select()
                .from(agents)
                .where(whereClause)
                .orderBy(orderFn(sortColumn))
                .limit(pageSize)
                .offset(offset),
            db
                .select({ count: count() })
                .from(agents)
                .where(whereClause),
        ]);

        return { data, total: totalResult[0]?.count ?? 0 };
    },

    async findById(id: string, orgId: string) {
        if (!db) return null;
        const results = await db
            .select()
            .from(agents)
            .where(and(eq(agents.id, id), eq(agents.organizationId, orgId)));
        return results[0] || null;
    },

    async create(data: AgentCreateData) {
        if (!db) throw new Error('Database not configured');
        const results = await db.insert(agents).values({
            organizationId: data.organizationId,
            createdBy: data.createdBy,
            name: data.name,
            description: data.description ?? null,
            systemPrompt: data.systemPrompt ?? null,
            personality: data.personality ?? null,
            greeting: data.greeting ?? null,
            fallbackMessage: data.fallbackMessage ?? null,
            language: data.language ?? 'en',
            voiceId: data.voiceId ?? null,
            modelProvider: data.modelProvider ?? null,
            modelId: data.modelId ?? null,
            temperature: data.temperature ?? 0.7,
            maxTokens: data.maxTokens ?? 1024,
            tags: data.tags ?? null,
            workflowData: data.workflowData ?? null,
        }).returning();
        return results[0];
    },

    async update(id: string, orgId: string, data: AgentUpdateData) {
        if (!db) throw new Error('Database not configured');
        const results = await db
            .update(agents)
            .set(data)
            .where(and(eq(agents.id, id), eq(agents.organizationId, orgId)))
            .returning();
        return results[0];
    },

    async duplicate(id: string, orgId: string, newName: string, userId: string) {
        if (!db) throw new Error('Database not configured');
        const original = await this.findById(id, orgId);
        if (!original) return null;

        const results = await db.insert(agents).values({
            organizationId: orgId,
            createdBy: userId,
            name: newName,
            description: original.description,
            systemPrompt: original.systemPrompt,
            personality: original.personality,
            greeting: original.greeting,
            fallbackMessage: original.fallbackMessage,
            language: original.language,
            voiceId: original.voiceId,
            modelProvider: original.modelProvider,
            modelId: original.modelId,
            temperature: original.temperature,
            maxTokens: original.maxTokens,
            tags: original.tags,
            workflowData: original.workflowData,
            status: 'draft',
            isPublished: false,
            version: '1.0.0',
        }).returning();
        return results[0];
    },

    async remove(id: string, orgId: string) {
        if (!db) throw new Error('Database not configured');
        await db.delete(agents).where(and(eq(agents.id, id), eq(agents.organizationId, orgId)));
    },
};
