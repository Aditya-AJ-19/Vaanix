import type { Request, Response, NextFunction } from 'express';
import { formatApiResponse, formatApiError } from '@vaanix/shared';
import type { AuthContext } from '../../core/auth.middleware';
import { chatService } from './chat.service';

export const chatController = {
    /**
     * POST /api/chat/sessions
     * Create a new chat session for an agent.
     */
    async createSession(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const { agentId } = req.body;

            if (!agentId) {
                res.status(400).json(formatApiError('VALIDATION', 'agentId is required'));
                return;
            }

            const session = await chatService.createSession(agentId, ctx.dbOrgId!, ctx.dbUserId!);
            res.status(201).json(formatApiResponse(session));
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/chat/sessions/:id
     * Get session details with messages.
     */
    async getSession(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            const session = await chatService.getSession(id, ctx.dbOrgId!);
            res.json(formatApiResponse(session));
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/chat/sessions?agentId=xxx
     * List sessions for an agent.
     */
    async listSessions(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const agentId = req.query.agentId as string;

            if (!agentId) {
                res.status(400).json(formatApiError('VALIDATION', 'agentId query param is required'));
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 20;
            const result = await chatService.listSessions(agentId, ctx.dbOrgId!, page, pageSize);

            res.json(formatApiResponse(result.data, {
                page,
                pageSize,
                totalCount: result.total,
                totalPages: Math.ceil(result.total / pageSize),
            }));
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/chat/sessions/:id/messages
     * Send a message and stream the LLM response via SSE.
     */
    async sendMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const sessionId = req.params.id as string;
            const { content } = req.body;

            if (!content || typeof content !== 'string' || !content.trim()) {
                res.status(400).json(formatApiError('VALIDATION', 'content is required'));
                return;
            }

            // Set SSE headers
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            });

            // Stream LLM response
            const stream = chatService.streamChat(sessionId, content.trim(), ctx.dbOrgId!);

            for await (const chunk of stream) {
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }

            res.write(`data: [DONE]\n\n`);
            res.end();
        } catch (err: any) {
            // If headers already sent (streaming started), close the connection
            if (res.headersSent) {
                res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
                res.end();
            } else {
                next(err);
            }
        }
    },

    /**
     * POST /api/chat/sessions/:id/end
     * End a chat session.
     */
    async endSession(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = (req as any).authContext as AuthContext;
            const id = req.params.id as string;
            const session = await chatService.endSession(id, ctx.dbOrgId!);
            res.json(formatApiResponse(session));
        } catch (err) {
            next(err);
        }
    },
};
