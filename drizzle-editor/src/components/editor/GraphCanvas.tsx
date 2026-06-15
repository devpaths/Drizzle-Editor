import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
  type NodeTypes,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";
import { Camera, Table2 } from "lucide-react";

import { useSchemaStore } from "@/stores/schemaStore";
import { useEditorStore } from "@/stores/editorStore";
import { modelToFlow } from "@/engine/toFlow";

import TableNode from "./TableNode";
import TableEditModal from "./TableEditModal";
import { useTheme } from "@/lib/utils/themeContext";

const nodeTypes: NodeTypes = { tableNode: TableNode };

function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner />
    </ReactFlowProvider>
  );
}

function GraphCanvasInner() {
  const model = useSchemaStore((s) => s.model);
  const updateTablePosition = useSchemaStore((s) => s.updateTablePosition);
  const connectColumns = useSchemaStore((s) => s.connectColumns);
  const disconnectColumns = useSchemaStore((s) => s.disconnectColumns);
  const openTableEditor = useEditorStore((s) => s.openTableEditor);
  const fitViewRequest = useEditorStore((s) => s.fitViewRequest); // NEW
  const addTable = useSchemaStore((s) => s.addTable);
  const { getNodes, fitView } = useReactFlow(); // NEW: fitView
  const { isDark } = useTheme();

  const { nodes, edges } = useMemo(() => modelToFlow(model), [model]);

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    openTableEditor(node.id);
  };

  const handleNodeDragStop = (_event: unknown, node: Node) => {
    updateTablePosition(node.id, node.position);
  };

  const handleConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (!connection.sourceHandle || !connection.targetHandle) return;
    if (
      connection.source === connection.target &&
      connection.sourceHandle === connection.targetHandle
    )
      return;
    connectColumns(
      connection.source,
      connection.sourceHandle,
      connection.target,
      connection.targetHandle,
    );
  };

  const handleEdgeClick = (_event: React.MouseEvent, edge: Edge) => {
    if (!confirm("Remove this relation?")) return;
    if (!edge.source || !edge.sourceHandle) return;
    disconnectColumns(edge.source, edge.sourceHandle);
  };

  const handleScreenshot = async () => {
    const flowNodes = getNodes();
    if (flowNodes.length === 0) return;
    const bounds = getNodesBounds(flowNodes);
    const padding = 100;
    const imageWidth = bounds.width + padding * 2;
    const imageHeight = bounds.height + padding * 2;
    const viewport = getViewportForBounds(
      bounds,
      imageWidth,
      imageHeight,
      0.5,
      2,
      padding,
    );
    const viewportElement = document.querySelector(
      ".react-flow__viewport",
    ) as HTMLElement;
    if (!viewportElement) return;
    const dataUrl = await toPng(viewportElement, {
      backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    });
    const link = document.createElement("a");
    link.download = "schema-diagram.png";
    link.href = dataUrl;
    link.click();
  };

  // NEW — re-fit viewport whenever auto layout is triggered
  useEffect(() => {
    if (fitViewRequest === 0) return; // skip initial mount

    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 400 });
    });

    return () => cancelAnimationFrame(id);
  }, [fitViewRequest, nodes, fitView]);

  // Empty state
  if (model.tables.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-center px-8">
        <div className="w-10 h-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center text-emerald-500 mb-4">
          <Table2 size={18} />
        </div>
        <p className="text-[14px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          No tables yet
        </p>
        <p className="text-[12px] text-neutral-400 dark:text-neutral-500 mb-5 max-w-[200px]">
          Add a table from the top bar or write Drizzle schema code in the
          editor.
        </p>
        <button
          onClick={addTable}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
        >
          + Add table
        </button>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-neutral-50 dark:bg-neutral-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onEdgeClick={handleEdgeClick}
        fitView
        colorMode={isDark ? "dark" : "light"}
        connectionLineStyle={{
          stroke: isDark ? "#404040" : "#d4d4d4",
          strokeWidth: 1.5,
        }}
        connectionLineType={"smoothstep" as any}
        snapToGrid={false}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: {
            stroke: isDark ? "#404040" : "#d4d4d4",
            strokeWidth: 1.5,
          },
        }}
      >
        <Background color={isDark ? "#262626" : "#e5e5e5"} gap={20} size={1} />
        <Controls className="!border-neutral-200 dark:!border-neutral-800 !bg-white dark:!bg-neutral-900 !shadow-none" />
      </ReactFlow>

      {/* Screenshot button */}
      <button
        onClick={handleScreenshot}
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
      >
        <Camera size={12} />
        Screenshot
      </button>

      <TableEditModal />
    </div>
  );
}

export default GraphCanvas;
