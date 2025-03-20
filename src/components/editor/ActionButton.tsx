import React from "react";
import { Button } from "@/components/ui/button";
import AutoLayout from "@/components/editor/AutoLayout";
import { ReactFlowInstance } from "@xyflow/react";

interface ActionButtonsProps {
  reactFlowInstance: ReactFlowInstance | null;
  onAddTableClick: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  reactFlowInstance,
  onAddTableClick,
}) => {
  return (
    <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-lg bg-gray-100/70 p-2 backdrop-blur-sm dark:bg-gray-800/70">
      <Button
        onClick={onAddTableClick}
        variant="outline"
        size="sm"
        className="border-gray-300 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        Add Table
      </Button>
      <AutoLayout reactFlowInstance={reactFlowInstance} />
    </div>
  );
};
