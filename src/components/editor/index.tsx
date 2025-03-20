// File: /src/components/DrizzleEditor/index.tsx
import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Header from "@/components/layout/Header";
import DrizzleEditorContent from "./DrizzleEditor";

export default function DrizzleEditor() {
  return (
    <ReactFlowProvider>
      <Header />
      <DrizzleEditorContent />
    </ReactFlowProvider>
  );
}
