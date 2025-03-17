import React, { useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import useStore from "./store";
import { ColorNode } from "./types";

function ColorChooserNode({ id, data }: NodeProps<ColorNode>) {
  const { updateNode, updateCodeFromNodes } = useStore();
  const [nodeData, setNodeData] = useState(data);

  // Make sure local state is updated when props change
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

  const handleEnumValueChange = (index: number, value: string) => {
    const updatedValues = [...(nodeData.values || [])];
    updatedValues[index] = value;
    updateNode(id, { values: updatedValues });
    setNodeData((prev) => ({ ...prev, values: updatedValues }));
    setTimeout(() => {
      updateCodeFromNodes();
    }, 0);
  };

  // Render based on node type
  if (nodeData.isEnum) {
    return (
      <div
        style={{
          padding: "10px",
          background: "#F0F8FF", // Light blue background for enums
          border: "1px solid #4682B4",
          borderRadius: "5px",
          minWidth: "180px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "8px",
            backgroundColor: "#4682B4",
            padding: "4px 8px",
            color: "white",
            borderRadius: "3px",
          }}
        >
          ENUM: {nodeData.label || ""}
        </div>

        <div
          style={{ fontSize: "12px", marginBottom: "5px", fontWeight: "bold" }}
        >
          Values:
        </div>
        <ul
          style={{
            listStyleType: "none",
            padding: "5px",
            margin: 0,
            border: "1px solid #E0E0E0",
            borderRadius: "3px",
            backgroundColor: "white",
          }}
        >
          {Array.isArray(nodeData.values) && nodeData.values.length > 0 ? (
            nodeData.values.map((value: string, index: number) => (
              <li
                key={index}
                style={{
                  margin: "3px 0",
                  padding: "3px 6px",
                  backgroundColor: "#F5F5F5",
                  borderRadius: "2px",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              >
                {value}
              </li>
            ))
          ) : (
            <li style={{ color: "#999", padding: "5px" }}>No values defined</li>
          )}
        </ul>

        <Handle type="source" position={Position.Right} id="right" />
        <Handle type="target" position={Position.Left} id="left" />
      </div>
    );
  }

  // Regular table node rendering
  return (
    <div
      style={{
        padding: "10px",
        background: "#FFF",
        border: "1px solid #ccc",
        borderRadius: "5px",
        minWidth: "100px",
      }}
    >
      <input
        type="text"
        value={nodeData.label || ""}
        onChange={handleLabelChange}
        style={{ width: "100%", marginBottom: "5px", fontWeight: "bold" }}
        placeholder="Table Name"
      />

      <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
        {(nodeData.columns || []).map((col: string, index: number) => {
          const { name, definition } = parseColumnString(col);

          return (
            <li key={index} style={{ marginBottom: "5px" }}>
              <div style={{ display: "flex", gap: "5px" }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    handleColumnChange(
                      index,
                      `${e.target.value} ${definition}`,
                    );
                  }}
                  style={{ width: "40%", fontWeight: "bold" }}
                  placeholder="Field Name"
                />
                <input
                  type="text"
                  value={definition}
                  onChange={(e) => {
                    handleColumnChange(index, `${name} ${e.target.value}`);
                  }}
                  style={{ width: "60%" }}
                  placeholder="Field Definition"
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div style={{ fontSize: "10px", marginTop: "5px", color: "#666" }}>
        Relations: {nodeData.hasRelation ? "Yes" : "No"}
      </div>

      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Left} id="left" />
    </div>
  );
}

export default ColorChooserNode;
