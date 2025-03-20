import React, { useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import useStore from "./store";
import { ColorNode } from "./types";

// Import shadcn UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Custom handle styles based on type with gray color scheme
const SourceHandle = ({ position, id }: { position: Position; id: string }) => (
  <Handle
    type="source"
    position={position}
    id={id}
    className="!z-10 !h-5 !w-5 !border-2 !border-gray-600 !bg-gray-400 !shadow-md !transition-colors hover:!bg-gray-500"
    style={{ right: -10 }} // Position adjustment for better visibility
  />
);

const TargetHandle = ({ position, id }: { position: Position; id: string }) => (
  <Handle
    type="target"
    position={position}
    id={id}
    className="!z-10 !h-5 !w-5 !border-2 !border-gray-600 !bg-gray-400 !shadow-md !transition-colors hover:!bg-gray-500"
    style={{ left: -10 }} // Position adjustment for better visibility
  />
);

function ColorChooserNode({ id, data }: NodeProps<ColorNode>) {
  const { updateNode, updateCodeFromNodes } = useStore();
  const [nodeData, setNodeData] = useState(data);

  useEffect(() => {
    setNodeData(data);
  }, [data]);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    updateNode(id, { label: newLabel });
    setNodeData((prev) => ({ ...prev, label: newLabel }));
    updateCodeFromNodes();
  };

  const parseColumnString = (colString: string) => {
    const match = colString?.match(/^([a-zA-Z0-9_]+)\s+(.+)$/);
    return match
      ? { name: match[1], definition: match[2] }
      : { name: "", definition: colString || "" };
  };

  const handleColumnChange = (index: number, value: string) => {
    const updatedColumns = [...(nodeData.columns || [])];
    updatedColumns[index] = value;
    updateNode(id, { columns: updatedColumns });
    setNodeData((prev) => ({ ...prev, columns: updatedColumns }));
    setTimeout(() => {
      updateCodeFromNodes();
    }, 0);
  };

  if (nodeData.isEnum) {
    return (
      <Card className="min-w-48 border-2 border-gray-600 shadow-lg dark:border-gray-500 dark:bg-gray-900 dark:text-gray-300">
        <CardHeader className="rounded-t-md bg-gray-200 p-2 dark:bg-gray-800">
          <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">
            ENUM: {nodeData.label || ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <Label className="text-base font-bold text-gray-700 dark:text-gray-200">
            Values:
          </Label>

          <ScrollArea className="mt-2 h-32 rounded-md border bg-gray-100 p-2 dark:border-gray-700 dark:bg-gray-800">
            {Array.isArray(nodeData.values) && nodeData.values.length > 0 ? (
              <div className="space-y-2">
                {nodeData.values.map((value: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="w-full justify-start bg-gray-200 font-mono text-base text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {value}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="p-1 text-base text-gray-500 dark:text-gray-400">
                No values defined
              </p>
            )}
          </ScrollArea>
        </CardContent>

        {/* Enhanced Handles with different visuals */}
        <SourceHandle position={Position.Right} id="right" />
        <TargetHandle position={Position.Left} id="left" />
      </Card>
    );
  }

  return (
    <Card className="w-[650px] rounded-xl border-2 border-gray-600 shadow-lg dark:border-gray-500 dark:bg-gray-900 dark:text-gray-300">
      <CardHeader className="rounded-t-xl bg-gray-200 p-3 dark:bg-gray-800">
        <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">
          <Input
            type="text"
            value={nodeData.label || ""}
            onChange={handleLabelChange}
            className="mb-0 border-0 bg-gray-200 text-xl font-bold transition-all hover:border hover:border-gray-300 focus:border focus:border-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:hover:border-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-500"
            placeholder="Table Name"
            style={{ fontSize: "1.75rem" }}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-5">
          {(nodeData.columns || []).map((col: string, index: number) => {
            const { name, definition } = parseColumnString(col);

            return (
              <div key={index} className="flex gap-3">
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    handleColumnChange(
                      index,
                      `${e.target.value} ${definition}`,
                    );
                  }}
                  className="w-48 border-0 bg-gray-50 text-lg font-medium transition-all hover:border hover:border-gray-300 focus:border focus:border-gray-400 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:focus:border-gray-500"
                  placeholder="Field Name"
                  style={{ fontSize: "1.55rem" }}
                />
                <Input
                  type="text"
                  value={definition}
                  onChange={(e) => {
                    handleColumnChange(index, `${name} ${e.target.value}`);
                  }}
                  className="w-128 border-0 bg-gray-50 text-lg transition-all hover:border hover:border-gray-300 focus:border focus:border-gray-400 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:focus:border-gray-500"
                  placeholder="Field Definition"
                  style={{ fontSize: "1.55rem" }}
                />
              </div>
            );
          })}
        </div>

        <Separator className="my-3 bg-gray-300 dark:bg-gray-700" />
        <Badge
          variant="outline"
          className="border-gray-400 text-base text-gray-700 dark:border-gray-600 dark:text-gray-300"
        >
          Relations: {nodeData.hasRelation ? "Yes" : "No"}
        </Badge>
      </CardContent>

      {/* Enhanced Handles with different visuals */}
      <SourceHandle position={Position.Right} id="right" />
      <TargetHandle position={Position.Left} id="left" />
    </Card>
  );
}

export default ColorChooserNode;
