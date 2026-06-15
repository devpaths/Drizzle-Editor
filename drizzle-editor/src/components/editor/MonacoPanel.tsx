import MonacoEditor from "@monaco-editor/react";
import { useSchemaStore } from "@/stores/schemaStore";
import { useTheme } from "@/lib/utils/themeContext";

function MonacoPanel() {
  const { code, updateFromCode, parseErrors } = useSchemaStore();
  const { isDark } = useTheme();
  console.log("isDark:", isDark);
  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950">
      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 max-h-24 overflow-y-auto">
          {parseErrors.map((err, i) => (
            <div
              key={i}
              className="text-[12px] text-red-600 dark:text-red-400 font-mono"
            >
              {err.message}
              {err.line ? ` (line ${err.line})` : ""}
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language="typescript"
          theme={isDark ? "vs-dark" : "vs"}
          value={code}
          onChange={(value) => updateFromCode(value ?? "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            wordWrap: "on",
            automaticLayout: true,
            lineNumbers: "on",
            renderLineHighlight: "line",
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}

export default MonacoPanel;
