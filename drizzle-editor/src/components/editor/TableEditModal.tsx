import { useSchemaStore } from "@/stores/schemaStore";
import { useEditorStore } from "@/stores/editorStore";
import type { DrizzleColumnType, Column } from "@/engine/model";
import { X, Plus, Trash2 } from "lucide-react";

const COLUMN_TYPES = [
  { label: "serial", value: "serial" },
  { label: "integer", value: "integer" },
  { label: "text", value: "text" },
  { label: "boolean", value: "boolean" },
  { label: "timestamp", value: "timestamp" },
  { label: "uuid", value: "uuid" },
  { label: "varchar", value: "varchar" },
];

function typeToKey(type: DrizzleColumnType): string {
  return typeof type === "string" ? type : "varchar";
}

function getVarcharLength(type: DrizzleColumnType): number {
  return typeof type === "object" ? type.length : 255;
}

function TableEditModal() {
  const selectedTableId = useEditorStore((s) => s.selectedTableId);
  const closeTableEditor = useEditorStore((s) => s.closeTableEditor);

  const model = useSchemaStore((s) => s.model);
  const addColumn = useSchemaStore((s) => s.addColumn);
  const updateColumn = useSchemaStore((s) => s.updateColumn);
  const deleteColumn = useSchemaStore((s) => s.deleteColumn);
  const renameTable = useSchemaStore((s) => s.renameTable);
  const deleteTable = useSchemaStore((s) => s.deleteTable);

  if (!selectedTableId) return null;
  const table = model.tables.find((t) => t.id === selectedTableId);
  if (!table) return null;

  const otherTables = model.tables.filter((t) => t.id !== table.id);

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={closeTableEditor}
    >
      <div
        className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-[580px] max-h-[80vh] flex flex-col overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <input
              value={table.name}
              onChange={(e) => renameTable(table.id, e.target.value)}
              className="text-[15px] font-medium tracking-tight bg-transparent text-neutral-900 dark:text-white outline-none border-b border-transparent focus:border-neutral-400 dark:focus:border-neutral-600 transition"
            />
          </div>
          <button
            onClick={closeTableEditor}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Column list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {table.columns.length === 0 && (
            <p className="text-[12px] text-neutral-400 dark:text-neutral-500 text-center py-6">
              No columns yet. Add one below.
            </p>
          )}
          {table.columns.map((col) => (
            <ColumnRow
              key={col.id}
              column={col}
              otherTables={otherTables}
              onUpdate={(updates) => updateColumn(table.id, col.id, updates)}
              onDelete={() => deleteColumn(table.id, col.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <button
            onClick={() => addColumn(table.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
          >
            <Plus size={12} />
            Add column
          </button>
          <button
            onClick={() => {
              deleteTable(table.id);
              closeTableEditor();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
          >
            <Trash2 size={12} />
            Delete table
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Column row ──

const inputCls =
  "bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-[12px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition";
const checkboxLabelCls =
  "flex items-center gap-1.5 text-[12px] text-neutral-500 dark:text-neutral-400 cursor-pointer select-none";

function ColumnRow({
  column,
  otherTables,
  onUpdate,
  onDelete,
}: {
  column: Column;
  otherTables: { id: string; name: string; columns: Column[] }[];
  onUpdate: (updates: Partial<Column>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 space-y-2.5 bg-neutral-50 dark:bg-neutral-900/50">
      {/* Row 1 — name, type, varchar length, delete */}
      <div className="flex items-center gap-2">
        <input
          value={column.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="column_name"
          className={`${inputCls} flex-1 min-w-0`}
        />

        <select
          value={typeToKey(column.type)}
          onChange={(e) => {
            const key = e.target.value;
            if (key === "varchar") {
              onUpdate({
                type: {
                  kind: "varchar",
                  length: getVarcharLength(column.type),
                },
              });
            } else {
              onUpdate({ type: key as DrizzleColumnType });
            }
          }}
          className={inputCls}
        >
          {COLUMN_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {typeof column.type === "object" && column.type.kind === "varchar" && (
          <input
            type="number"
            min={1}
            value={column.type.length}
            onChange={(e) =>
              onUpdate({
                type: {
                  kind: "varchar",
                  length: Number(e.target.value) || 255,
                },
              })
            }
            className={`${inputCls} w-16`}
            title="Length"
          />
        )}

        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
        >
          <X size={13} />
        </button>
      </div>

      {/* Row 2 — constraints */}
      <div className="flex items-center gap-4 flex-wrap pl-0.5">
        <label className={checkboxLabelCls}>
          <input
            type="checkbox"
            checked={column.primaryKey}
            onChange={(e) =>
              onUpdate({
                primaryKey: e.target.checked,
                nullable: e.target.checked ? false : column.nullable,
              })
            }
            className="accent-emerald-500"
          />
          Primary key
        </label>

        <label className={checkboxLabelCls}>
          <input
            type="checkbox"
            checked={!column.nullable}
            disabled={column.primaryKey}
            onChange={(e) => onUpdate({ nullable: !e.target.checked })}
            className="accent-emerald-500"
          />
          Not null
        </label>

        <label className={checkboxLabelCls}>
          <input
            type="checkbox"
            checked={column.unique ?? false}
            onChange={(e) => onUpdate({ unique: e.target.checked })}
            className="accent-emerald-500"
          />
          Unique
        </label>

        <label className={`${checkboxLabelCls} gap-2`}>
          <span>Ref:</span>
          <select
            value={
              column.references
                ? `${column.references.tableId}.${column.references.columnId}`
                : ""
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                onUpdate({ references: undefined });
                return;
              }
              const [tableId, columnId] = val.split(".");
              const refTable = otherTables.find((t) => t.id === tableId);
              if (!refTable) return;
              onUpdate({
                references: {
                  tableId: refTable.id,
                  tableName: refTable.name,
                  columnId,
                  columnName: columnId,
                },
              });
            }}
            className={inputCls}
          >
            <option value="">none</option>
            {otherTables.map((t) =>
              t.columns.map((c) => (
                <option key={`${t.id}.${c.id}`} value={`${t.id}.${c.id}`}>
                  {t.name}.{c.name}
                </option>
              )),
            )}
          </select>
        </label>
      </div>
    </div>
  );
}

export default TableEditModal;
