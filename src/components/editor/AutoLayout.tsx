import { useCallback } from "react";
import { ReactFlowInstance } from "@xyflow/react";
import useStore from "./store";

interface AutoLayoutProps {
  reactFlowInstance: ReactFlowInstance | null;
}

const AutoLayout = ({ reactFlowInstance }: AutoLayoutProps) => {
  const performAutoLayout = useCallback(() => {
    // Get the current nodes and edges from the store
    const currentNodes = useStore.getState().nodes;
    const currentEdges = useStore.getState().edges;

    // Define spacing parameters
    const nodeWidth = 220;
    const nodeHeight = 140;
    const horizontalSpacing = 220;
    const verticalSpacing = 300;
    const startX = 80;
    const startY = 80;

    // Create position map for nodes
    const nodePositions: { [nodeId: string]: { x: number; y: number } } = {};

    // Create relationship map to understand connections
    const relationshipMap: {
      [nodeId: string]: {
        sources: string[];
        targets: string[];
        level: number;
      };
    } = {};

    // Initialize relationship map
    currentNodes.forEach((node) => {
      relationshipMap[node.id] = {
        sources: [],
        targets: [],
        level: 0,
      };
    });

    // Populate relationship map from edges
    currentEdges.forEach((edge) => {
      if (edge.source && edge.target) {
        if (!relationshipMap[edge.source].targets.includes(edge.target)) {
          relationshipMap[edge.source].targets.push(edge.target);
        }
        if (!relationshipMap[edge.target].sources.includes(edge.source)) {
          relationshipMap[edge.target].sources.push(edge.source);
        }
      }
    });

    // Assign levels to nodes based on relationships
    let changed = true;
    while (changed) {
      changed = false;
      Object.keys(relationshipMap).forEach((nodeId) => {
        const node = relationshipMap[nodeId];
        if (node.sources.length > 0) {
          const sourceLevels = node.sources.map(
            (sourceId) => relationshipMap[sourceId]?.level || 0,
          );
          const maxSourceLevel = Math.max(...sourceLevels, -1);
          if (node.level <= maxSourceLevel) {
            node.level = maxSourceLevel + 1;
            changed = true;
          }
        }
      });
    }

    // Group nodes by level
    const levelGroups: { [level: string]: string[] } = {};
    Object.keys(relationshipMap).forEach((nodeId) => {
      const level = relationshipMap[nodeId].level.toString();
      if (!levelGroups[level]) {
        levelGroups[level] = [];
      }
      levelGroups[level].push(nodeId);
    });

    // Position nodes by level
    let yOffset = startY;
    Object.keys(levelGroups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach((level) => {
        const nodesAtLevel = levelGroups[level];
        let xOffset = startX;

        nodesAtLevel.forEach((nodeId) => {
          // Record position
          nodePositions[nodeId] = { x: xOffset, y: yOffset };
          xOffset += nodeWidth + horizontalSpacing;
        });

        yOffset += nodeHeight + verticalSpacing;
      });

    // Handle enum nodes separately
    const enumNodes = currentNodes.filter(
      (node) => node.data && node.data.isEnum === true,
    );

    if (enumNodes.length > 0) {
      let enumXOffset = startX;
      enumNodes.forEach((node) => {
        nodePositions[node.id] = { x: enumXOffset, y: yOffset };
        enumXOffset += nodeWidth + horizontalSpacing;
      });
    }

    // Apply positions to nodes
    const updatedNodes = currentNodes.map((node) => {
      return {
        ...node,
        position: nodePositions[node.id] || node.position,
      };
    });

    // Update nodes in store
    useStore.getState().setNodes(updatedNodes);

    // Fit view
    if (reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 100);
    }
  }, [reactFlowInstance]);

  return (
    <button
      onClick={performAutoLayout}
      className="rounded border-gray-300 bg-green-600 px-3 py-1 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-500 dark:border-gray-700 dark:bg-green-700 dark:hover:bg-green-600"
    >
      Auto Layout
    </button>
  );
};

export default AutoLayout;
