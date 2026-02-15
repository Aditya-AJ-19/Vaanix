// ===========================
// API Response Types
// ===========================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: PaginationMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface PaginationMeta {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// ===========================
// RBAC Types
// ===========================

export const PERMISSIONS = {
    AGENT_CREATE: 'agent:create',
    AGENT_READ: 'agent:read',
    AGENT_UPDATE: 'agent:update',
    AGENT_DELETE: 'agent:delete',
    KNOWLEDGE_MANAGE: 'knowledge:manage',
    LEADS_READ: 'leads:read',
    LEADS_EXPORT: 'leads:export',
    ANALYTICS_VIEW: 'analytics:view',
    BILLING_MANAGE: 'billing:manage',
    SETTINGS_MANAGE: 'settings:manage',
    MEMBERS_MANAGE: 'members:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
    VIEWER: 'viewer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [ROLES.OWNER]: Object.values(PERMISSIONS),
    [ROLES.ADMIN]: [
        PERMISSIONS.AGENT_CREATE,
        PERMISSIONS.AGENT_READ,
        PERMISSIONS.AGENT_UPDATE,
        PERMISSIONS.AGENT_DELETE,
        PERMISSIONS.KNOWLEDGE_MANAGE,
        PERMISSIONS.LEADS_READ,
        PERMISSIONS.LEADS_EXPORT,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.SETTINGS_MANAGE,
        PERMISSIONS.MEMBERS_MANAGE,
    ],
    [ROLES.MEMBER]: [
        PERMISSIONS.AGENT_CREATE,
        PERMISSIONS.AGENT_READ,
        PERMISSIONS.AGENT_UPDATE,
        PERMISSIONS.KNOWLEDGE_MANAGE,
        PERMISSIONS.LEADS_READ,
        PERMISSIONS.ANALYTICS_VIEW,
    ],
    [ROLES.VIEWER]: [PERMISSIONS.AGENT_READ, PERMISSIONS.LEADS_READ, PERMISSIONS.ANALYTICS_VIEW],
};

// ===========================
// Common Utility Types
// ===========================

export type WithOrgId<T> = T & { organizationId: string };

export interface Timestamps {
    createdAt: Date;
    updatedAt: Date;
}

// ===========================
// Utility Functions
// ===========================

export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function formatApiResponse<T>(data: T): ApiResponse<T> {
    return { success: true, data };
}

export function formatApiError(code: string, message: string): ApiResponse {
    return { success: false, error: { code, message } };
}
