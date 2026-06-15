import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { parseSchema } from "@/engine/parser";
import { Button } from "@/components/ui/button";

interface ImportSchemaModalProps {
  onClose: () => void;
}

function ImportSchemaModal({ onClose }: ImportSchemaModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const createSchema = trpc.create.useMutation();
  const updateSchema = trpc.update.useMutation();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCode(event.target?.result as string);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setError(null);

    const result = parseSchema(code);

    if (!result.ok) {
      setError(result.errors.map((e) => e.message).join("\n"));
      return;
    }

    if (result.model.tables.length === 0) {
      setError(
        "No tables found in this schema. Make sure it contains pgTable(...) definitions.",
      );
      return;
    }

    // derive a name from the first table, or fallback
    const name =
      `Imported (${result.model.tables.map((t) => t.name).join(", ")})`.slice(
        0,
        60,
      );

    const newSchema = await createSchema.mutateAsync({ name });
    await updateSchema.mutateAsync({ id: newSchema.id, model: result.model });

    navigate(`/editor/${newSchema.id}`);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-lg w-[600px] max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h2 className="text-white font-semibold">Import Schema</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1 overflow-hidden">
          <p className="text-sm text-neutral-400">
            Paste your Drizzle schema code below, or upload a <code>.ts</code>{" "}
            file.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".ts"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-fit"
          >
            Choose .ts file
          </Button>

          <textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder={`export const users = pgTable("users", {\n  id: serial("id").primaryKey(),\n  ...\n});`}
            className="flex-1 min-h-[200px] bg-neutral-950 border border-neutral-800 rounded p-3 text-sm text-neutral-200 font-mono outline-none focus:border-neutral-600 resize-none"
          />

          {error && (
            <div className="bg-red-950/50 border border-red-900 rounded p-2 text-xs text-red-400 whitespace-pre-wrap max-h-24 overflow-y-auto">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              !code.trim() || createSchema.isPending || updateSchema.isPending
            }
          >
            {createSchema.isPending || updateSchema.isPending
              ? "Importing..."
              : "Import"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ImportSchemaModal;
