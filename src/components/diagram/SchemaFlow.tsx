import React, { useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useShallow } from "zustand/react/shallow";
import ColorChooserNode from "@/components/editor/CustomNode";
import useStore from "@/components/editor/store";
import { AppState } from "./types";

// Node types
const nodeTypes = {
  colorChooser: ColorChooserNode,
  enumNode: ColorChooserNode,
};

// Store selector
const selector = (state: AppState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

interface SchemaFlowProps {
  onInstanceInit?: (instance: ReactFlowInstance) => void;
  isDarkMode?: boolean;
  isMounted?: boolean;
}

const SchemaFlow: React.FC<SchemaFlowProps> = ({
  onInstanceInit,
  isDarkMode = false,
  isMounted = true,
}) => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore(
    useShallow(selector),
  );

  // Default edge styling
  const edgeOptions = {
    style: {
      strokeWidth: 3,
      stroke: "#888",
    },
    animated: false,
    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
      color: "#888",
    },
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={edgeOptions}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInstanceInit}
      fitView
      minZoom={0.5}
      maxZoom={2}
      snapToGrid
      snapGrid={[15, 15]}
      className="h-full dark:bg-gray-900"
    >
      {/* Controls */}
      <Controls className="rounded-md border border-gray-300 bg-white p-2 shadow-md transition-all duration-200 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 [&>*]:bg-transparent [&>*]:dark:bg-gray-800 [&>*]:dark:text-gray-300" />

      {/* MiniMap */}
      {/* <MiniMap
        nodeStrokeWidth={3}
        zoomable
        pannable
        className="rounded-md border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
      /> */}

      {/* Background */}
      <Background
        color={isMounted ? (isDarkMode ? "#1B1B1F" : "#1E1E22") : "#1B1B1F"}
        variant={BackgroundVariant.Dots}
        gap={16}
        size={1}
        className="dark:bg-[#1B1B1F]"
      />
    </ReactFlow>
  );
};

export default SchemaFlow;
