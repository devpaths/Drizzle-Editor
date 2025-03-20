// Save as: @/components/ui/AddTableDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddTableDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  onTableNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateTable: () => void;
}

const AddTableDialog: React.FC<AddTableDialogProps> = ({
  isOpen,
  onOpenChange,
  tableName,
  onTableNameChange,
  onCreateTable,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Table</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="tableName"
              className="text-right text-sm font-medium"
            >
              Table Name
            </Label>
            <Input
              id="tableName"
              value={tableName}
              onChange={onTableNameChange}
              className="col-span-3"
              placeholder="Enter table name"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onCreateTable}
            className="bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTableDialog;
