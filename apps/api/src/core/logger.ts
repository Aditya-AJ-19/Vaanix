import pino from 'pino';
import type { Request, Response, NextFunction } from 'express';

export const logger = pino({
    transport:
        process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss',
                    ignore: 'pid,hostname',
                },
            }
            : undefined,
    level: process.env.LOG_LEVEL || 'info',
});

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
    logger.info({ method: req.method, url: req.url }, 'incoming request');
    next();
}
