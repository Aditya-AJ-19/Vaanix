import { z } from 'zod';
import { agentRepository } from './agent.repository';
import type { AgentCreateData, AgentUpdateData, AgentListParams } from './agent.repository';
import { AppError } from '../../core/error.middleware';

// ===========================
// Validation Schemas
// ===========================

export const createAgentSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional().nullable(),
    systemPrompt: z.string().max(10000).optional().nullable(),
    personality: z.string().max(5000).optional().nullable(),
    greeting: z.string().max(1000).optional().nullable(),
    fallbackMessage: z.string().max(1000).optional().nullable(),
    language: z.string().max(10).default('en'),
    voiceId: z.string().max(255).optional().nullable(),
    modelProvider: z.string().max(50).optional().nullable(),
    modelId: z.string().max(100).optional().nullable(),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().int().min(1).max(16384).default(1024),
    tags: z.string().optional().nullable(), // JSON array string
    workflowData: z.string().optional().nullable(), // JSON string
});

export const updateAgentSchema = createAgentSchema.partial().extend({
    status: z.enum(['draft', 'published', 'archived']).optional(),
    isPublished: z.boolean().optional(),
    version: z.string().max(50).optional(),
});

export const listAgentsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    status: z.enum(['all', 'draft', 'published', 'archived']).default('all'),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ===========================
// Agent Service
// ===========================

export const agentService = {
    async listByOrg(orgId: string) {
        return agentRepository.findByOrgId(orgId);
    },

    async listByOrgPaginated(params: AgentListParams) {
        return agentRepository.findByOrgIdPaginated(params);
    },

    async getById(id: string, orgId: string) {
        const agent = await agentRepository.findById(id, orgId);
        if (!agent) {
            throw new AppError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        return agent;
    },

    async create(orgId: string, userId: string, data: z.infer<typeof createAgentSchema>) {
        const validated = createAgentSchema.parse(data);
        return agentRepository.create({
            organizationId: orgId,
            createdBy: userId,
            ...validated,
        });
    },

    async update(id: string, orgId: string, data: z.infer<typeof updateAgentSchema>) {
        const existing = await agentRepository.findById(id, orgId);
        if (!existing) {
            throw new AppError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        const validated = updateAgentSchema.parse(data);
        return agentRepository.update(id, orgId, validated);
    },

    async duplicate(id: string, orgId: string, userId: string) {
        const existing = await agentRepository.findById(id, orgId);
        if (!existing) {
            throw new AppError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        const newName = `${existing.name} (copy)`;
        return agentRepository.duplicate(id, orgId, newName, userId);
    },

    async publish(id: string, orgId: string) {
        const existing = await agentRepository.findById(id, orgId);
        if (!existing) {
            throw new AppError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        if (existing.status === 'published') {
            throw new AppError(400, 'ALREADY_PUBLISHED', 'Agent is already published');
        }
        return agentRepository.update(id, orgId, {
            status: 'published',
            isPublished: true,
        });
    },

    async archive(id: string, orgId: string) {
        const existing = await agentRepository.findById(id, orgId);
        if (!existing) {
            throw new AppError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        return agentRepository.update(id, orgId, {
            status: 'archived',
            isPublished: false,
        });
    },

    async remove(id: string, orgId: string) {
        const existing = await agentRepository.findById(id, orgId);
        if (!existing) {
            throw new AppError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        return agentRepository.remove(id, orgId);
    },
};
