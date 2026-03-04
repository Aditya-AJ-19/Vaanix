'use client';

import { create } from 'zustand';
import {
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    type Connection,
} from '@xyflow/react';

/* ------------------------------------------------------------------ */
/*  Node data types                                                    */
/* ------------------------------------------------------------------ */

export interface StartNodeData {
    [key: string]: unknown;
    label: string;
    greeting: string;
}

export interface PromptNodeData {
    [key: string]: unknown;
    label: string;
    systemMessage: string;
    knowledgeBaseId: string | null;
    temperature: number;
}

export interface ConditionNodeData {
    [key: string]: unknown;
    label: string;
    conditionType: 'keyword' | 'sentiment' | 'intent' | 'custom';
    conditionValue: string;
}

export interface ActionNodeData {
    [key: string]: unknown;
    label: string;
    actionType: 'transfer_call' | 'send_sms' | 'capture_lead' | 'api_call' | 'send_email';
    config: Record<string, string>;
}

export interface EndNodeData {
    [key: string]: unknown;
    label: string;
    message: string;
    endType: 'goodbye' | 'handoff' | 'voicemail';
}

export type BuilderNodeData =
    | StartNodeData
    | PromptNodeData
    | ConditionNodeData
    | ActionNodeData
    | EndNodeData;

export type BuilderNode = Node<BuilderNodeData>;
export type BuilderEdge = Edge;

/* ------------------------------------------------------------------ */
/*  Undo / redo snapshot                                               */
/* ------------------------------------------------------------------ */

interface Snapshot {
    nodes: BuilderNode[];
    edges: BuilderEdge[];
}

/* ------------------------------------------------------------------ */
/*  Store interface                                                    */
/* ------------------------------------------------------------------ */

interface BuilderState {
    nodes: BuilderNode[];
    edges: BuilderEdge[];
    selectedNodeId: string | null;
    isDirty: boolean;

    // History
    past: Snapshot[];
    future: Snapshot[];

    // React Flow callbacks
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    // Node actions
    addNode: (type: string, position?: { x: number; y: number }) => void;
    removeNode: (id: string) => void;
    updateNodeData: (id: string, data: Partial<BuilderNodeData>) => void;
    selectNode: (id: string | null) => void;

    // Workflow actions
    setWorkflow: (nodes: BuilderNode[], edges: BuilderEdge[]) => void;
    clearCanvas: () => void;
    markClean: () => void;

    // Undo / redo
    undo: () => void;
    redo: () => void;
    pushSnapshot: () => void;
}

/* ------------------------------------------------------------------ */
/*  Default data factories                                             */
/* ------------------------------------------------------------------ */

let nodeCounter = 0;

function defaultData(type: string): { data: BuilderNodeData; nodeType: string } {
    switch (type) {
        case 'start':
            return {
                nodeType: 'start',
                data: { label: 'Start', greeting: 'Hello! How can I help you today?' },
            };
        case 'prompt':
            return {
                nodeType: 'prompt',
                data: { label: 'Prompt', systemMessage: '', knowledgeBaseId: null, temperature: 0.7 },
            };
        case 'condition':
            return {
                nodeType: 'condition',
                data: { label: 'Condition', conditionType: 'keyword', conditionValue: '' },
            };
        case 'action':
            return {
                nodeType: 'action',
                data: { label: 'Action', actionType: 'capture_lead', config: {} },
            };
        case 'end':
            return {
                nodeType: 'end',
                data: { label: 'End', message: 'Thank you, goodbye!', endType: 'goodbye' },
            };
        default:
            return {
                nodeType: 'prompt',
                data: { label: 'Prompt', systemMessage: '', knowledgeBaseId: null, temperature: 0.7 },
            };
    }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useBuilderStore = create<BuilderState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    isDirty: false,
    past: [],
    future: [],

    /* React Flow change handlers */

    onNodesChange: (changes) => {
        set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) as BuilderNode[], isDirty: true }));
    },

    onEdgesChange: (changes) => {
        set((s) => ({ edges: applyEdgeChanges(changes, s.edges) as BuilderEdge[], isDirty: true }));
    },

    onConnect: (connection: Connection) => {
        get().pushSnapshot();
        set((s) => ({
            edges: addEdge(
                { ...connection, animated: true, style: { strokeWidth: 2, stroke: '#6366f1' } },
                s.edges,
            ),
            isDirty: true,
        }));
    },

    /* Node actions */

    addNode: (type, position) => {
        get().pushSnapshot();
        const id = `${type}-${++nodeCounter}-${Date.now()}`;
        const { data, nodeType } = defaultData(type);
        const pos = position ?? { x: 250, y: (get().nodes.length + 1) * 120 };
        const newNode: BuilderNode = { id, type: nodeType, position: pos, data };
        set((s) => ({ nodes: [...s.nodes, newNode], isDirty: true }));
    },

    removeNode: (id) => {
        get().pushSnapshot();
        set((s) => ({
            nodes: s.nodes.filter((n) => n.id !== id),
            edges: s.edges.filter((e) => e.source !== id && e.target !== id),
            selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
            isDirty: true,
        }));
    },

    updateNodeData: (id, data) => {
        get().pushSnapshot();
        set((s) => ({
            nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
            isDirty: true,
        }));
    },

    selectNode: (id) => set({ selectedNodeId: id }),

    /* Workflow actions */

    setWorkflow: (nodes, edges) => {
        // Reset counter based on loaded nodes
        const maxNum = nodes.reduce((max, n) => {
            const m = n.id.match(/-(\d+)-/);
            return m ? Math.max(max, parseInt(m[1]!)) : max;
        }, 0);
        nodeCounter = maxNum;
        set({ nodes, edges, isDirty: false, past: [], future: [], selectedNodeId: null });
    },

    clearCanvas: () => {
        get().pushSnapshot();
        set({ nodes: [], edges: [], selectedNodeId: null, isDirty: true });
    },

    markClean: () => set({ isDirty: false }),

    /* Undo / redo */

    pushSnapshot: () => {
        const { nodes, edges, past } = get();
        set({ past: [...past.slice(-30), { nodes, edges }], future: [] });
    },

    undo: () => {
        const { past, nodes, edges } = get();
        if (past.length === 0) return;
        const prev = past[past.length - 1]!;
        set({
            past: past.slice(0, -1),
            future: [{ nodes, edges }, ...get().future],
            nodes: prev.nodes,
            edges: prev.edges,
            isDirty: true,
        });
    },

    redo: () => {
        const { future, nodes, edges } = get();
        if (future.length === 0) return;
        const next = future[0]!;
        set({
            future: future.slice(1),
            past: [...get().past, { nodes, edges }],
            nodes: next.nodes,
            edges: next.edges,
            isDirty: true,
        });
    },
}));
