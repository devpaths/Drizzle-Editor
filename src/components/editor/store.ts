import { create } from "zustand";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node as NodeBase,
} from "@xyflow/react";
import { Project, Node, SyntaxKind, SourceFile } from "ts-morph";

import { initialNodes } from "./nodes/nodes";
import { initialEdges } from "./edges/edges";
import { type AppNode, type AppState, type ColorNode } from "./types";

function isColorChooserNode(node: AppNode): node is ColorNode {
  return node.type === "colorChooser";
}

function parseColumnString(colString: string) {
  const match = colString.match(/^([a-zA-Z0-9_]+)\s+(.+)$/);
  return match
    ? { name: match[1], definition: match[2] }
    : { name: "", definition: colString };
}

function cleanColumnDefinition(definition: string): string {
  const baseTypeMatch = definition.match(/^([^\.]+)/);
  if (!baseTypeMatch) return definition;

  const baseType = baseTypeMatch[1].trim();
  const modifiers = new Set<string>();

  if (definition.includes(".primaryKey()")) modifiers.add(".primaryKey()");
  if (definition.includes(".notNull()")) modifiers.add(".notNull()");
  if (definition.includes(".unique()")) modifiers.add(".unique()");

  const defaultMatch = definition.match(/\.default\(([^)]+)\)/);
  const defaultModifier = defaultMatch ? `.default(${defaultMatch[1]})` : "";

  return [baseType, ...modifiers, defaultModifier].join("");
}
function generateCodeFromNodes(nodes: AppNode[], originalCode: string): string {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile("schema.ts", originalCode, {
    overwrite: true,
  });

  nodes.forEach((node) => {
    if (!isColorChooserNode(node)) return;

    const tableName = node.data.label;

    sourceFile.forEachDescendant((descendant) => {
      if (
        Node.isCallExpression(descendant) &&
        descendant.getExpression().getText() === "pgTable" &&
        descendant.getArguments().length >= 2
      ) {
        const tableNameArg = descendant.getArguments()[0];

        if (
          Node.isStringLiteral(tableNameArg) &&
          tableNameArg.getLiteralValue() === tableName
        ) {
          tableNameArg.setLiteralValue(tableName);

          const columnsObj = descendant.getArguments()[1];

          if (Node.isObjectLiteralExpression(columnsObj)) {
            const existingProperties = columnsObj.getProperties();
            const existingColumnNames = new Set<string>();
            const columnsMap = new Map<string, string>();
            const orderedColumns: string[] = [];

            // Step 1: Build a map of column names to their definitions from the node data
            node.data.columns.forEach((columnStr) => {
              const { name, definition } = parseColumnString(columnStr);
              if (!name) return;

              columnsMap.set(name, cleanColumnDefinition(definition));
              orderedColumns.push(name);
              existingColumnNames.add(name);
            });

            // Step 2: Create a new object literal text representation
            let newColumnsText = "{\n";

            // Step 3: Add properties to the new object in the order they appear in the node data
            for (const columnName of orderedColumns) {
              const columnDef = columnsMap.get(columnName);
              if (columnDef) {
                // Check if the column already exists and contains a reference
                const existingProp = existingProperties.find(
                  (p) =>
                    Node.isPropertyAssignment(p) && p.getName() === columnName,
                );

                if (existingProp && Node.isPropertyAssignment(existingProp)) {
                  const existingText = existingProp.getInitializer().getText();
                  if (existingText.includes("references")) {
                    // Preserve the reference by keeping the original definition
                    newColumnsText += `  ${columnName}: ${existingText},\n`;
                    continue;
                  }
                }

                // Add the new or updated property
                newColumnsText += `  ${columnName}: ${columnDef},\n`;
              }
            }

            // Step 4: Add properties that exist in the original code but not in the node data
            // (particularly important for relationships)
            for (const prop of existingProperties) {
              if (Node.isPropertyAssignment(prop)) {
                const propName = prop.getName();
                const propText = prop.getInitializer().getText();

                if (
                  !existingColumnNames.has(propName) &&
                  propText.includes("references")
                ) {
                  newColumnsText += `  ${propName}: ${propText},\n`;
                }
              }
            }

            newColumnsText += "}";

            // Step 5: Replace the old object with the new one
            columnsObj.replaceWithText(newColumnsText);
          }
        }
      }
    });
  });

  return sourceFile.getFullText();
}
const useStore = create<AppState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  code: "",

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) as AppNode[] }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setCode: (code) => set({ code }),

  updateNode: (nodeId, data) => {
    let updatedNode: AppNode | null = null;

    set((state) => {
      const newNodes = state.nodes.map((node) => {
        if (node.id === nodeId) {
          updatedNode = { ...node, data: { ...node.data, ...data } };
          return updatedNode;
        }
        return node;
      });
      return { nodes: newNodes };
    });

    return updatedNode; // Return the updated node
  },

  updateCodeFromNodes: () => {
    const { nodes, code } = get();
    if (!code) return;

    const updatedCode = generateCodeFromNodes(nodes, code);
    set({ code: updatedCode });
  },

  syncMonacoWithNodes: () => {},
  monacoJson: "",
  updateNodeData: (nodeId, data) => {},
}));

export default useStore;
