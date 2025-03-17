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

  // First, update the table definitions
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
            const properties = columnsObj.getProperties();
            const existingColumnNames = new Set<string>();

            node.data.columns.forEach((columnStr) => {
              const { name, definition } = parseColumnString(columnStr);
              if (!name) return;

              const cleanedDefinition = cleanColumnDefinition(definition);
              existingColumnNames.add(name);

              const property = properties.find(
                (p) => Node.isPropertyAssignment(p) && p.getName() === name,
              );

              if (property && Node.isPropertyAssignment(property)) {
                try {
                  // Preserve references to other tables by checking if the definition contains 'references'
                  if (
                    definition.includes("references") &&
                    property.getInitializer().getText().includes("references")
                  ) {
                    // Don't modify the reference part
                    return;
                  }
                  property.setInitializer(cleanedDefinition);
                } catch (error) {
                  console.error(
                    `Failed to update column definition for ${name}:`,
                    error,
                  );
                }
              } else {
                try {
                  columnsObj.addPropertyAssignment({
                    name,
                    initializer: cleanedDefinition,
                  });
                } catch (error) {
                  console.error(`Failed to add new column ${name}:`, error);
                }
              }
            });

            // Only remove properties that are not references and not in the current columns
            properties.forEach((property) => {
              if (Node.isPropertyAssignment(property)) {
                const propName = property.getName();
                const propText = property.getInitializer().getText();
                if (
                  !existingColumnNames.has(propName) &&
                  !propText.includes("references")
                ) {
                  property.remove();
                }
              }
            });
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
