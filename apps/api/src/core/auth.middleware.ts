import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';
import { hasPermission, type Permission, type Role } from '@vaanix/shared';
import { AppError } from './error.middleware';
import { db } from './db';
import { organizations, users, eq } from '@vaanix/database';

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
    /** Clerk's user ID string, e.g. "user_xxx" */
    userId: string;
    /** Internal DB UUID for the user (resolved from clerkUserId) */
    dbUserId: string | null;
    /** Clerk's org ID string, e.g. "org_xxx" */
    orgId: string | null;
    /** Internal DB UUID for the organization (resolved from clerkOrgId) */
    dbOrgId: string | null;
    orgRole: string | null;
}

// ===========================
// Helpers — lazy-init Clerk client
// ===========================

let _clerkClient: Awaited<ReturnType<typeof import('@clerk/express').createClerkClient>> | null = null;

async function getClerkClient() {
    if (!_clerkClient) {
        const { createClerkClient } = await import('@clerk/express');
        _clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    }
    return _clerkClient;
}

/**
 * Resolve a Clerk org ID to the internal DB UUID.
 * Auto-upserts the org row on first encounter.
 */
async function resolveOrgId(clerkOrgId: string): Promise<string | null> {
    if (!db) return null;

    // 1. Try to find existing row
    const rows = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, clerkOrgId))
        .limit(1);

    if (rows[0]) return rows[0].id;

    // 2. Not found — fetch details from Clerk and insert
    let orgName = clerkOrgId;
    let orgSlug = clerkOrgId.replace(/^org_/, 'org-');

    try {
        const clerk = await getClerkClient();
        const clerkOrg = await clerk.organizations.getOrganization({ organizationId: clerkOrgId });
        orgName = clerkOrg.name ?? orgName;
        orgSlug = clerkOrg.slug ?? orgSlug;
    } catch (err) {
        console.warn('[Auth] Could not fetch org from Clerk, using fallback:', err);
    }

    const baseSlug = (orgSlug ?? orgName).toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const inserted = await db
        .insert(organizations)
        .values({
            clerkOrgId,
            name: orgName,
            slug: baseSlug,
            plan: 'free',
            isActive: true,
        })
        .onConflictDoUpdate({
            target: organizations.clerkOrgId,
            set: { name: orgName, slug: baseSlug },
        })
        .returning({ id: organizations.id });

    const dbId = inserted[0]?.id ?? null;
    console.info(`[Auth] Auto-synced org → clerkOrgId=${clerkOrgId}, dbId=${dbId}`);
    return dbId;
}

/**
 * Resolve a Clerk user ID to the internal DB UUID.
 * Auto-upserts the user row on first encounter.
 */
async function resolveUserId(clerkUserId: string): Promise<string | null> {
    if (!db) return null;

    // 1. Try to find existing row
    const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1);

    if (rows[0]) return rows[0].id;

    // 2. Not found — fetch details from Clerk and insert
    let email = `${clerkUserId}@placeholder.local`;
    let firstName: string | null = null;
    let lastName: string | null = null;
    let avatarUrl: string | null = null;

    try {
        const clerk = await getClerkClient();
        const clerkUser = await clerk.users.getUser(clerkUserId);
        email = clerkUser.emailAddresses?.[0]?.emailAddress ?? email;
        firstName = clerkUser.firstName ?? null;
        lastName = clerkUser.lastName ?? null;
        avatarUrl = clerkUser.imageUrl ?? null;
    } catch (err) {
        console.warn('[Auth] Could not fetch user from Clerk, using fallback:', err);
    }

    const inserted = await db
        .insert(users)
        .values({
            clerkUserId,
            email,
            firstName,
            lastName,
            avatarUrl,
        })
        .onConflictDoUpdate({
            target: users.clerkUserId,
            set: { email, firstName, lastName, avatarUrl },
        })
        .returning({ id: users.id });

    const dbId = inserted[0]?.id ?? null;
    console.info(`[Auth] Auto-synced user → clerkUserId=${clerkUserId}, dbId=${dbId}`);
    return dbId;
}

// ===========================
// Middleware
// ===========================

/**
 * Extract and validate organization context from Clerk auth.
 * Requires the user to have an active organization selected.
 * Auto-syncs user & organization rows to the DB on first access
 * so that Clerk webhooks are not required to bootstrap these tables.
 */
export async function requireOrganization(req: Request, _res: Response, next: NextFunction) {
    const auth = getAuth(req);

    if (!auth?.userId) {
        return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!auth.orgId) {
        return next(
            new AppError(403, 'NO_ORGANIZATION', 'You must select an organization to access this resource'),
        );
    }

    // Clerk sends orgRole as "org:admin", "org:member" etc. — strip the prefix
    const rawRole = (auth.orgRole as string) ?? null;
    const normalizedRole = rawRole ? rawRole.replace(/^org:/, '') : null;

    // Resolve both Clerk IDs → DB UUIDs in parallel
    let dbOrgId: string | null = null;
    let dbUserId: string | null = null;

    try {
        [dbOrgId, dbUserId] = await Promise.all([
            resolveOrgId(auth.orgId),
            resolveUserId(auth.userId),
        ]);
    } catch (err) {
        console.error('[Auth] Failed to resolve org/user IDs:', err);
    }

    if (!dbOrgId) {
        return next(
            new AppError(500, 'ORG_SYNC_FAILED', 'Failed to sync organization. Please try again.'),
        );
    }

    if (!dbUserId) {
        return next(
            new AppError(500, 'USER_SYNC_FAILED', 'Failed to sync user. Please try again.'),
        );
    }

    // Attach auth context for downstream use
    (req as any).authContext = {
        userId: auth.userId,
        dbUserId,
        orgId: auth.orgId ?? null,
        dbOrgId,
        orgRole: normalizedRole,
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

        // Normalize role: strip any remaining prefix, default to 'member' for org users
        const rawRole = ctx.orgRole ?? '';
        const role = (rawRole.replace(/^org:/, '') as Role) || 'member';

        if (!hasPermission(role, permission)) {
            return next(
                new AppError(403, 'FORBIDDEN', `Insufficient permissions: ${permission} required`),
            );
        }

        next();
    };
}
