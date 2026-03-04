'use client';

import { X, Trash2 } from 'lucide-react';
import {
    useBuilderStore,
    type StartNodeData,
    type PromptNodeData,
    type ConditionNodeData,
    type ActionNodeData,
    type EndNodeData,
} from '@/stores/builder-store';

export function NodeConfigPanel() {
    const { nodes, selectedNodeId, updateNodeData, removeNode, selectNode } = useBuilderStore();
    const node = nodes.find((n) => n.id === selectedNodeId);

    if (!node) return null;

    const type = node.type ?? 'prompt';

    return (
        <div className="w-80 bg-white border-l border-surface-200 overflow-y-auto shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 bg-surface-50">
                <h3 className="text-sm font-semibold text-surface-900">Configure Node</h3>
                <button
                    onClick={() => selectNode(null)}
                    className="p-1 rounded hover:bg-surface-200 text-surface-400 hover:text-surface-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Label (all types) */}
                <FieldLabel label="Label">
                    <input
                        value={(node.data as any).label ?? ''}
                        onChange={(e) => updateNodeData(node.id, { label: e.target.value } as any)}
                        className="input-field"
                    />
                </FieldLabel>

                {/* Type-specific fields */}
                {type === 'start' && <StartFields data={node.data as StartNodeData} id={node.id} />}
                {type === 'prompt' && <PromptFields data={node.data as PromptNodeData} id={node.id} />}
                {type === 'condition' && <ConditionFields data={node.data as ConditionNodeData} id={node.id} />}
                {type === 'action' && <ActionFields data={node.data as ActionNodeData} id={node.id} />}
                {type === 'end' && <EndFields data={node.data as EndNodeData} id={node.id} />}

                {/* Delete */}
                <div className="pt-4 border-t border-surface-100">
                    <button
                        onClick={() => { removeNode(node.id); selectNode(null); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Node
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Field helpers                                                      */
/* ------------------------------------------------------------------ */

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">{label}</label>
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Per-type config forms                                              */
/* ------------------------------------------------------------------ */

function StartFields({ data, id }: { data: StartNodeData; id: string }) {
    const update = useBuilderStore((s) => s.updateNodeData);
    return (
        <FieldLabel label="Greeting Message">
            <textarea
                value={data.greeting}
                onChange={(e) => update(id, { greeting: e.target.value } as any)}
                rows={3}
                className="input-field resize-none"
            />
        </FieldLabel>
    );
}

function PromptFields({ data, id }: { data: PromptNodeData; id: string }) {
    const update = useBuilderStore((s) => s.updateNodeData);
    return (
        <>
            <FieldLabel label="System Message">
                <textarea
                    value={data.systemMessage}
                    onChange={(e) => update(id, { systemMessage: e.target.value } as any)}
                    rows={5}
                    className="input-field resize-none font-mono text-xs"
                    placeholder="You are a helpful assistant…"
                />
            </FieldLabel>
            <FieldLabel label="Temperature">
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={data.temperature}
                        onChange={(e) => update(id, { temperature: parseFloat(e.target.value) } as any)}
                        className="flex-1 accent-indigo-500"
                    />
                    <span className="text-xs text-surface-500 w-8 text-right">{data.temperature}</span>
                </div>
            </FieldLabel>
        </>
    );
}

function ConditionFields({ data, id }: { data: ConditionNodeData; id: string }) {
    const update = useBuilderStore((s) => s.updateNodeData);
    return (
        <>
            <FieldLabel label="Condition Type">
                <select
                    value={data.conditionType}
                    onChange={(e) => update(id, { conditionType: e.target.value } as any)}
                    className="input-field"
                >
                    <option value="keyword">Keyword Match</option>
                    <option value="sentiment">Sentiment</option>
                    <option value="intent">Intent Detection</option>
                    <option value="custom">Custom Expression</option>
                </select>
            </FieldLabel>
            <FieldLabel label="Value / Expression">
                <input
                    value={data.conditionValue}
                    onChange={(e) => update(id, { conditionValue: e.target.value } as any)}
                    placeholder="e.g., pricing, complaint"
                    className="input-field"
                />
            </FieldLabel>
        </>
    );
}

function ActionFields({ data, id }: { data: ActionNodeData; id: string }) {
    const update = useBuilderStore((s) => s.updateNodeData);
    return (
        <FieldLabel label="Action Type">
            <select
                value={data.actionType}
                onChange={(e) => update(id, { actionType: e.target.value } as any)}
                className="input-field"
            >
                <option value="transfer_call">Transfer Call</option>
                <option value="send_sms">Send SMS</option>
                <option value="capture_lead">Capture Lead</option>
                <option value="api_call">API Call</option>
                <option value="send_email">Send Email</option>
            </select>
        </FieldLabel>
    );
}

function EndFields({ data, id }: { data: EndNodeData; id: string }) {
    const update = useBuilderStore((s) => s.updateNodeData);
    return (
        <>
            <FieldLabel label="End Type">
                <select
                    value={data.endType}
                    onChange={(e) => update(id, { endType: e.target.value } as any)}
                    className="input-field"
                >
                    <option value="goodbye">Goodbye</option>
                    <option value="handoff">Handoff to Agent</option>
                    <option value="voicemail">Voicemail</option>
                </select>
            </FieldLabel>
            <FieldLabel label="Closing Message">
                <textarea
                    value={data.message}
                    onChange={(e) => update(id, { message: e.target.value } as any)}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Thank you, goodbye!"
                />
            </FieldLabel>
        </>
    );
}
