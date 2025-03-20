// lib/monaco-workers.ts

// This file should be imported in your _app.tsx or similar entry point

export function initMonacoWorkers() {
  if (typeof window !== "undefined") {
    // Set up worker URL mapping
    window.MonacoEnvironment = {
      getWorkerUrl: function (_moduleId: string, label: string) {
        if (label === "typescript" || label === "javascript") {
          return "/_next/monaco-workers/ts.worker.js";
        }
        if (label === "css") {
          return "/_next/monaco-workers/css.worker.js";
        }
        if (label === "html") {
          return "/_next/monaco-workers/html.worker.js";
        }
        if (label === "json") {
          return "/_next/monaco-workers/json.worker.js";
        }
        return "/_next/monaco-workers/editor.worker.js";
      },
    };
  }
}
