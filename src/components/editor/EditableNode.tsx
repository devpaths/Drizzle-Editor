// import React, { useState } from "react";
// import { Handle, Position } from "@xyflow/react";
// import { Input } from "@/components/ui/input";

// type EditableNodeProps = {
//   id: string;
//   data: {
//     label: string;
//     columns: string[];
//   };
//   updateNodeData: (
//     id: string,
//     data: { label: string; columns: string[] },
//   ) => void;
// };

// const EditableNode: React.FC<EditableNodeProps> = ({
//   id,
//   data,
//   updateNodeData,
// }) => {
//   const [label, setLabel] = useState<string>(data.label);
//   const [columns, setColumns] = useState<string[]>(data.columns);

//   const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newLabel = e.target.value;
//     setLabel(newLabel);
//     updateNodeData(id, { ...data, label: newLabel });
//   };

//   const handleColumnChange = (index: number, value: string) => {
//     const newColumns = [...columns];
//     newColumns[index] = value;
//     setColumns(newColumns);
//     updateNodeData(id, { ...data, columns: newColumns });
//   };

//   return (
//     <div className="w-60 rounded-lg bg-gray-800 p-2 text-white shadow-lg">
//       <Input
//         className="mb-2 border-none bg-gray-700 text-white"
//         value={label}
//         onChange={handleLabelChange}
//       />
//       <div>
//         {columns.map((col, index) => (
//           <Input
//             key={index}
//             className="my-1 border-none bg-gray-700 text-white"
//             value={col}
//             onChange={(e) => handleColumnChange(index, e.target.value)}
//           />
//         ))}
//       </div>
//       <Handle type="target" position={Position.Left} />
//       <Handle type="source" position={Position.Right} />
//     </div>
//   );
// };

// export default EditableNode;
