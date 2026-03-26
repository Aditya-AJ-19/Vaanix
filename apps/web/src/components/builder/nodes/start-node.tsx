'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import type { StartNodeData } from '@/stores/builder-store';

export function StartNode({ data, selected }: NodeProps) {
    const d = data as StartNodeData;
    return (
        <div
            className={`min-w-[180px] rounded-xl border-2 bg-white shadow-md transition-all ${selected ? 'border-emerald-500 shadow-emerald-100' : 'border-emerald-200'
                }`}
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-t-[10px] border-b border-emerald-100">
                <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <span className="text-sm font-semibold text-emerald-800">{d.label}</span>
            </div>
            {/* Body */}
            <div className="px-3 py-2">
                <p className="text-xs text-surface-500 line-clamp-2">{d.greeting || 'Set greeting…'}</p>
            </div>
            {/* Handle — output only */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
            />
        </div>
    );
}
