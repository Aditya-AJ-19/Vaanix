'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';
import type { ApiResponse, PaginationMeta } from '@vaanix/shared';

// ===========================
// Types
// ===========================

export interface KnowledgeBase {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface KnowledgeDocument {
    id: string;
    knowledgeBaseId: string;
    fileName: string;
    fileType: string;
    fileSize: number | null;
    sourceUrl: string | null;
    content: string | null;
    status: string;
    errorMessage: string | null;
    chunkCount: number | null;
    createdAt: string;
    updatedAt: string;
}

interface KnowledgeBasesResponse {
    success: boolean;
    data: KnowledgeBase[];
    meta?: PaginationMeta;
}

interface KnowledgeBaseResponse {
    success: boolean;
    data: KnowledgeBase;
}

interface DocumentsResponse {
    success: boolean;
    data: KnowledgeDocument[];
}

interface DocumentResponse {
    success: boolean;
    data: KnowledgeDocument;
}

// ===========================
// useKnowledgeBases Hook
// ===========================

export function useKnowledgeBases(search?: string) {
    const { getToken } = useAuth();
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<PaginationMeta | undefined>();

    const fetchKnowledgeBases = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            const queryStr = params.toString() ? `?${params.toString()}` : '';
            const res = await apiClient<KnowledgeBasesResponse>(
                `/api/knowledge-bases${queryStr}`,
                { token: token ?? undefined },
            );
            setKnowledgeBases(res.data ?? []);
            setMeta(res.meta);
        } catch (err: any) {
            setError(err.message ?? 'Failed to load knowledge bases');
            setKnowledgeBases([]);
        } finally {
            setLoading(false);
        }
    }, [getToken, search]);

    useEffect(() => {
        fetchKnowledgeBases();
    }, [fetchKnowledgeBases]);

    const createKnowledgeBase = async (data: { name: string; description?: string }) => {
        try {
            const token = await getToken();
            const res = await apiClient<KnowledgeBaseResponse>('/api/knowledge-bases', {
                method: 'POST',
                body: JSON.stringify(data),
                token: token ?? undefined,
            });
            await fetchKnowledgeBases();
            return res.data;
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to create knowledge base');
        }
    };

    const updateKnowledgeBase = async (id: string, data: { name?: string; description?: string }) => {
        try {
            const token = await getToken();
            const res = await apiClient<KnowledgeBaseResponse>(`/api/knowledge-bases/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
                token: token ?? undefined,
            });
            await fetchKnowledgeBases();
            return res.data;
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to update knowledge base');
        }
    };

    const deleteKnowledgeBase = async (id: string) => {
        try {
            const token = await getToken();
            await apiClient(`/api/knowledge-bases/${id}`, {
                method: 'DELETE',
                token: token ?? undefined,
            });
            await fetchKnowledgeBases();
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to delete knowledge base');
        }
    };

    return {
        knowledgeBases,
        loading,
        error,
        meta,
        refetch: fetchKnowledgeBases,
        createKnowledgeBase,
        updateKnowledgeBase,
        deleteKnowledgeBase,
    };
}

// ===========================
// useKnowledgeBase Hook (single KB + documents)
// ===========================

export function useKnowledgeBase(id: string) {
    const { getToken } = useAuth();
    const [kb, setKb] = useState<KnowledgeBase | null>(null);
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchKb = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            const [kbRes, docsRes] = await Promise.all([
                apiClient<KnowledgeBaseResponse>(`/api/knowledge-bases/${id}`, {
                    token: token ?? undefined,
                }),
                apiClient<DocumentsResponse>(`/api/knowledge-bases/${id}/documents`, {
                    token: token ?? undefined,
                }),
            ]);
            setKb(kbRes.data);
            setDocuments(docsRes.data ?? []);
        } catch (err: any) {
            setError(err.message ?? 'Failed to load knowledge base');
            setKb(null);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    }, [getToken, id]);

    useEffect(() => {
        if (id) fetchKb();
    }, [id, fetchKb]);

    const uploadDocument = async (data: {
        fileName: string;
        fileType: string;
        fileSize?: number;
        sourceUrl?: string;
        content?: string;
    }) => {
        try {
            const token = await getToken();
            const res = await apiClient<DocumentResponse>(
                `/api/knowledge-bases/${id}/documents`,
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                    token: token ?? undefined,
                },
            );
            await fetchKb();
            return res.data;
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to upload document');
        }
    };

    const removeDocument = async (docId: string) => {
        try {
            const token = await getToken();
            await apiClient(`/api/knowledge-bases/${id}/documents/${docId}`, {
                method: 'DELETE',
                token: token ?? undefined,
            });
            await fetchKb();
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to remove document');
        }
    };

    const linkAgent = async (agentId: string) => {
        try {
            const token = await getToken();
            await apiClient(`/api/knowledge-bases/${id}/agents`, {
                method: 'POST',
                body: JSON.stringify({ agentId }),
                token: token ?? undefined,
            });
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to link agent');
        }
    };

    const unlinkAgent = async (agentId: string) => {
        try {
            const token = await getToken();
            await apiClient(`/api/knowledge-bases/${id}/agents/${agentId}`, {
                method: 'DELETE',
                token: token ?? undefined,
            });
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to unlink agent');
        }
    };

    return {
        kb,
        documents,
        loading,
        error,
        refetch: fetchKb,
        uploadDocument,
        removeDocument,
        linkAgent,
        unlinkAgent,
    };
}
