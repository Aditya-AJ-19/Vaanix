import type { Request, Response, NextFunction } from 'express';
import { formatApiResponse } from '@vaanix/shared';
import type { AuthContext } from '../../core/auth.middleware';
import { agentService, listAgentsSchema } from './agent.service';

export const agentController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const query = listAgentsSchema.parse(req.query);
            const result = await agentService.listByOrgPaginated({
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
            const agent = await agentService.getById(id, ctx.dbOrgId!);
            res.json(formatApiResponse(agent));
        } catch (err) {
            next(err);
        }
    },

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const agent = await agentService.create(ctx.dbOrgId!, ctx.dbUserId!, req.body);
            res.status(201).json(formatApiResponse(agent));
        } catch (err) {
            next(err);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            const agent = await agentService.update(id, ctx.dbOrgId!, req.body);
            res.json(formatApiResponse(agent));
        } catch (err) {
            next(err);
        }
    },

    async duplicate(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            const agent = await agentService.duplicate(id, ctx.dbOrgId!, ctx.dbUserId!);
            res.status(201).json(formatApiResponse(agent));
        } catch (err) {
            next(err);
        }
    },

    async publish(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            const agent = await agentService.publish(id, ctx.dbOrgId!);
            res.json(formatApiResponse(agent));
        } catch (err) {
            next(err);
        }
    },

    async archive(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            const agent = await agentService.archive(id, ctx.dbOrgId!);
            res.json(formatApiResponse(agent));
        } catch (err) {
            next(err);
        }
    },

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            await agentService.remove(id, ctx.dbOrgId!);
            res.json(formatApiResponse({ deleted: true }));
        } catch (err) {
            next(err);
        }
    },
};
