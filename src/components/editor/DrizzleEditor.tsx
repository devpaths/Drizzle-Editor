import React, { useEffect, useState } from "react";
import { ReactFlowProvider, ReactFlowInstance } from "@xyflow/react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useTheme } from "./useTheme";
import useStore from "./store";
import Header from "@/components/layout/Header";
import { AppState } from "./types";
import { useShallow } from "zustand/react/shallow";

// Import original components - keeping original paths intact
import SchemaFlow from "@/components/diagram/SchemaFlow";
// Import new components
import MonacoEditorComponent from "@/components/editor/CodeEditor";
import { ActionButtons } from "@/components/editor/ActionButton";
import AddTableDialog from "@/components/editor/TableDialog";

// Import the utility function
import { parseAndUpdateDiagram } from "@/components/editor/ParseAndUpdateDiagram";

// Define the state selector for our store
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
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Header />
        <div style={{ flex: 1, overflow: "hidden" }}>
          <DrizzleEditorContent />
        </div>
      </div>
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
  const { isDarkMode, isMounted } = useTheme();

  // State for the dialog and new table name
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");

  // Track if we're updating from node or code changes
  const [isUpdatingFromNode, setIsUpdatingFromNode] = useState(false);
  const [isUpdatingFromCode, setIsUpdatingFromCode] = useState(false);

  // Track ReactFlow instance
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Initial code template
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

  // Handle creating a new table
  const handleCreateNewTable = () => {
    if (!newTableName.trim()) return;

    // Create a new table template with the provided name
    const newTableCode = `
// Define ${newTableName} table
export const ${newTableName} = pgTable('${newTableName}', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

`;
    const updatedCode = code + newTableCode;
    setCode(updatedCode);

    // Close the dialog and reset the input
    setIsDialogOpen(false);
    setNewTableName("");
  };

  // Handle code changes
  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode) {
      setCode(newCode);
    }
  };

  // Initialize code on mount
  useEffect(() => {
    if (!code) {
      setCode(initialCode);
    }
  }, [initialCode, code, setCode]);

  // Update code from nodes
  useEffect(() => {
    const originalUpdateCodeFromNodes = useStore.getState().updateCodeFromNodes;

    useStore.setState({
      updateCodeFromNodes: () => {
        setIsUpdatingFromNode(true);
        originalUpdateCodeFromNodes();
      },
    });

    return () => {
      useStore.setState({
        updateCodeFromNodes: originalUpdateCodeFromNodes,
      });
    };
  }, []);

  // Parse code when it changes (but not from node updates)
  useEffect(() => {
    if (isUpdatingFromNode) {
      setIsUpdatingFromNode(false);
      return;
    }

    if (code) {
      try {
        setIsUpdatingFromCode(true);
        parseAndUpdateDiagram(code, nodes, setNodes, setEdges);
      } catch (error) {
        console.error("Error parsing the Schema:", error);
      } finally {
        setIsUpdatingFromCode(false);
      }
    }
  }, [code]);

  // Parse initial code on mount
  useEffect(() => {
    if (code) {
      try {
        parseAndUpdateDiagram(code, nodes, setNodes, setEdges);
      } catch (error) {
        console.error("Error parsing initial schema:", error);
      }
    }
  }, []);

  // Handle when reactFlowInstance is available
  const onInstanceInit = (instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left Panel - Code Editor */}
      <ResizablePanel defaultSize={50} minSize={30}>
        <MonacoEditorComponent
          code={code}
          onChange={handleCodeChange}
          isDarkMode={isDarkMode}
          isMounted={isMounted}
        />
      </ResizablePanel>

      <ResizableHandle className="relative flex w-3 items-center justify-center bg-border transition-all hover:w-4 dark:bg-gray-800">
        <div className="absolute flex h-12 w-6 items-center justify-center rounded-full bg-gray-200 shadow-md dark:bg-gray-700">
          <div className="select-none text-gray-500 dark:text-gray-300">⋮</div>
        </div>
      </ResizableHandle>

      {/* Right Panel - ReactFlow */}
      <ResizablePanel defaultSize={50} minSize={30} className="relative">
        {/* Action Buttons */}
        <ActionButtons
          reactFlowInstance={reactFlowInstance}
          onAddTableClick={() => setIsDialogOpen(true)}
        />

        {/* SchemaFlow Component - Using original import path */}
        <div className="h-full w-full">
          <SchemaFlow
            onInstanceInit={onInstanceInit}
            isDarkMode={isDarkMode}
            isMounted={isMounted}
          />
        </div>
      </ResizablePanel>

      {/* Add Table Dialog */}
      <AddTableDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        tableName={newTableName}
        onTableNameChange={(e) => setNewTableName(e.target.value)}
        onCreateTable={handleCreateNewTable}
      />
    </ResizablePanelGroup>
  );
}
