import React, { useEffect, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  ReactFlowInstance,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import ColorChooserNode from "./CustomNode";
import "@xyflow/react/dist/style.css";
import { useShallow } from "zustand/react/shallow";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Editor } from "@monaco-editor/react";
import { parseDrizzleSchemaFromCode } from "@/components/Parser/Drizzle-metadata-parser";
import useStore from "./store";
import Header from "@/components/layout/Header";
import { AppState } from "./types";
const nodeTypes = {
  colorChooser: ColorChooserNode,
  enumNode: ColorChooserNode,
};

interface RelationshipNode {
  sources: string[];
  targets: string[];
  level: number;
}

interface NodePositions {
  [nodeId: string]: { x: number; y: number };
}

interface LevelGroups {
  [level: string]: string[];
}

const selector = (state: AppState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  code: state.code,
  setCode: state.setCode,
});
export default function DrizzleEditor() {
  // Wrap the entire component with ReactFlowProvider
  return (
    <ReactFlowProvider>
      <Header />
      <DrizzleEditorContent />
    </ReactFlowProvider>
  );
}

function DrizzleEditorContent() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    code,
    setCode,
  } = useStore(useShallow(selector));

  const [initialCode] = useState<string>(`
    import { pgTable, serial, text, varchar, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
    // Create enum for user roles
    export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'guest']);
    // Define users table
    export const users = pgTable('users', {
      id: serial('id').primaryKey(),
      name: text('name').notNull(),
      email: varchar('email', { length: 255 }).notNull().unique(),
      password: varchar('password', { length: 255 }).notNull(),
      role: userRoleEnum('role').notNull().default('user'),
      createdAt: timestamp('created_at').notNull().defaultNow()
    });
    // Define posts table
    export const posts = pgTable('posts', {
      id: serial('id').primaryKey(),
      title: varchar('title', { length: 255 }).notNull(),
      content: text('content'),
      published: boolean('published').notNull().default(false),
      authorId: integer('author_id').references(() => users.id),
      createdAt: timestamp('created_at').notNull().defaultNow()
    });
    // Define comments table
    export const comments = pgTable('comments', {
      id: serial('id').primaryKey(),
      content: text('content').notNull(),
      postId: integer('post_id').references(() => posts.id),
      userId: integer('user_id').references(() => users.id),
      createdAt: timestamp('created_at').notNull().defaultNow()
    });
  `);

  // To track if the code update was triggered by a node update
  const [isUpdatingFromNode, setIsUpdatingFromNode] = useState(false);

  // To track if the node update was triggered by a code update
  const [isUpdatingFromCode, setIsUpdatingFromCode] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");

  // Add this function to handle creating a new table
  const handleCreateNewTable = () => {
    if (!newTableName.trim()) return;

    // Create a new table template with the provided name
    const newTableCode = `
// Define ${newTableName} table
export const ${newTableName} = pgTable('${newTableName}', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()});

`;
    const updatedCode = code + newTableCode;
    setCode(updatedCode);

    // Close the dialog and reset the input
    setIsDialogOpen(false);
    setNewTableName("");
  };
  // Update your performAutoLayout function to use the stored reactFlowInstance
  const performAutoLayout = () => {
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
            (node) => node.id === nodeId,
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
              const estimatedHeight = Math.max(
                nodeHeight,
                80 + columnCount * 20,
              );
              maxHeight = Math.max(maxHeight, estimatedHeight);
            }
          }
        });

        // Move to next row with dynamic spacing based on the tallest node
        yOffset += maxHeight + verticalSpacing;
      });

    // Handle enum nodes separately - place them at the bottom with proper spacing
    const enumNodes = currentNodes.filter(
      (node) =>
        node.data &&
        typeof node.data === "object" &&
        "isEnum" in node.data &&
        node.data.isEnum === true,
    );

    if (enumNodes.length > 0) {
      let enumXOffset = startX;
      enumNodes.forEach((node) => {
        // Calculate extra space for enums based on values count
        let extraEnumSpace = 0;
        if (
          node.data &&
          typeof node.data === "object" &&
          "values" in node.data
        ) {
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
    const updatedNodes = currentNodes.map((node) => {
      return {
        ...node,
        position: nodePositions[node.id] || node.position,
      };
    });

    // Optimize layout by improving placement of related nodes
    updatedNodes.forEach((node) => {
      const nodeRel = relationshipMap[node.id];

      // If this node has exactly one source, try to center it under that source
      if (nodeRel && nodeRel.sources.length === 1) {
        const sourceId = nodeRel.sources[0];
        const sourceNode = updatedNodes.find((n) => n.id === sourceId);
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
  // Initialize code on component mount
  useEffect(() => {
    if (!code) {
      setCode(initialCode);
    }
  }, [initialCode, code, setCode]);

  // Override the updateCodeFromNodes function
  useEffect(() => {
    const originalUpdateCodeFromNodes = useStore.getState().updateCodeFromNodes;

    useStore.setState({
      updateCodeFromNodes: () => {
        setIsUpdatingFromNode(true);
        originalUpdateCodeFromNodes();
      },
    });

    return () => {
      // Restore original function on unmount
      useStore.setState({
        updateCodeFromNodes: originalUpdateCodeFromNodes,
      });
    };
  }, []);

  // When code changes due to node updates, don't re-parse nodes
  useEffect(() => {
    if (isUpdatingFromNode) {
      // Reset flag but don't re-parse
      setIsUpdatingFromNode(false);
      return;
    }

    if (code) {
      try {
        setIsUpdatingFromCode(true);
        parseAndUpdateDiagram(code);
      } catch (error) {
        console.error("Error parsing the Schema:", error);
      } finally {
        setIsUpdatingFromCode(false);
      }
    }
  }, [code]);

  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode) {
      setCode(newCode);
      // The useEffect above will handle parsing
    }
  };

  const parseAndUpdateDiagram = (codeToProcess: string) => {
    const drizzleSchema = parseDrizzleSchemaFromCode(codeToProcess);
    console.log("Parsed schema:", drizzleSchema); // Debug your schema
    console.log("Processing enums:", drizzleSchema.enums);
    // First, map table names to node IDs
    const tableNameToNodeId: { [key: string]: string } =
      drizzleSchema.tables.reduce(
        (acc, table, index) => {
          acc[table.name] = `table-${index}`;
          return acc;
        },
        {} as { [key: string]: string },
      );

    // Create a map of existing nodes to preserve their data
    const existingNodesMap = nodes.reduce(
      (acc, node) => {
        acc[node.id] = node;
        return acc;
      },
      {} as Record<string, any>,
    );

    // Create nodes for tables
    const tableNodes = drizzleSchema.tables.map((table, index) => {
      const nodeId = `table-${index}`;
      const existingNode = existingNodesMap[nodeId];

      const hasRelation = drizzleSchema.relations.some(
        (relation) =>
          relation.fromTable === table.name || relation.toTable === table.name,
      );

      return {
        id: nodeId,
        type: "colorChooser",
        position: existingNode
          ? existingNode.position
          : { x: 100 + index * 250, y: 100 },
        data: {
          id: index,
          label: table.name,
          columns: table.columns.map((col) => {
            let columnDefText = `${col.type}`;
            if (col.isPrimaryKey) columnDefText += ".primaryKey()";
            if (!col.isNullable) columnDefText += ".notNull()";
            if (col.isUnique) columnDefText += ".unique()";
            if (col.defaultValue !== undefined) {
              columnDefText += `.default(${col.defaultValue})`;
            }
            return `${col.name} ${columnDefText}`;
          }),
          hasRelation: hasRelation,
          isEnum: false,
        },
      };
    });

    // Create nodes for enums
    const enumNodes = drizzleSchema.enums.map((enumType, index) => {
      const nodeId = `enum-${index}`;
      const existingNode = existingNodesMap[nodeId];

      return {
        id: nodeId,
        type: "enumNode",
        position: existingNode
          ? existingNode.position
          : { x: 100 + index * 250, y: 350 }, // Position enums below tables
        data: {
          id: drizzleSchema.tables.length + index,
          label: enumType.name,
          values: enumType.values,
          isEnum: true,
        },
      };
    });

    // Combine nodes
    const allNodes = [...tableNodes, ...enumNodes];
    console.log("All nodes:", allNodes); // Debug your nodes

    // Parse Relations (Edges)
    const parsedEdges = drizzleSchema.relations.map((relation) => ({
      id: `${relation.fromTable}-${relation.toTable}`,
      source: tableNameToNodeId[relation.fromTable],
      target: tableNameToNodeId[relation.toTable],
      type: "smoothstep",
      animated: true,
      label: `${relation.fromColumn} → ${relation.toColumn}`,
    }));

    setNodes(allNodes);
    setEdges(parsedEdges);
  };
  // Parse initial code on mount
  useEffect(() => {
    if (code) {
      try {
        parseAndUpdateDiagram(code);
      } catch (error) {
        console.error("Error parsing initial schema:", error);
      }
    }
  }, [code, setNodes, setEdges]);

  return (
    <PanelGroup direction="horizontal">
      {/* Left Panel - Code Editor */}
      <Panel defaultSize={50} minSize={30}>
        <Editor
          height="100vh"
          language="typescript"
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </Panel>
      <PanelResizeHandle style={{ width: "20px", backgroundColor: "black" }} />
      {/* Right Panel - ReactFlow */}
      <Panel defaultSize={50} minSize={30}>
        <div style={{ width: "100%", height: "100vh", position: "relative" }}>
          {/* Absolute-positioned button */}
          <button
            onClick={() => setIsDialogOpen(true)}
            style={{
              position: "absolute",
              top: "10px",
              right: "150px",
              zIndex: 10,
              backgroundColor: "#2196F3", // Blue color
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            Add Table
          </button>
          <button
            onClick={() => {
              performAutoLayout();
              if (reactFlowInstance) {
                setTimeout(() => {
                  reactFlowInstance.fitView({ padding: 0.2 });
                }, 100);
              }
            }}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 10, // Ensures it's above ReactFlow
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            Auto Layout
          </button>

          {/* ReactFlow Component */}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onInit={setReactFlowInstance}
            fitView
            minZoom={0.5}
            maxZoom={2}
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Controls />
            <MiniMap
              nodeStrokeColor={(n) =>
                n.type === "colorChooser" ? "#0041d0" : "#000"
              }
              nodeColor={(n) =>
                n.type === "colorChooser" ? "#e6f2ff" : "#fff"
              }
            />
            <Background color="#1c1c1c" variant={BackgroundVariant.Dots} />
          </ReactFlow>
        </div>
      </Panel>{" "}
      {/* Add Dialog Component */}
      {isDialogOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "20px",
              width: "400px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ margin: "0 0 20px 0" }}>Create New Table</h2>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Table Name:
              </label>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
                placeholder="Enter table name"
                autoFocus
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setIsDialogOpen(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f5f5f5",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewTable}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelGroup>
  );
}

// import React, { useState, useEffect } from "react";
// import Split from "react-split";
// import { useEffect , useState } from "react";
// import { Editor } from "@monaco-editor/react";
// import ReactFlow, {
//   MiniMap,
//   Controls, import
//   ReactFlowProvider,
//   Node,
//   Edge,
//   NodeTypes,
//   NodeProps,
//   useNodesState,
//   useEdgesState,
//   NodeChange,
//   EdgeChange
// } from "reactflow";
// import "reactflow/dist/style.css";
// import { parseDrizzleSchemaFromCode } from "@/components/Parser/Drizzle-metadata-parser";

// // Re-define the interfaces to match your parser's output
// interface Column {
//   name: string;
//   type: string;
//   isNullable: boolean;
//   defaultValue?: string | number | boolean | null;
// }

// interface Table {
//   name: string;
//   columns: Column[];
// }

// interface Relation {
//   fromTable: string;
//   fromColumn: string;
//   toTable: string;
//   type: "ONE_TO_MANY" | "ONE_TO_ONE";
// }

// interface EnumType {
//   name: string;
//   values: string[];
// }

// interface DrizzleSchema {
//   tables: Table[];
//   relations: Relation[];
//   enums: EnumType[];
// }

// // Node data interface
// interface NodeData {
//   label: string;
//   columns: Column[];
//   type: "table" | "enum";
//   values?: string[];
// }

// // Custom Node component with proper typing
// const TableNode: React.FC<NodeProps<NodeData>> = ({ data }) => (
//   <div
//     style={{
//       padding: "10px",
//       backgroundColor: "#f0f0f0",
//       borderRadius: "6px",
//       border: "2px solid #007bff",
//       minWidth: "180px",
//       boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
//       color: "#333",
//     }}
//   >
//     <strong style={{ fontSize: "16px", display: "block", marginBottom: "8px" }}>{data.label}</strong>
//     <div>
//       {data.columns.map((col, index) => (
//         <div key={index} style={{ marginTop: "8px", borderTop: "1px solid #ddd", paddingTop: "4px" }}>
//           <div><strong>{col.name}</strong> : {col.type}</div>
//           {col.isNullable && <div><em>Nullable</em></div>}
//           {col.defaultValue && <div>Default: {String(col.defaultValue)}</div>}
//         </div>
//       ))}
//     </div>
//   </div>
// );

// // Enum Node component
// const EnumNode: React.FC<NodeProps<NodeData>> = ({ data }) => (
//   <div
//     style={{
//       padding: "10px",
//       backgroundColor: "#f0f8ff",
//       borderRadius: "6px",
//       border: "2px solid #8a2be2",
//       minWidth: "180px",
//       boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
//       color: "#333",
//     }}
//   >
//     <strong style={{ fontSize: "16px", display: "block", marginBottom: "8px" }}>
//       {data.label} (Enum)
//     </strong>
//     <div>
//       {data.values?.map((value, index) => (
//         <div key={index} style={{ marginTop: "4px" }}>
//           • {value}
//         </div>
//       ))}
//     </div>
//   </div>
// );

// // Define node types
// const nodeTypes: NodeTypes = {
//   tableNode: TableNode,
//   enumNode: EnumNode
// };

// const FlowWithProvider: React.FC = () => {
//   const [code, setCode] = useState<string>(`
// import { pgTable, serial, text, varchar, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// // Create enum for user roles
// export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'guest']);

// // Define users table
// export const users = pgTable('users', {
//   id: serial('id').primaryKey(),
//   name: text('name').notNull(),
//   email: varchar('email', { length: 255 }).notNull().unique(),
//   password: varchar('password', { length: 255 }).notNull(),
//   role: userRoleEnum('role').notNull().default('user'),
//   createdAt: timestamp('created_at').notNull().defaultNow()
// });

// // Define posts table
// export const posts = pgTable('posts', {
//   id: serial('id').primaryKey(),
//   title: varchar('title', { length: 255 }).notNull(),
//   content: text('content'),
//   published: boolean('published').notNull().default(false),
//   authorId: integer('author_id').references(() => users.id),
//   createdAt: timestamp('created_at').notNull().defaultNow()
// });

// // Define comments table
// export const comments = pgTable('comments', {
//   id: serial('id').primaryKey(),
//   content: text('content').notNull(),
//   postId: integer('post_id').references(() => posts.id),
//   userId: integer('user_id').references(() => users.id),
//   createdAt: timestamp('created_at').notNull().defaultNow()
// });
// `);

//   // Fix the type definitions for nodes and edges
//   const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>[]>([]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

//   const handleCodeChange = (newCode: string | undefined) => {
//     setCode(newCode || "");
//   };

//   useEffect(() => {
//     try {
//       const drizzleSchema = parseDrizzleSchemaFromCode(code);
//       console.log("Drizzle Schema", drizzleSchema);

//       // Create nodes for tables
//       const tableNodes: Node<NodeData>[] = drizzleSchema.tables.map((table, index) => {
//         const xPos = (index % 3) * 300 + 50;
//         const yPos = Math.floor(index / 3) * 300 + 50;

//         return {
//           id: table.name,
//           position: { x: xPos, y: yPos },
//           data: {
//             label: table.name,
//             columns: table.columns,
//             type: "table"
//           },
//           type: "tableNode",
//         };
//       });

//       // Create nodes for enums
//       const enumNodes: Node<NodeData>[] = drizzleSchema.enums.map((enumType, index) => {
//         return {
//           id: `enum-${enumType.name}`,
//           position: { x: index * 200 + 500, y: 50 },
//           data: {
//             label: enumType.name,
//             columns: [],
//             type: "enum",
//             values: enumType.values
//           },
//           type: "enumNode",
//         };
//       });

//       // Combine all nodes
//       const allNodes: Node<NodeData>[] = [...tableNodes, ...enumNodes];

//       // Create edges for relations
//       const relationEdges: Edge[] = drizzleSchema.relations.map((relation, index) => {
//         return {
//           id: `edge-${index}`,
//           source: relation.fromTable,
//           target: relation.toTable,
//           label: relation.type,
//           animated: true,
//           style: { stroke: '#007bff' },
//           labelStyle: { fill: '#000', fontWeight: 700 },
//           labelBgStyle: { fill: '#fff', fillOpacity: 0.7 }
//         };
//       });

//       setEdges(relationEdges);
//     } catch (error) {
//       console.error("Error parsing schema:", error);
//     }
//   }, [code, setNodes, setEdges]);

//   return (
//     <div className="h-screen flex">
//       <Split className="split" minSize={300} sizes={[50, 50]}>
//         <div className="editor-pane flex flex-col w-full">
//           <Editor
//             height="100vh"
//             language="typescript"
//             theme="vs-dark"
//             value={code}
//             onChange={handleCodeChange}
//             options={{ minimap: { enabled: false } }}
//           />
//         </div>

//         <div className="flow-pane flex flex-col w-full" style={{ height: "100vh" }}>
//           <ReactFlow
//             nodes={nodes}
//             edges={edges}
//             onNodesChange={onNodesChange}
//             onEdgesChange={onEdgesChange}
//             nodeTypes={nodeTypes}
//             fitView
//           >
//             <MiniMap />
//             <Controls />
//           </ReactFlow>
//         </div>
//       </Split>
//     </div>
//   );
// };

// const DrizzleEditor: React.FC = () => {
//   return (
//     <ReactFlowProvider>
//       <FlowWithProvider />
//     </ReactFlowProvider>
//   );
// };

// export default DrizzleEditor;

//
//yha se
//  import React, { useEffect, useState } from "react";
// import {
//   ReactFlow,
//   ReactFlowProvider,
//   useNodesState,
//   useEdgesState,
//   addEdge,
//   MiniMap,
//   Controls,
//   Background,
//   BackgroundVariant,
// } from "@xyflow/react";
// import ColorChooserNode from "./CustomNode";
// import "@xyflow/react/dist/style.css";
// import { useShallow } from "zustand/react/shallow";
// import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
// import { Editor } from "@monaco-editor/react";
// import { parseDrizzleSchemaFromCode } from "@/components/Parser/Drizzle-metadata-parser";
// import useStore from "./store";
// import Header from "@/components/layout/Header";
// const nodeTypes = { colorChooser: ColorChooserNode };

// const selector = (state: {
//   nodes: any;
//   edges: any;
//   onNodesChange: any;
//   onEdgesChange: any;
//   onConnect: any;
//   setNodes: any;
//   setEdges: any;
// }) => ({
//   nodes: state.nodes,
//   edges: state.edges,
//   onNodesChange: state.onNodesChange,
//   onEdgesChange: state.onEdgesChange,
//   onConnect: state.onConnect,
//   setNodes: state.setNodes,
//   setEdges: state.setEdges,
// });

// export default function DrizzleEditor() {
//   // Wrap the entire component with ReactFlowProvider
//   return (
//     <ReactFlowProvider>
//       <Header />
//       <DrizzleEditorContent />
//     </ReactFlowProvider>
//   );
// }

// function DrizzleEditorContent() {
//   const {
//     nodes,
//     edges,
//     onNodesChange,
//     onEdgesChange,
//     onConnect,
//     setNodes,
//     setEdges,
//   } = useStore(useShallow(selector));

//   const [code, setCode] = useState<string>(`
//     import { pgTable, serial, text, varchar, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
//     // Create enum for user roles
//     export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'guest']);
//     // Define users table
//     export const users = pgTable('users', {
//       id: serial('id').primaryKey(),
//       name: text('name').notNull(),
//       email: varchar('email', { length: 255 }).notNull().unique(),
//       password: varchar('password', { length: 255 }).notNull(),
//       role: userRoleEnum('role').notNull().default('user'),
//       createdAt: timestamp('created_at').notNull().defaultNow()
//     });
//     // Define posts table
//     export const posts = pgTable('posts', {
//       id: serial('id').primaryKey(),
//       title: varchar('title', { length: 255 }).notNull(),
//       content: text('content'),
//       published: boolean('published').notNull().default(false),
//       authorId: integer('author_id').references(() => users.id),
//       createdAt: timestamp('created_at').notNull().defaultNow()
//     });
//     // Define comments table
//     export const comments = pgTable('comments', {
//       id: serial('id').primaryKey(),
//       content: text('content').notNull(),
//       postId: integer('post_id').references(() => posts.id),
//       userId: integer('user_id').references(() => users.id),
//       createdAt: timestamp('created_at').notNull().defaultNow()
//     });
//   `);

//   const handleCodeChange = (newCode: string | undefined) => {
//     setCode(newCode || "");
//   };

//   useEffect(() => {
//     try {
//       const drizzleSchema = parseDrizzleSchemaFromCode(code);

//       // Explicitly type the tableNameToNodeId object as a dictionary
//       const tableNameToNodeId: { [key: string]: string } =
//         drizzleSchema.tables.reduce(
//           (acc, table, index) => {
//             acc[table.name] = `${index + 1}`; // Table name -> Node ID
//             return acc;
//           },
//           {} as { [key: string]: string },
//         );

//       // Parse Nodes (Tables)
//       const parsedNodes = drizzleSchema.tables.map((table, index) => ({
//         id: `${index + 1}`,
//         type: "colorChooser", // Your custom node type
//         data: {
//           id: index + 1,
//           label: table.name,
//           columns: table.columns.map(
//             (col: { name: string; type: string }) => `${col.name}  ${col.type}`,
//           ),
//           hasRelation: drizzleSchema.relations.some(
//             (relation) =>
//               relation.fromTable === table.name ||
//               relation.toTable === table.name,
//           ),
//         },
//         position: { x: 100 + index * 200, y: 100 }, // Adjust positions dynamically
//       }));

//       console.log("Parsed Nodes:", parsedNodes);
//       setNodes(parsedNodes); // Update Zustand store or component state

//       // Parse Relations (Edges)
//       const parsedEdges = drizzleSchema.relations.map((relation) => ({
//         id: `${relation.fromTable}-${relation.toTable}`, // Edge ID based on the relation
//         source: tableNameToNodeId[relation.fromTable], // From table mapped to node ID
//         target: tableNameToNodeId[relation.toTable], // To table mapped to node ID
//         type: "smoothstep", // Edge type (you can customize)
//         animated: true, // Optional: make the edge animated
//       }));

//       console.log("Parsed Edges:", parsedEdges);
//       setEdges(parsedEdges); // Update Zustand store or component state
//     } catch (error) {
//       console.error("Error parsing the Schema :", error);
//     }
//   }, [code, setNodes, setEdges]);

//   return (
//     <PanelGroup direction="horizontal">
//       <Panel defaultSize={30} minSize={20}>
//         <Editor
//           height="100vh"
//           language="typescript"
//           theme="vs-dark"
//           value={code}
//           onChange={handleCodeChange}
//           options={{ minimap: { enabled: false } }}
//         />
//       </Panel>
//       <PanelResizeHandle />
//       <Panel defaultSize={30} minSize={20}>
//         <div style={{ width: "100vh", height: "100vh" }}>
//           <ReactFlow
//             nodes={nodes}
//             edges={edges}
//             onNodesChange={onNodesChange}
//             onEdgesChange={onEdgesChange}
//             onConnect={onConnect}
//             nodeTypes={nodeTypes} // Add the nodeTypes prop here
//             fitView
//           >
//             <Controls />
//             <MiniMap />
//             <Background color="#1c1c1c" variant={BackgroundVariant.Dots} />
//           </ReactFlow>
//         </div>
//       </Panel>
//     </PanelGroup>
//   );
// }
