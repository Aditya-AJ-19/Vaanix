import dagre from '@dagrejs/dagre';
import type { BuilderNode, BuilderEdge } from '@/stores/builder-store';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

/**
 * Apply auto-layout using dagre (top-to-bottom).
 * Returns a new array of nodes with updated positions.
 */
export function getLayoutedElements(
    nodes: BuilderNode[],
    edges: BuilderEdge[],
    direction: 'TB' | 'LR' = 'TB',
): { nodes: BuilderNode[]; edges: BuilderEdge[] } {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

    nodes.forEach((node) => {
        g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
        const pos = g.node(node.id);
        return {
            ...node,
            position: {
                x: pos.x - NODE_WIDTH / 2,
                y: pos.y - NODE_HEIGHT / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
}
