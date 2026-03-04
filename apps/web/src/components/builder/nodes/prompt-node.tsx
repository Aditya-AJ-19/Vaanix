'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import type { PromptNodeData } from '@/stores/builder-store';

export function PromptNode({ data, selected }: NodeProps) {
    const d = data as PromptNodeData;
    return (
        <div
            className={`min-w-[180px] rounded-xl border-2 bg-white shadow-md transition-all ${selected ? 'border-indigo-500 shadow-indigo-100' : 'border-indigo-200'
                }`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
            />
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-t-[10px] border-b border-indigo-100">
                <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-indigo-800">{d.label}</span>
            </div>
            {/* Body */}
            <div className="px-3 py-2">
                <p className="text-xs text-surface-500 line-clamp-2">
                    {d.systemMessage || 'Configure prompt…'}
                </p>
                {d.knowledgeBaseId && (
                    <span className="mt-1 inline-block text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                        KB linked
                    </span>
                )}
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
            />
        </div>
    );
}
