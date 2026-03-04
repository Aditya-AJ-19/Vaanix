'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';
import type { ApiResponse, PaginationMeta } from '@vaanix/shared';

export interface Agent {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    status: string;
    systemPrompt: string | null;
    personality: string | null;
    greeting: string | null;
    fallbackMessage: string | null;
    language: string;
    voiceId: string | null;
    modelProvider: string | null;
    modelId: string | null;
    temperature: number | null;
    maxTokens: number | null;
    workflowData: string | null;
    version: string;
    isPublished: boolean;
    tags: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
}

interface AgentsResponse {
    success: boolean;
    data: Agent[];
    meta?: PaginationMeta;
}

interface AgentResponse {
    success: boolean;
    data: Agent;
}

export function useAgents(status?: string, search?: string) {
    const { getToken } = useAuth();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<PaginationMeta | undefined>();

    const fetchAgents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            const params = new URLSearchParams();
            if (status && status !== 'all') params.set('status', status);
            if (search) params.set('search', search);
            const queryStr = params.toString() ? `?${params.toString()}` : '';
            const res = await apiClient<AgentsResponse>(`/api/agents${queryStr}`, { token: token ?? undefined });
            setAgents(res.data ?? []);
            setMeta(res.meta);
        } catch (err: any) {
            setError(err.message ?? 'Failed to load agents');
            setAgents([]);
        } finally {
            setLoading(false);
        }
    }, [getToken, status, search]);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const createAgent = async (data: { name: string; description?: string; language?: string }) => {
        try {
            const token = await getToken();
            const res = await apiClient<AgentResponse>('/api/agents', {
                method: 'POST',
                body: JSON.stringify(data),
                token: token ?? undefined,
            });
            await fetchAgents();
            return res.data;
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to create agent');
        }
    };

    const updateAgent = async (id: string, data: Record<string, unknown>) => {
        try {
            const token = await getToken();
            const res = await apiClient<AgentResponse>(`/api/agents/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
                token: token ?? undefined,
            });
            await fetchAgents();
            return res.data;
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to update agent');
        }
    };

    const deleteAgent = async (id: string) => {
        try {
            const token = await getToken();
            await apiClient(`/api/agents/${id}`, { method: 'DELETE', token: token ?? undefined });
            await fetchAgents();
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to delete agent');
        }
    };

    const duplicateAgent = async (id: string) => {
        try {
            const token = await getToken();
            const res = await apiClient<AgentResponse>(`/api/agents/${id}/duplicate`, {
                method: 'POST',
                token: token ?? undefined,
            });
            await fetchAgents();
            return res.data;
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to duplicate agent');
        }
    };

    const publishAgent = async (id: string) => {
        try {
            const token = await getToken();
            await apiClient(`/api/agents/${id}/publish`, { method: 'POST', token: token ?? undefined });
            await fetchAgents();
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to publish agent');
        }
    };

    const archiveAgent = async (id: string) => {
        try {
            const token = await getToken();
            await apiClient(`/api/agents/${id}/archive`, { method: 'POST', token: token ?? undefined });
            await fetchAgents();
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to archive agent');
        }
    };

    return {
        agents,
        loading,
        error,
        meta,
        refetch: fetchAgents,
        createAgent,
        updateAgent,
        deleteAgent,
        duplicateAgent,
        publishAgent,
        archiveAgent,
    };
}

export function useAgent(id: string) {
    const { getToken } = useAuth();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAgent = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            const res = await apiClient<AgentResponse>(`/api/agents/${id}`, { token: token ?? undefined });
            setAgent(res.data);
        } catch (err: any) {
            setError(err.message ?? 'Failed to load agent');
            setAgent(null);
        } finally {
            setLoading(false);
        }
    }, [getToken, id]);

    useEffect(() => {
        if (id) fetchAgent();
    }, [id, fetchAgent]);

    const updateAgent = async (data: Record<string, unknown>) => {
        const token = await getToken();
        const res = await apiClient<AgentResponse>(`/api/agents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token: token ?? undefined,
        });
        setAgent(res.data);
        return res.data;
    };

    return { agent, loading, error, refetch: fetchAgent, updateAgent };
}
