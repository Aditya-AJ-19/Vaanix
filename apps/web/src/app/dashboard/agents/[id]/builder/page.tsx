'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import {
    ArrowLeft,
    Save,
    Loader2,
    Undo2,
    Redo2,
    LayoutGrid,
    Trash2,
    Play,
    MessageSquare,
    GitBranch,
    Zap,
    Square,
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { useBuilderStore, type BuilderNode, type BuilderEdge } from '@/stores/builder-store';
import { BuilderCanvas } from '@/components/builder/canvas';
import { NodeConfigPanel } from '@/components/builder/node-config-panel';
import { getLayoutedElements } from '@/lib/auto-layout';

/* ------------------------------------------------------------------ */
/*  Toolbar node palette                                               */
/* ------------------------------------------------------------------ */

const NODE_PALETTE = [
    { type: 'start', label: 'Start', icon: Play, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { type: 'prompt', label: 'Prompt', icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { type: 'action', label: 'Action', icon: Zap, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { type: 'end', label: 'End', icon: Square, color: 'text-rose-600 bg-rose-50 border-rose-200' },
];

/* ------------------------------------------------------------------ */
/*  Serialization helpers                                              */
/* ------------------------------------------------------------------ */

interface WorkflowPayload {
    nodes: BuilderNode[];
    edges: BuilderEdge[];
}

function serialize(nodes: BuilderNode[], edges: BuilderEdge[]): string {
    return JSON.stringify({ nodes, edges });
}

function deserialize(raw: string | null): WorkflowPayload | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return parsed;
        return null;
    } catch {
        return null;
    }
}

/* ------------------------------------------------------------------ */
/*  Inner builder (needs ReactFlowProvider above it)                   */
/* ------------------------------------------------------------------ */

function BuilderInner() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const id = params.id as string;

    const {
        nodes, edges, isDirty, selectedNodeId,
        addNode, setWorkflow, clearCanvas, markClean,
        undo, redo, past, future,
    } = useBuilderStore();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [agentName, setAgentName] = useState('');

    /* Load workflow from agent */
    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                const res = await apiClient<{ success: boolean; data: any }>(`/api/agents/${id}`, {
                    token: token ?? undefined,
                });
                setAgentName(res.data.name ?? '');
                const wf = deserialize(res.data.workflowData);
                if (wf) {
                    setWorkflow(wf.nodes, wf.edges);
                } else {
                    setWorkflow([], []);
                }
            } catch {
                // Silently fail — empty canvas
                setWorkflow([], []);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    /* Save workflow */
    const handleSave = useCallback(async () => {
        try {
            setSaving(true);
            const token = await getToken();
            await apiClient(`/api/agents/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ workflowData: serialize(nodes, edges) }),
                token: token ?? undefined,
            });
            markClean();
            toast.success('Workflow saved', {
                description: 'Your workflow changes have been saved successfully.',
            });
        } catch (err: any) {
            toast.error('Failed to save workflow', {
                description: err?.message ?? 'Something went wrong. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    }, [getToken, id, nodes, edges, markClean]);

    /* Auto-layout */
    const handleAutoLayout = useCallback(() => {
        const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges);
        setWorkflow(ln, le);
    }, [nodes, edges, setWorkflow]);

    /* Keyboard shortcuts */
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo(); else undo();
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleSave, undo, redo]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-surface-50">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-surface-50">
            {/* Top toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-surface-200 shadow-sm z-10">
                {/* Left section */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push(`/dashboard/agents/${id}`)}
                        className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold text-surface-900">{agentName}</h1>
                        <p className="text-xs text-surface-400">Workflow Builder</p>
                    </div>
                    {isDirty && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            Unsaved
                        </span>
                    )}
                </div>

                {/* Center — node palette */}
                <div className="flex items-center gap-1.5">
                    {NODE_PALETTE.map((item) => (
                        <button
                            key={item.type}
                            onClick={() => addNode(item.type)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors hover:shadow-sm ${item.color}`}
                            title={`Add ${item.label} node`}
                        >
                            <item.icon className="w-3.5 h-3.5" />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Right — actions */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={undo}
                        disabled={past.length === 0}
                        className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={redo}
                        disabled={future.length === 0}
                        className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-surface-200 mx-1" />
                    <button
                        onClick={handleAutoLayout}
                        className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
                        title="Auto-layout"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Clear canvas"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-surface-200 mx-1" />
                    <button
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Canvas + side panel */}
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1">
                    <BuilderCanvas />
                </div>
                {selectedNodeId && <NodeConfigPanel />}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page component (wraps with ReactFlowProvider)                      */
/* ------------------------------------------------------------------ */

export default function BuilderPage() {
    return (
        <ReactFlowProvider>
            <BuilderInner />
        </ReactFlowProvider>
    );
}
