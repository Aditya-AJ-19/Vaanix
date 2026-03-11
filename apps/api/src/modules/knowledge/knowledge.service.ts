import { z } from 'zod';
import { knowledgeRepository } from './knowledge.repository';
import { scrapeUrl } from './scraper.service';
import { importGoogleSheet } from './gsheet.service';
import type { KnowledgeBaseListParams } from './knowledge.repository';
import { AppError } from '../../core/error.middleware';

// ===========================
// Validation Schemas
// ===========================

export const createKnowledgeBaseSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional().nullable(),
});

export const updateKnowledgeBaseSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
});

export const listKnowledgeBasesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
});

export const uploadDocumentSchema = z.object({
    fileName: z.string().min(1, 'File name is required').max(500),
    fileType: z.enum(['pdf', 'txt', 'csv', 'url', 'manual', 'faq', 'gsheet']),
    fileSize: z.number().int().min(0).optional().nullable(),
    sourceUrl: z.string().url().optional().nullable(),
    content: z.string().optional().nullable(),
});

export const linkAgentSchema = z.object({
    agentId: z.string().uuid('Invalid agent ID'),
});

// ===========================
// Knowledge Service
// ===========================

export const knowledgeService = {
    // --- Knowledge Bases ---

    async listByOrg(orgId: string) {
        return knowledgeRepository.findByOrgId(orgId);
    },

    async listByOrgPaginated(params: KnowledgeBaseListParams) {
        return knowledgeRepository.findByOrgIdPaginated(params);
    },

    async getById(id: string, orgId: string) {
        const kb = await knowledgeRepository.findById(id, orgId);
        if (!kb) {
            throw new AppError(404, 'KB_NOT_FOUND', 'Knowledge base not found');
        }
        return kb;
    },

    async create(orgId: string, data: z.infer<typeof createKnowledgeBaseSchema>) {
        const validated = createKnowledgeBaseSchema.parse(data);
        return knowledgeRepository.createKnowledgeBase({
            organizationId: orgId,
            ...validated,
        });
    },

    async update(id: string, orgId: string, data: z.infer<typeof updateKnowledgeBaseSchema>) {
        const existing = await knowledgeRepository.findById(id, orgId);
        if (!existing) {
            throw new AppError(404, 'KB_NOT_FOUND', 'Knowledge base not found');
        }
        const validated = updateKnowledgeBaseSchema.parse(data);
        return knowledgeRepository.updateKnowledgeBase(id, orgId, validated);
    },

    async remove(id: string, orgId: string) {
        const existing = await knowledgeRepository.findById(id, orgId);
        if (!existing) {
            throw new AppError(404, 'KB_NOT_FOUND', 'Knowledge base not found');
        }
        return knowledgeRepository.removeKnowledgeBase(id, orgId);
    },

    // --- Documents ---

    async listDocuments(kbId: string, orgId: string) {
        // Verify KB belongs to org
        const kb = await knowledgeRepository.findById(kbId, orgId);
        if (!kb) {
            throw new AppError(404, 'KB_NOT_FOUND', 'Knowledge base not found');
        }
        return knowledgeRepository.findDocumentsByKbId(kbId);
    },

    async uploadDocument(kbId: string, orgId: string, data: z.infer<typeof uploadDocumentSchema>) {
        // Verify KB belongs to org
        const kb = await knowledgeRepository.findById(kbId, orgId);
        if (!kb) {
            throw new AppError(404, 'KB_NOT_FOUND', 'Knowledge base not found');
        }

        const validated = uploadDocumentSchema.parse(data);

        let content = validated.content ?? null;
        let status = content ? 'ready' : 'pending';
        let errorMessage: string | null = null;

        // --- Auto-scrape URL content ---
        if (validated.fileType === 'url' && validated.sourceUrl && !content) {
            try {
                const scraped = await scrapeUrl(validated.sourceUrl);
                content = `# ${scraped.title}\n\n${scraped.description ? scraped.description + '\n\n' : ''}${scraped.content}`;
                status = 'ready';
            } catch (err: any) {
                status = 'failed';
                errorMessage = err.message ?? 'Failed to scrape URL';
            }
        }

        // --- Import Google Sheet ---
        if (validated.fileType === 'gsheet' && validated.sourceUrl && !content) {
            try {
                const sheet = await importGoogleSheet(validated.sourceUrl);
                content = `# Google Sheet Import (${sheet.rowCount} rows)\n\n${sheet.content}`;
                status = 'ready';
            } catch (err: any) {
                status = 'failed';
                errorMessage = err.message ?? 'Failed to import Google Sheet';
            }
        }

        // Create the document record
        const doc = await knowledgeRepository.createDocument({
            knowledgeBaseId: kbId,
            fileName: validated.fileName,
            fileType: validated.fileType,
            fileSize: validated.fileSize ?? null,
            sourceUrl: validated.sourceUrl ?? null,
            content,
            status,
        });

        // If scraping/import failed, update error message
        if (errorMessage) {
            await knowledgeRepository.updateDocument(doc.id, { errorMessage });
        }

        return doc;
    },

    async removeDocument(docId: string, kbId: string, orgId: string) {
        // Verify KB belongs to org
        const kb = await knowledgeRepository.findById(kbId, orgId);
        if (!kb) {
            throw new AppError(404, 'KB_NOT_FOUND', 'Knowledge base not found');
        }

        const doc = await knowledgeRepository.findDocumentById(docId);
        if (!doc || doc.knowledgeBaseId !== kbId) {
            throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
        }

        return knowledgeRepository.removeDocument(docId);
    },

    // --- Agent ↔ KB Linking ---

    async linkAgent(kbId: string, orgId: string, agentId: string) {
        const kb = await knowledgeRepository.findById(kbId, orgId);
        if (!kb) {
            throw new AppError(404, 'KB_NOT_FOUND', 'Knowledge base not found');
        }

        return knowledgeRepository.linkAgentToKb(agentId, kbId);
    },

    async unlinkAgent(kbId: string, orgId: string, agentId: string) {
        const kb = await knowledgeRepository.findById(kbId, orgId);
        if (!kb) {
            throw new AppError(404, 'KB_NOT_FOUND', 'Knowledge base not found');
        }

        return knowledgeRepository.unlinkAgentFromKb(agentId, kbId);
    },

    async getLinkedAgents(kbId: string, orgId: string) {
        const kb = await knowledgeRepository.findById(kbId, orgId);
        if (!kb) {
            throw new AppError(404, 'KB_NOT_FOUND', 'Knowledge base not found');
        }
        return knowledgeRepository.findAgentsByKbId(kbId);
    },

    async getLinkedKbs(agentId: string) {
        return knowledgeRepository.findKbsByAgentId(agentId);
    },
};
