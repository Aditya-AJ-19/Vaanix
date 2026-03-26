'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
    responseStyle: string | null;
    responseFormat: string | null;
    customInstructions: string | null;
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

    const fetchAgentsAbortRef = useRef<AbortController | null>(null);

    const fetchAgents = useCallback(async ({ bestEffort = false }: { bestEffort?: boolean } = {}) => {
        // Cancel any in-flight request for this hook instance
        fetchAgentsAbortRef.current?.abort();
        const controller = new AbortController();
        fetchAgentsAbortRef.current = controller;

        try {
            setLoading(true);
            if (!bestEffort) setError(null);
            const token = await getToken();
            const params = new URLSearchParams();
            if (status && status !== 'all') params.set('status', status);
            if (search) params.set('search', search);
            const queryStr = params.toString() ? `?${params.toString()}` : '';
            const res = await apiClient<AgentsResponse>(`/api/agents${queryStr}`, {
                token: token ?? undefined,
                signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            setAgents(res.data ?? []);
            setMeta(res.meta);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            if (bestEffort) {
                // Best-effort: log but don't wipe existing state
                console.warn('[useAgents] Background refresh failed:', err.message);
            } else {
                setError(err.message ?? 'Failed to load agents');
                setAgents([]);
            }
        } finally {
            if (!controller.signal.aborted) setLoading(false);
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
            // Optimistically add to list; best-effort refresh
            setAgents((prev) => [...prev, res.data]);
            fetchAgents({ bestEffort: true }).catch((err) => console.warn('[useAgents] createAgent refresh failed:', err));
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
            // Optimistically replace in list; best-effort refresh
            setAgents((prev) => prev.map((a) => (a.id === id ? res.data : a)));
            fetchAgents({ bestEffort: true }).catch((err) => console.warn('[useAgents] updateAgent refresh failed:', err));
            return res.data;
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to update agent');
        }
    };

    const deleteAgent = async (id: string) => {
        try {
            const token = await getToken();
            await apiClient(`/api/agents/${id}`, { method: 'DELETE', token: token ?? undefined });
            // Optimistically remove from list; best-effort refresh
            setAgents((prev) => prev.filter((a) => a.id !== id));
            fetchAgents({ bestEffort: true }).catch((err) => console.warn('[useAgents] deleteAgent refresh failed:', err));
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
            // Optimistically add to list; best-effort refresh
            setAgents((prev) => [...prev, res.data]);
            fetchAgents({ bestEffort: true }).catch((err) => console.warn('[useAgents] duplicateAgent refresh failed:', err));
            return res.data;
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to duplicate agent');
        }
    };

    const publishAgent = async (id: string) => {
        try {
            const token = await getToken();
            await apiClient(`/api/agents/${id}/publish`, { method: 'POST', token: token ?? undefined });
            fetchAgents({ bestEffort: true }).catch((err) => console.warn('[useAgents] publishAgent refresh failed:', err));
        } catch (err: any) {
            throw new Error(err?.message ?? 'Failed to publish agent');
        }
    };

    const archiveAgent = async (id: string) => {
        try {
            const token = await getToken();
            await apiClient(`/api/agents/${id}/archive`, { method: 'POST', token: token ?? undefined });
            fetchAgents({ bestEffort: true }).catch((err) => console.warn('[useAgents] archiveAgent refresh failed:', err));
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

    const fetchAgentAbortRef = useRef<AbortController | null>(null);

    const fetchAgent = useCallback(async () => {
        // Cancel any in-flight fetchAgent request
        fetchAgentAbortRef.current?.abort();
        const controller = new AbortController();
        fetchAgentAbortRef.current = controller;

        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            const res = await apiClient<AgentResponse>(`/api/agents/${id}`, {
                token: token ?? undefined,
                signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            setAgent(res.data);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            setError(err.message ?? 'Failed to load agent');
            setAgent(null);
        } finally {
            if (!controller.signal.aborted) setLoading(false);
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
