import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, FolderOpen, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SchemaRow = {
  id: string;
  name: string;
  updatedAt: string;
};

export const getColumns = (
  navigate: (path: string) => void,
  onDelete: (id: string, name: string) => void,
): ColumnDef<SchemaRow>[] => [
  {
    accessorKey: "name",
    header: "Schema",
    cell: ({ row }) => (
      <div className="font-medium text-neutral-900 dark:text-white">
        {row.original.name}
      </div>
    ),
  },

  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => (
      <span className="text-neutral-500 dark:text-neutral-400">
        {new Date(row.original.updatedAt).toLocaleString()}
      </span>
    ),
  },

  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,

    header: () => <div className="w-full text-right"></div>,

    cell: ({ row }) => (
      <div className="flex ">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="
                h-8
                w-8
                flex
                items-center
                justify-center
                text-neutral-500
                hover:text-neutral-900
                dark:hover:text-white
                hover:bg-neutral-100
                dark:hover:bg-neutral-900
                transition
              "
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="center"
            className="
              rounded-none
              border-neutral-200
              dark:border-neutral-800
            "
          >
            <DropdownMenuItem
              onClick={() => navigate(`/editor/${row.original.id}`)}
              className="cursor-pointer"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Open
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate(`/editor/${row.original.id}`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer text-red-500 focus:text-red-500"
              onClick={() => onDelete(row.original.id, row.original.name)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];
