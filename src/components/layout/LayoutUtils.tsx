import { ReactFlowInstance } from "@xyflow/react";

interface NodePosition {
  x: number;
  y: number;
}

interface NodePositions {
  [nodeId: string]: NodePosition;
}

interface RelationshipNode {
  sources: string[];
  targets: string[];
  level: number;
}

interface LevelGroups {
  [level: string]: string[];
}

// File: /src/components/DrizzleEditor/layoutUtils.ts (continued)

export const performAutoLayout = (
  useStore: any,
  reactFlowInstance: ReactFlowInstance | null,
) => {
  // Get the current nodes and edges from the store
  const currentNodes = useStore.getState().nodes;
  const currentEdges = useStore.getState().edges;

  // Define spacing parameters - increased for better visibility
  const nodeWidth = 220;
  const nodeHeight = 150;
  const horizontalSpacing = 200; // Increased horizontal spacing
  const verticalSpacing = 150; // Increased vertical spacing
  const startX = 100;
  const startY = 100;

  // Extra spacing for nodes with many relationships
  const relationshipExtraSpacing = 30; // Additional spacing per relationship

  // Create a map to track node positions
  const nodePositions: NodePositions = {};

  // Create a map to track relationships between nodes
  const relationshipMap: { [nodeId: string]: RelationshipNode } = {};

  // Initialize relationship map
  currentNodes.forEach((node: any) => {
    relationshipMap[node.id] = {
      sources: [],
      targets: [],
      level: 0,
    };
  });

  // Populate relationship map from edges
  currentEdges.forEach((edge: any) => {
    if (edge.source && edge.target) {
      if (!relationshipMap[edge.source].targets.includes(edge.target)) {
        relationshipMap[edge.source].targets.push(edge.target);
      }
      if (!relationshipMap[edge.target].sources.includes(edge.source)) {
        relationshipMap[edge.target].sources.push(edge.source);
      }
    }
  });

  // Assign levels to nodes based on relationship depth
  // Nodes with no sources (root tables) are at level 0
  // Nodes that depend on other tables get higher levels
  let changed = true;
  while (changed) {
    changed = false;

    Object.keys(relationshipMap).forEach((nodeId) => {
      const node = relationshipMap[nodeId];

      // If this node has source nodes, its level should be at least one higher
      // than its highest source node
      if (node.sources.length > 0) {
        const sourceLevels = node.sources.map(
          (sourceId) => relationshipMap[sourceId]?.level || 0,
        );
        const maxSourceLevel =
          sourceLevels.length > 0 ? Math.max(...sourceLevels) : -1;

        if (node.level <= maxSourceLevel) {
          node.level = maxSourceLevel + 1;
          changed = true;
        }
      }
    });
  }

  // Count relationships per node for dynamic spacing
  const relationshipCounts: { [nodeId: string]: number } = {};
  Object.keys(relationshipMap).forEach((nodeId) => {
    const total =
      relationshipMap[nodeId].sources.length +
      relationshipMap[nodeId].targets.length;
    relationshipCounts[nodeId] = total;
  });

  // Group nodes by level
  const levelGroups: LevelGroups = {};
  Object.keys(relationshipMap).forEach((nodeId) => {
    const level = relationshipMap[nodeId].level.toString();
    if (!levelGroups[level]) {
      levelGroups[level] = [];
    }
    levelGroups[level].push(nodeId);
  });

  // Sort nodes within each level based on relationships
  // Try to keep related nodes closer together
  Object.keys(levelGroups).forEach((level) => {
    levelGroups[level].sort((nodeIdA, nodeIdB) => {
      const nodeARelations = relationshipMap[nodeIdA];
      const nodeBRelations = relationshipMap[nodeIdB];

      // If one node has sources and the other doesn't, prioritize the one with sources
      if (nodeARelations.sources.length && !nodeBRelations.sources.length)
        return -1;
      if (!nodeARelations.sources.length && nodeBRelations.sources.length)
        return 1;

      // Otherwise sort by number of relationships
      return relationshipCounts[nodeIdB] - relationshipCounts[nodeIdA];
    });
  });

  // Position nodes based on their level and relationships
  let yOffset = startY;

  // Sort levels from root (0) to most dependent
  Object.keys(levelGroups)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach((level) => {
      const nodesAtLevel = levelGroups[level];

      // Position nodes at this level
      let xOffset = startX;
      let maxHeight = nodeHeight; // Track max height in this row for proper vertical spacing

      nodesAtLevel.forEach((nodeId) => {
        // Find the node in the current nodes array
        const nodeIndex = currentNodes.findIndex(
          (node: any) => node.id === nodeId,
        );
        if (nodeIndex !== -1) {
          // Add extra spacing based on relationship count
          const relationshipCount = relationshipCounts[nodeId] || 0;
          const extraSpace = relationshipCount * relationshipExtraSpacing;

          nodePositions[nodeId] = { x: xOffset, y: yOffset };

          // Calculate space needed for this node
          const nodeSpace = nodeWidth + horizontalSpacing + extraSpace;
          xOffset += nodeSpace;

          // Update max height if this node might be taller (based on column count)
          const node = currentNodes[nodeIndex];
          if (
            node.data &&
            typeof node.data === "object" &&
            "columns" in node.data
          ) {
            const columnCount = Array.isArray(node.data.columns)
              ? node.data.columns.length
              : 0;
            const estimatedHeight = Math.max(nodeHeight, 80 + columnCount * 20);
            maxHeight = Math.max(maxHeight, estimatedHeight);
          }
        }
      });

      // Move to next row with dynamic spacing based on the tallest node
      yOffset += maxHeight + verticalSpacing;
    });

  // Handle enum nodes separately - place them at the bottom with proper spacing
  const enumNodes = currentNodes.filter(
    (node: any) =>
      node.data &&
      typeof node.data === "object" &&
      "isEnum" in node.data &&
      node.data.isEnum === true,
  );

  if (enumNodes.length > 0) {
    let enumXOffset = startX;
    enumNodes.forEach((node: any) => {
      // Calculate extra space for enums based on values count
      let extraEnumSpace = 0;
      if (node.data && typeof node.data === "object" && "values" in node.data) {
        const valueCount = Array.isArray(node.data.values)
          ? node.data.values.length
          : 0;
        extraEnumSpace = valueCount * 10; // Add space based on enum value count
      }

      nodePositions[node.id] = { x: enumXOffset, y: yOffset };
      enumXOffset += nodeWidth + horizontalSpacing + extraEnumSpace;
    });
  }

  // Apply calculated positions to nodes
  const updatedNodes = currentNodes.map((node: any) => {
    return {
      ...node,
      position: nodePositions[node.id] || node.position,
    };
  });
  // Optimize layout by improving placement of related nodes
  updatedNodes.forEach((node: any) => {
    const nodeRel = relationshipMap[node.id];

    // If this node has exactly one source, try to center it under that source
    if (nodeRel && nodeRel.sources.length === 1) {
      const sourceId = nodeRel.sources[0];
      const sourceNode = updatedNodes.find((n: any) => n.id === sourceId);
      const sourcePosition = sourceNode?.position;

      if (sourcePosition && node.position) {
        // Center this node under its parent with some randomization for separation
        const jitter = Math.random() * 40 - 20; // Random offset between -20 and 20
        const centerX =
          sourcePosition.x + nodeWidth / 2 - nodeWidth / 2 + jitter;

        // Don't move too far from the assigned position
        const currentX = node.position.x;
        const newX = Math.max(startX, Math.min(centerX, currentX + 250));

        node.position.x = newX;
      }
    }

    // If node has multiple relationships, give it more space
    if (nodeRel && nodeRel.sources.length + nodeRel.targets.length > 3) {
      // These nodes need more breathing room
      const buffer = (nodeRel.sources.length + nodeRel.targets.length) * 10;
      if (node.position) {
        node.position.x += Math.random() * buffer - buffer / 2;
      }
    }
  });

  // Update nodes in store
  useStore.getState().setNodes(updatedNodes);

  // Fit view using the stored instance
  if (reactFlowInstance) {
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    }, 100);
  }
};
