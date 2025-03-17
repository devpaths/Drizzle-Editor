import React, { useEffect, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
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
const nodeTypes = { colorChooser: ColorChooserNode };

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

    // Map table names to node IDs
    const tableNameToNodeId: { [key: string]: string } =
      drizzleSchema.tables.reduce(
        (acc, table, index) => {
          acc[table.name] = `${index + 1}`;
          console.log(`Step ${index + 1}:`, JSON.stringify(acc, null, 2));

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

    const parsedNodes = drizzleSchema.tables.map((table, index) => {
      const nodeId = `${index + 1}`;
      const existingNode = existingNodesMap[nodeId];

      // Calculate the hasRelation property based on the schema
      const hasRelation = drizzleSchema.relations.some(
        (relation) =>
          relation.fromTable === table.name || relation.toTable === table.name,
      );
      console.log("OYY", hasRelation);
      console.log("DrizzleSchema", drizzleSchema);

      // Create the new node data
      const data = {
        id: index + 1,
        label: table.name,
        columns: table.columns.map(
          (col: {
            name: string;
            type: string;
            isPrimaryKey: boolean;
            isNullable: boolean;
            isUnique: boolean;
            defaultValue?: any;
          }) => {
            let columnDefText = `${col.type}`;
            if (col.isPrimaryKey) columnDefText += ".primaryKey()";
            if (!col.isNullable) columnDefText += ".notNull()";
            if (col.isUnique) columnDefText += ".unique()";
            if (col.defaultValue !== undefined) {
              columnDefText += `.default(${col.defaultValue})`;
            }
            return `${col.name} ${columnDefText}`;
          },
        ),
        hasRelation: hasRelation,
      };

      console.log("Generated Node Data:", data);

      return {
        id: nodeId,
        type: "colorChooser",
        position: existingNode
          ? existingNode.position
          : { x: 100 + index * 250, y: 100 },
        data,
      };
    });

    // Parse Relations (Edges)
    const parsedEdges = drizzleSchema.relations.map((relation) => ({
      id: `${relation.fromTable}-${relation.toTable}`,
      source: tableNameToNodeId[relation.fromTable],
      target: tableNameToNodeId[relation.toTable],
      type: "smoothstep",
      animated: true,
      label: `${relation.fromColumn} → ${relation.toColumn}`,
    }));

    console.log(
      "Parsed Edges IDs:",
      parsedEdges.map((edge) => edge.id),
    );

    setNodes(parsedNodes);
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
      <PanelResizeHandle />
      <Panel defaultSize={50} minSize={30}>
        <div style={{ width: "100%", height: "100vh" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.5}
            maxZoom={2}
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Controls />
            <MiniMap
              nodeStrokeColor={(n) => {
                if (n.type === "colorChooser") return "#0041d0";
                return "#000";
              }}
              nodeColor={(n) => {
                if (n.type === "colorChooser") return "#e6f2ff";
                return "#fff";
              }}
            />
            <Background color="#1c1c1c" variant={BackgroundVariant.Dots} />
          </ReactFlow>
        </div>
      </Panel>
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
