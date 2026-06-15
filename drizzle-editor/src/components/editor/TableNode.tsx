import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { Table } from "@/engine/model";
import { Key, Link } from "lucide-react";

type TableNodeData = { table: Table };

function TableNode({ data }: NodeProps) {
  const { table } = data as unknown as TableNodeData;

  return (
    // ❌ removed overflow-hidden — it clips handles that sit outside the border
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl min-w-[220px] text-sm shadow-sm">
      {/* Table header */}
      <div className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 rounded-t-xl flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-[13px] font-medium text-neutral-900 dark:text-white tracking-tight">
          {table.name}
        </span>
      </div>

      {/* Columns */}
      <div className="flex flex-col">
        {table.columns.map((col) => (
          <div
            key={col.id}
            className="relative flex items-center justify-between px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
          >
            {/* Target handle — left side */}
            <Handle
              type="target"
              position={Position.Left}
              id={col.id}
              style={{
                top: "50%",
                left: -6,
                right: "auto", // clear any inherited right
                transform: "translateY(-50%)",
                width: 10,
                height: 10,
                background: "#60a5fa",
                border: "2px solid white",
                borderRadius: "50%",
              }}
            />

            <span className="flex items-center gap-1.5 text-[12px] text-neutral-700 dark:text-neutral-300">
              {col.primaryKey && (
                <Key size={10} className="text-amber-500 shrink-0" />
              )}
              {col.references && !col.primaryKey && (
                <Link size={10} className="text-blue-400 shrink-0" />
              )}
              {!col.primaryKey && !col.references && (
                <span className="w-[10px] shrink-0" />
              )}
              {col.name}
            </span>

            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
              {typeof col.type === "string"
                ? col.type
                : `varchar(${col.type.length})`}
            </span>

            {/* Source handle — right side */}
            <Handle
              type="source"
              position={Position.Right}
              id={col.id}
              style={{
                top: "50%",
                right: -6,
                left: "auto", // clear the inherited left: 0
                transform: "translateY(-50%)",
                width: 10,
                height: 10,
                background: "#10b981",
                border: "2px solid white",
                borderRadius: "50%",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableNode;
