import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { formatApiError } from '@vaanix/shared';

// ===========================
// Custom Error Class
// ===========================

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(statusCode: number, code: string, message: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

// ===========================
// 404 Handler
// ===========================

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
    next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
}

// ===========================
// Global Error Handler
// ===========================

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json(formatApiError(err.code, err.message));
        return;
    }

    // Unexpected errors
    logger.error({ err }, 'Unhandled error');
    res.status(500).json(formatApiError('INTERNAL_ERROR', 'An unexpected error occurred'));
}
