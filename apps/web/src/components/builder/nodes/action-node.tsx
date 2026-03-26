'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import type { ActionNodeData } from '@/stores/builder-store';

const ACTION_LABELS: Record<string, string> = {
    transfer_call: 'Transfer Call',
    send_sms: 'Send SMS',
    capture_lead: 'Capture Lead',
    api_call: 'API Call',
    send_email: 'Send Email',
};

export function ActionNode({ data, selected }: NodeProps) {
    const d = data as ActionNodeData;
    return (
        <div
            className={`min-w-[180px] rounded-xl border-2 bg-white shadow-md transition-all ${selected ? 'border-blue-500 shadow-blue-100' : 'border-blue-200'
                }`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
            />
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-t-[10px] border-b border-blue-100">
                <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <span className="text-sm font-semibold text-blue-800">{d.label}</span>
            </div>
            {/* Body */}
            <div className="px-3 py-2">
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                    {ACTION_LABELS[d.actionType] ?? d.actionType}
                </span>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
            />
        </div>
    );
}
