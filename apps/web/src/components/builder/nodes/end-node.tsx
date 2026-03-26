'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Square } from 'lucide-react';
import type { EndNodeData } from '@/stores/builder-store';

const END_LABELS: Record<string, string> = {
    goodbye: 'Goodbye',
    handoff: 'Handoff',
    voicemail: 'Voicemail',
};

export function EndNode({ data, selected }: NodeProps) {
    const d = data as EndNodeData;
    return (
        <div
            className={`min-w-[180px] rounded-xl border-2 bg-white shadow-md transition-all ${selected ? 'border-rose-500 shadow-rose-100' : 'border-rose-200'
                }`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !bg-rose-500 !border-2 !border-white"
            />
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-t-[10px] border-b border-rose-100">
                <div className="w-6 h-6 bg-rose-500 rounded-md flex items-center justify-center">
                    <Square className="w-3 h-3 text-white fill-white" />
                </div>
                <span className="text-sm font-semibold text-rose-800">{d.label}</span>
            </div>
            {/* Body */}
            <div className="px-3 py-2">
                <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-medium">
                    {END_LABELS[d.endType] ?? d.endType}
                </span>
                <p className="text-xs text-surface-500 mt-1 line-clamp-2">
                    {d.message || 'Set message…'}
                </p>
            </div>
        </div>
    );
}
