'use client';

import { useCallback, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    type NodeTypes,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useBuilderStore } from '@/stores/builder-store';
import { StartNode } from '@/components/builder/nodes/start-node';
import { PromptNode } from '@/components/builder/nodes/prompt-node';
import { ConditionNode } from '@/components/builder/nodes/condition-node';
import { ActionNode } from '@/components/builder/nodes/action-node';
import { EndNode } from '@/components/builder/nodes/end-node';

const nodeTypes: NodeTypes = {
    start: StartNode,
    prompt: PromptNode,
    condition: ConditionNode,
    action: ActionNode,
    end: EndNode,
};

export function BuilderCanvas() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode } = useBuilderStore();
    const { fitView } = useReactFlow();

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: any) => selectNode(node.id),
        [selectNode],
    );

    const onPaneClick = useCallback(() => selectNode(null), [selectNode]);

    const defaultEdgeOptions = useMemo(
        () => ({
            animated: true,
            style: { strokeWidth: 2, stroke: '#6366f1' },
        }),
        [],
    );

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            className="bg-surface-50"
            deleteKeyCode={['Backspace', 'Delete']}
        >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls
                showInteractive={false}
                className="!bg-white !border-surface-200 !rounded-xl !shadow-lg"
            />
            <MiniMap
                nodeStrokeWidth={3}
                nodeColor={(n) => {
                    switch (n.type) {
                        case 'start': return '#10b981';
                        case 'prompt': return '#6366f1';
                        case 'condition': return '#f59e0b';
                        case 'action': return '#3b82f6';
                        case 'end': return '#f43f5e';
                        default: return '#94a3b8';
                    }
                }}
                className="!bg-white !border-surface-200 !rounded-xl !shadow-lg"
                maskColor="rgba(241, 245, 249, 0.7)"
            />
        </ReactFlow>
    );
}
