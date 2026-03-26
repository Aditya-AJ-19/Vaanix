import type { Request, Response, NextFunction } from 'express';
import { formatApiResponse } from '@vaanix/shared';
import type { AuthContext } from '../../core/auth.middleware';
import {
    knowledgeService,
    listKnowledgeBasesSchema,
    linkAgentSchema,
} from './knowledge.service';

export const knowledgeController = {
    // --- Knowledge Bases ---

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const query = listKnowledgeBasesSchema.parse(req.query);
            const result = await knowledgeService.listByOrgPaginated({
                orgId: ctx.dbOrgId!,
                ...query,
            });
            res.json(formatApiResponse(result.data, {
                page: query.page,
                pageSize: query.pageSize,
                totalCount: result.total,
                totalPages: Math.ceil(result.total / query.pageSize),
            }));
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            const kb = await knowledgeService.getById(id, ctx.dbOrgId!);
            res.json(formatApiResponse(kb));
        } catch (err) {
            next(err);
        }
    },

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const kb = await knowledgeService.create(ctx.dbOrgId!, req.body);
            res.status(201).json(formatApiResponse(kb));
        } catch (err) {
            next(err);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            const kb = await knowledgeService.update(id, ctx.dbOrgId!, req.body);
            res.json(formatApiResponse(kb));
        } catch (err) {
            next(err);
        }
    },

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            await knowledgeService.remove(id, ctx.dbOrgId!);
            res.json(formatApiResponse({ deleted: true }));
        } catch (err) {
            next(err);
        }
    },

    // --- Documents ---

    async listDocuments(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const kbId = req.params.id as string;
            const docs = await knowledgeService.listDocuments(kbId, ctx.dbOrgId!);
            res.json(formatApiResponse(docs));
        } catch (err) {
            next(err);
        }
    },

    async uploadDocument(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const kbId = req.params.id as string;
            const doc = await knowledgeService.uploadDocument(kbId, ctx.dbOrgId!, req.body);
            res.status(201).json(formatApiResponse(doc));
        } catch (err) {
            next(err);
        }
    },

    async removeDocument(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const kbId = req.params.id as string;
            const docId = req.params.docId as string;
            await knowledgeService.removeDocument(docId, kbId, ctx.dbOrgId!);
            res.json(formatApiResponse({ deleted: true }));
        } catch (err) {
            next(err);
        }
    },

    // --- Agent ↔ KB Linking ---

    async linkAgent(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const kbId = req.params.id as string;
            const { agentId } = linkAgentSchema.parse(req.body);
            const link = await knowledgeService.linkAgent(kbId, ctx.dbOrgId!, agentId);
            res.status(201).json(formatApiResponse(link));
        } catch (err) {
            next(err);
        }
    },

    async unlinkAgent(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const kbId = req.params.id as string;
            const agentId = req.params.agentId as string;
            await knowledgeService.unlinkAgent(kbId, ctx.dbOrgId!, agentId);
            res.json(formatApiResponse({ unlinked: true }));
        } catch (err) {
            next(err);
        }
    },

    async getLinkedAgents(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const kbId = req.params.id as string;
            const agents = await knowledgeService.getLinkedAgents(kbId, ctx.dbOrgId!);
            res.json(formatApiResponse(agents));
        } catch (err) {
            next(err);
        }
    },
};
