import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { useSchemaStore } from "@/stores/schemaStore";
import { useEditorStore } from "@/stores/editorStore"; // NEW

import {
  Sun,
  Moon,
  Download,
  Save,
  Layout,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/lib/utils/themeContext";

interface TopBarProps {
  schemaId: string;
  schemaName: string;
}

function TopBar({ schemaId, schemaName }: TopBarProps) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const addTable = useSchemaStore((s) => s.addTable);
  const model = useSchemaStore((s) => s.model);
  const autoLayout = useSchemaStore((s) => s.autoLayout);
  const code = useSchemaStore((s) => s.code);
  const requestFitView = useEditorStore((s) => s.requestFitView); // NEW

  const [name, setName] = useState(schemaName);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const updateMutation = trpc.update.useMutation();
  const renameMutation = trpc.rename.useMutation();

  const handleSave = async () => {
    setSaveStatus("saving");
    await updateMutation.mutateAsync({ id: schemaId, model });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  };

  const handleExport = () => {
    const blob = new Blob([code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name || "schema"}.ts`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRename = (newName: string) => {
    setName(newName);
    renameMutation.mutate({ id: schemaId, name: newName });
  };

  // NEW
  const handleAutoLayout = () => {
    autoLayout();
    requestFitView();
  };

  return (
    <div className="h-[60px] shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md px-4 flex items-center justify-between z-10">
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-[11px] font-medium">
            DE
          </div>
          <span className="text-[13px] font-medium tracking-tight hidden sm:block">
            Drizzle Editor
          </span>
        </button>

        <ChevronRight size={14} className="text-neutral-400" />

        <input
          value={name}
          onChange={(e) => handleRename(e.target.value)}
          className="text-[13px] text-neutral-600 dark:text-neutral-300 bg-transparent outline-none border-b border-transparent focus:border-neutral-400 dark:focus:border-neutral-600 transition min-w-0 max-w-[180px]"
        />
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1" />

        <button
          onClick={handleAutoLayout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
        >
          <Layout size={12} />
          Auto layout
        </button>

        <button
          onClick={addTable}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition font-medium"
        >
          <Plus size={12} />
          Add table
        </button>

        <button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 disabled:opacity-50 transition"
        >
          <Save size={12} />
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
              ? "Saved ✓"
              : "Save"}
        </button>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition font-medium"
        >
          <Download size={12} />
          Export
        </button>
      </div>
    </div>
  );
}

export default TopBar;
