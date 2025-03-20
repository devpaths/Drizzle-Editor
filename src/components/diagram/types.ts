import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  XYPosition,
} from "@xyflow/react";

// Node types
export interface ColorNodeData {
  id: number;
  label: string;
  color?: string;

  columns: string[];
  hasRelation: boolean;
  [key: string]: unknown; // Add index signature to satisfy Record<string, unknown>
}

export type ColorNode = Node<ColorNodeData>;

export type AppNode = ColorNode;

// State types
export interface AppState {
  nodes: AppNode[];
  edges: Edge[];
  code: string;
  isEnum?: boolean;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setCode: (code: string) => void;
  // updateNodeColor: (nodeId: string, color: string) => void;
  updateNode: (nodeId: string, data: any) => void;
  updateCodeFromNodes: () => void;
  syncMonacoWithNodes: () => void;
  monacoJson: string;
  updateNodeData: (nodeId: any, data: any) => void;
}
