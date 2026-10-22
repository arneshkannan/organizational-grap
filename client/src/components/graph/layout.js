import dagre from 'dagre';

const nodeWidths = {
  orgNode: 320,
  deptNode: 260,
  teamNode: 240,
  projectNode: 340,
  stageNode: 180,
  blockerNode: 260,
  default: 240,
};

const nodeHeights = {
  orgNode: 150,
  deptNode: 100,
  teamNode: 90,
  projectNode: 210,
  stageNode: 75,
  blockerNode: 85,
  default: 100,
};

export function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 90,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    const width = nodeWidths[node.type] || nodeWidths.default;
    const height = nodeHeights[node.type] || nodeHeights.default;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = nodeWidths[node.type] || nodeWidths.default;
    const height = nodeHeights[node.type] || nodeHeights.default;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
