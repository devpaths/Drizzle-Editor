import dagre from "dagre";
import type { SchemaModel, Table } from "./model";

const NODE_WIDTH = 240;
const ROW_HEIGHT = 28; // approx height per column row
const HEADER_HEIGHT = 70; // table name + add column button etc.

function estimateNodeHeight(table: Table): number {
  return HEADER_HEIGHT + table.columns.length * ROW_HEIGHT;
}

// Runs dagre layout and returns updated tables with computed positions
export function applyAutoLayout(model: SchemaModel): Table[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 120 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const table of model.tables) {
    g.setNode(table.id, {
      width: NODE_WIDTH,
      height: estimateNodeHeight(table),
    });
  }

  for (const rel of model.relations) {
    g.setEdge(rel.fromTableId, rel.toTableId);
  }

  dagre.layout(g);

  return model.tables.map((table) => {
    const node = g.node(table.id);
    return {
      ...table,
      // dagre gives center point — convert to top-left for React Flow
      position: {
        x: node.x - NODE_WIDTH / 2,
        y: node.y - estimateNodeHeight(table) / 2,
      },
    };
  });
}
