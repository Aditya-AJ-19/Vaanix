import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';
import { hasPermission, type Permission, type Role } from '@vaanix/shared';
import { AppError } from './error.middleware';

// ===========================
// Clerk Auth Middleware
// ===========================

/**
 * Initialize Clerk middleware for all routes.
 * Adds auth information to the request object.
 */
export const clerkAuth = clerkMiddleware();

/**
 * Require authenticated user. Returns 401 if not authenticated.
 */
export const requireAuthentication = requireAuth();

// ===========================
// Organization Context
// ===========================

export interface AuthContext {
    userId: string;
    orgId: string | null;
    orgRole: string | null;
}

/**
 * Extract and validate organization context from Clerk auth.
 * Requires the user to have an active organization selected.
 */
export function requireOrganization(req: Request, _res: Response, next: NextFunction) {
    const auth = getAuth(req);

    if (!auth?.userId) {
        return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!auth.orgId) {
        return next(
            new AppError(403, 'NO_ORGANIZATION', 'You must select an organization to access this resource'),
        );
    }

    // Attach auth context for downstream use
    (req as any).authContext = {
        userId: auth.userId,
        orgId: auth.orgId ?? null,
        orgRole: (auth.orgRole as string) ?? null,
    } satisfies AuthContext;

    next();
}

// ===========================
// RBAC Permission Middleware
// ===========================

/**
 * Check if the user has the required permission based on their org role.
 */
export function requirePermission(permission: Permission) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const ctx = (req as any).authContext as AuthContext | undefined;

        if (!ctx) {
            return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
        }

        const role = (ctx.orgRole as Role) || 'viewer';

        if (!hasPermission(role, permission)) {
            return next(
                new AppError(403, 'FORBIDDEN', `Insufficient permissions: ${permission} required`),
            );
        }

        next();
    };
}
