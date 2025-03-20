import React, { useRef, useEffect, useState } from "react";
import { Editor, loader } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

// We'll implement YJS after we get the basic editor working
// import * as Y from "yjs";
// import { WebsocketProvider } from "y-websocket";
// import { MonacoBinding } from "y-monaco";

interface MonacoEditorComponentProps {
  code: string;
  onChange: (value: string | undefined) => void;
  isDarkMode: boolean;
  isMounted: boolean;
}

// Configure Monaco loader to use CDN for workers
// This avoids the dynamic import issues with Turbopack
loader.config({
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.37.1/min/vs",
  },
});

const MonacoEditorComponent: React.FC<MonacoEditorComponentProps> = ({
  code,
  onChange,
  isDarkMode,
  isMounted,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor) {
    editorRef.current = editor;

    // Once editor is mounted, you can implement YJS here
    // But let's first make sure the basic editor works
  }

  return (
    <div className="relative h-full w-full">
      <Editor
        height="100%"
        language="typescript"
        theme={isMounted ? (isDarkMode ? "vs-dark" : "vs-light") : "vs-dark"}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        beforeMount={(monaco) => {
          // Configure Monaco before it mounts
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution:
              monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
          });
        }}
      />
    </div>
  );
};

export default MonacoEditorComponent;
