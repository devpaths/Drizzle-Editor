import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

export type SchemaRow = {
  id: string;
  name: string;
  updatedAt: string;
};

export const columns = (
  navigate: (path: string) => void,
  onDelete: (id: string, name: string) => void,
): ColumnDef<SchemaRow>[] => [
  {
    accessorKey: "name",
    header: "Schema Name",
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString(),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/editor/${row.original.id}`)}
        >
          Open
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(row.original.id, row.original.name)}
        >
          Delete
        </Button>
      </div>
    ),
  },
];
