import { agentRepository } from './agent.repository';
import { AppError } from '../../core/error.middleware';

export const agentService = {
    async listByOrg(orgId: string) {
        return agentRepository.findByOrgId(orgId);
    },

    async getById(id: string, orgId: string) {
        const agent = await agentRepository.findById(id, orgId);
        if (!agent) {
            throw new AppError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        return agent;
    },

    async create(orgId: string, userId: string, data: { name: string; description?: string }) {
        return agentRepository.create({
            organizationId: orgId,
            createdBy: userId,
            name: data.name,
            description: data.description || null,
        });
    },

    async update(id: string, orgId: string, data: Partial<{ name: string; description: string }>) {
        const existing = await agentRepository.findById(id, orgId);
        if (!existing) {
            throw new AppError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        return agentRepository.update(id, orgId, data);
    },

    async remove(id: string, orgId: string) {
        const existing = await agentRepository.findById(id, orgId);
        if (!existing) {
            throw new AppError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        return agentRepository.remove(id, orgId);
    },
};
