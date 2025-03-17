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

    // Update the node in the store
    updateNode(id, { label: newLabel });

    // Update local state directly
    setNodeData((prev) => ({ ...prev, label: newLabel }));

    // Update code from nodes
    updateCodeFromNodes();
  };

  // Parse column string into name and definition parts
  const parseColumnString = (colString: string) => {
    const match = colString.match(/^([a-zA-Z0-9_]+)\s+(.+)$/);
    return match
      ? { name: match[1], definition: match[2] }
      : { name: "", definition: colString };
  };

  const handleColumnChange = (index: number, value: string) => {
    const updatedColumns = [...nodeData.columns];
    updatedColumns[index] = value;

    // Update the node in the store
    updateNode(id, { columns: updatedColumns });

    // Update local state directly
    setNodeData((prev) => ({ ...prev, columns: updatedColumns }));

    // Call updateCodeFromNodes separately to allow batching updates
    setTimeout(() => {
      updateCodeFromNodes();
    }, 0);
  };

  // Save button to trigger code update after all changes
  const saveChanges = () => {
    updateCodeFromNodes();
  };

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
        value={nodeData.label}
        onChange={handleLabelChange}
        style={{ width: "100%", marginBottom: "5px", fontWeight: "bold" }}
        placeholder="Table Name"
      />

      <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
        {nodeData.columns?.map((col: string, index: number) => {
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

      {/* Add a save button to trigger code update after all changes */}
      {/* <button
        onClick={saveChanges}
        style={{
          marginTop: "10px",
          padding: "5px 10px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Save Changes
      </button> */}

      {/* Debug info */}
      <div style={{ fontSize: "10px", marginTop: "5px", color: "#666" }}>
        Relations: {nodeData.hasRelation ? "Yes" : "No"}
      </div>

      {/* Always render the handles, regardless of hasRelation */}
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Left} id="left" />
    </div>
  );
}

export default ColorChooserNode;
