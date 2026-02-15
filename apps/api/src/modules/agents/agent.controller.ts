import type { Request, Response, NextFunction } from 'express';
import { formatApiResponse } from '@vaanix/shared';
import type { AuthContext } from '../../core/auth.middleware';
import { agentService } from './agent.service';

export const agentController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const agents = await agentService.listByOrg(ctx.orgId!);
            res.json(formatApiResponse(agents));
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            const agent = await agentService.getById(id, ctx.orgId!);
            res.json(formatApiResponse(agent));
        } catch (err) {
            next(err);
        }
    },

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const agent = await agentService.create(ctx.orgId!, ctx.userId, req.body);
            res.status(201).json(formatApiResponse(agent));
        } catch (err) {
            next(err);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            const agent = await agentService.update(id, ctx.orgId!, req.body);
            res.json(formatApiResponse(agent));
        } catch (err) {
            next(err);
        }
    },

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            await agentService.remove(id, ctx.orgId!);
            res.json(formatApiResponse({ deleted: true }));
        } catch (err) {
            next(err);
        }
    },
};
