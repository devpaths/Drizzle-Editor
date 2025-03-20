// src/utils/parseAndUpdateDiagram.ts
import { parseDrizzleSchemaFromCode } from "@/components/Parser/Drizzle-metadata-parser";
import { AppState } from "./types";

export const parseAndUpdateDiagram = (
  codeToProcess: string,
  nodes: AppState["nodes"],
  setNodes: AppState["setNodes"],
  setEdges: AppState["setEdges"],
) => {
  try {
    const drizzleSchema = parseDrizzleSchemaFromCode(codeToProcess);

    // Map table names to node IDs
    const tableNameToNodeId: { [key: string]: string } = {};
    drizzleSchema.tables.forEach((table, index) => {
      tableNameToNodeId[table.name] = `table-${index}`;
    });

    // Create map of existing nodes
    const existingNodesMap = nodes.reduce(
      (acc, node) => {
        acc[node.id] = node;
        return acc;
      },
      {} as Record<string, any>,
    );

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

    // Create enum nodes
    const enumNodes = drizzleSchema.enums.map((enumType, index) => {
      const nodeId = `enum-${index}`;
      const existingNode = existingNodesMap[nodeId];

      return {
        id: nodeId,
        type: "enumNode",
        position: existingNode
          ? existingNode.position
          : { x: 100 + index * 250, y: 350 },
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

    // Create edges
    const parsedEdges = drizzleSchema.relations.map((relation) => ({
      id: `${relation.fromTable}-${relation.toTable}`,
      source: tableNameToNodeId[relation.fromTable],
      target: tableNameToNodeId[relation.toTable],
      type: "smoothstep",
      animated: false,
      label: `${relation.fromColumn} → ${relation.toColumn}`,
      style: {
        strokeWidth: 3,
        stroke: "#888",
      },
    }));

    // Update store with new nodes and edges
    setNodes(allNodes);
    setEdges(parsedEdges);
  } catch (error) {
    console.error("Error parsing schema:", error);
  }
};
