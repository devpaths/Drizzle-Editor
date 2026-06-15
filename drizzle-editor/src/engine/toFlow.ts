import type { Node, Edge } from "@xyflow/react";
import type { SchemaModel } from "./model";

export function modelToFlow(model: SchemaModel): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = model.tables.map((table, index) => ({
    id: table.id,
    type: "tableNode",
    // use stored position if available, else simple fallback grid
    position: table.position ?? {
      x: (index % 4) * 320,
      y: Math.floor(index / 4) * 300,
    },
    data: { table },
  }));

  const edges: Edge[] = model.relations.map((rel) => ({
    id: rel.id,
    source: rel.toTableId,
    target: rel.fromTableId,
    sourceHandle: rel.toColumnId,
    targetHandle: rel.fromColumnId,
    label: rel.type,
    animated: false,
    style: { strokeWidth: 2, cursor: "pointer" },
    interactionWidth: 20, // wider invisible click area
  }));
  return { nodes, edges };
}
