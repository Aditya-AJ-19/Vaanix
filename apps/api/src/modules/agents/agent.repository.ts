import { db } from '../../core/db';
import { agents, eq, and } from '@vaanix/database';

export const agentRepository = {
    async findByOrgId(orgId: string) {
        if (!db) return [];
        return db.select().from(agents).where(eq(agents.organizationId, orgId));
    },

    async findById(id: string, orgId: string) {
        if (!db) return null;
        const results = await db
            .select()
            .from(agents)
            .where(and(eq(agents.id, id), eq(agents.organizationId, orgId)));
        return results[0] || null;
    },

    async create(data: {
        organizationId: string;
        createdBy: string;
        name: string;
        description: string | null;
    }) {
        if (!db) throw new Error('Database not configured');
        const results = await db.insert(agents).values(data).returning();
        return results[0];
    },

    async update(id: string, orgId: string, data: Partial<{ name: string; description: string }>) {
        if (!db) throw new Error('Database not configured');
        const results = await db
            .update(agents)
            .set(data)
            .where(and(eq(agents.id, id), eq(agents.organizationId, orgId)))
            .returning();
        return results[0];
    },

    async remove(id: string, orgId: string) {
        if (!db) throw new Error('Database not configured');
        await db.delete(agents).where(and(eq(agents.id, id), eq(agents.organizationId, orgId)));
    },
};
