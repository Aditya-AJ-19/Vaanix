'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import type { ConditionNodeData } from '@/stores/builder-store';

export function ConditionNode({ data, selected }: NodeProps) {
    const d = data as ConditionNodeData;
    return (
        <div
            className={`min-w-[180px] rounded-xl border-2 bg-white shadow-md transition-all ${selected ? 'border-amber-500 shadow-amber-100' : 'border-amber-200'
                }`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
            />
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-t-[10px] border-b border-amber-100">
                <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center">
                    <GitBranch className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-amber-800">{d.label}</span>
            </div>
            {/* Body */}
            <div className="px-3 py-2">
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                    {d.conditionType}
                </span>
                <p className="text-xs text-surface-500 mt-1 line-clamp-1">
                    {d.conditionValue || 'Set condition…'}
                </p>
            </div>
            {/* Two outputs: Yes / No */}
            <div className="flex justify-between px-4 pb-1">
                <span className="text-[10px] text-emerald-600 font-medium">Yes</span>
                <span className="text-[10px] text-red-500 font-medium">No</span>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="yes"
                style={{ left: '30%' }}
                className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="no"
                style={{ left: '70%' }}
                className="!w-3 !h-3 !bg-red-400 !border-2 !border-white"
            />
        </div>
    );
}
