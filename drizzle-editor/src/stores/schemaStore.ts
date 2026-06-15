import { generateSchema } from "@/engine/generator";
import { applyAutoLayout } from "@/engine/layout";
import type { Column, ParseError, SchemaModel, Table } from "@/engine/model";
import { parseSchema } from "@/engine/parser";
import { create } from "zustand";
import { withDerivedRelations } from "@/engine/relations";

interface SchemaState {
  model: SchemaModel;
  code: string;
  parseErrors: ParseError[];
}

interface SchemaActions {
  updateFromGraph: (model: SchemaModel) => void;
  updateFromCode: (code: string) => void;
  resetSchema: () => void;
  addTable: () => void;
  addColumn: (tableId: string) => void;
  updateColumn: (
    tableId: string,
    columnId: string,
    updates: Partial<Column>,
  ) => void;
  deleteColumn: (tableId: string, columnId: string) => void;
  renameTable: (tableId: string, newName: string) => void;
  deleteTable: (tableId: string) => void;
  autoLayout: () => void;
  updateTablePosition: (
    tableId: string,
    position: { x: number; y: number },
  ) => void;
  connectColumns: (
    sourceTableId: string,
    sourceColumnId: string,
    targetTableId: string,
    targetColumnId: string,
  ) => void;
  disconnectColumns: (tableId: string, columnId: string) => void;
}

type SchemaStore = SchemaState & SchemaActions;

const initialState: SchemaState = {
  model: { tables: [], relations: [] },
  code: "",
  parseErrors: [],
};

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  ...initialState,

  updateFromGraph: (model: SchemaModel) => {
    const code = generateSchema(model);
    set({ model, code, parseErrors: [] });
  },

  updateFromCode: (code: string) => {
    const result = parseSchema(code);
    if (result.ok) {
      set({ model: result.model, code, parseErrors: [] });
    } else {
      set({ code, parseErrors: result.errors });
    }
  },

  resetSchema: () => {
    set(initialState);
  },

  addTable: () => {
    const { model } = get();

    let counter = 1;
    let name = `table${counter}`;
    while (model.tables.some((t) => t.name === name)) {
      counter++;
      name = `table${counter}`;
    }

    const newTable: Table = {
      id: name,
      name,
      columns: [
        {
          id: "id",
          name: "id",
          type: "serial",
          primaryKey: true,
          nullable: false,
        },
      ],
    };

    const newModel: SchemaModel = {
      ...model,
      tables: [...model.tables, newTable],
    };

    const code = generateSchema(newModel);
    set({ model: newModel, code, parseErrors: [] });
  },
  updateColumn: (tableId, columnId, updates) => {
    const { model } = get();

    let newModel: SchemaModel = {
      ...model,
      tables: model.tables.map((t) =>
        t.id !== tableId
          ? t
          : {
              ...t,
              columns: t.columns.map((c) =>
                c.id === columnId ? { ...c, ...updates } : c,
              ),
            },
      ),
    };

    newModel = withDerivedRelations(newModel);

    const code = generateSchema(newModel);
    set({ model: newModel, code, parseErrors: [] });
  },

  deleteColumn: (tableId, columnId) => {
    const { model } = get();

    let newModel: SchemaModel = {
      ...model,
      tables: model.tables.map((t) =>
        t.id !== tableId
          ? t
          : { ...t, columns: t.columns.filter((c) => c.id !== columnId) },
      ),
    };

    newModel = withDerivedRelations(newModel);

    const code = generateSchema(newModel);
    set({ model: newModel, code, parseErrors: [] });
  },

  deleteTable: (tableId) => {
    const { model } = get();

    let newModel: SchemaModel = {
      tables: model.tables.filter((t) => t.id !== tableId),
      relations: model.relations,
    };

    newModel = withDerivedRelations(newModel);

    const code = generateSchema(newModel);
    set({ model: newModel, code, parseErrors: [] });
  },

  renameTable: (tableId, newName) => {
    const { model } = get();

    let newModel: SchemaModel = {
      ...model,
      tables: model.tables.map((t) =>
        t.id === tableId ? { ...t, name: newName, id: newName } : t,
      ),
    };

    // fix references pointing to the old name/id
    newModel = {
      ...newModel,
      tables: newModel.tables.map((t) => ({
        ...t,
        columns: t.columns.map((c) =>
          c.references?.tableId === tableId
            ? {
                ...c,
                references: {
                  ...c.references,
                  tableId: newName,
                  tableName: newName,
                },
              }
            : c,
        ),
      })),
    };

    newModel = withDerivedRelations(newModel);

    const code = generateSchema(newModel);
    set({ model: newModel, code, parseErrors: [] });
  },
  addColumn: (tableId: string) => {
    const { model } = get();

    const table = model.tables.find((t) => t.id === tableId);
    if (!table) return;

    // generate unique column name: column1, column2, ...
    let counter = 1;
    let name = `column${counter}`;
    while (table.columns.some((c) => c.name === name)) {
      counter++;
      name = `column${counter}`;
    }

    const newColumn: Column = {
      id: name,
      name,
      type: "text",
      primaryKey: false,
      nullable: false,
    };

    const newModel: SchemaModel = {
      ...model,
      tables: model.tables.map((t) =>
        t.id === tableId ? { ...t, columns: [...t.columns, newColumn] } : t,
      ),
    };

    const code = generateSchema(newModel);
    set({ model: newModel, code, parseErrors: [] });
  },
  autoLayout: () => {
    const { model } = get();
    const tables = applyAutoLayout(model);
    const newModel: SchemaModel = { ...model, tables };

    // positions don't affect generated code, but keep code in sync anyway
    const code = generateSchema(newModel);
    set({ model: newModel, code });
  },

  updateTablePosition: (tableId, position) => {
    const { model } = get();
    const newModel: SchemaModel = {
      ...model,
      tables: model.tables.map((t) =>
        t.id === tableId ? { ...t, position } : t,
      ),
    };
    // no codegen needed — position is purely visual, avoid unnecessary regen
    set({ model: newModel });
  },
  connectColumns: (
    sourceTableId,
    sourceColumnId,
    targetTableId,
    targetColumnId,
  ) => {
    const { model } = get();

    const targetTable = model.tables.find((t) => t.id === targetTableId);
    if (!targetTable) return;

    let newModel: SchemaModel = {
      ...model,
      tables: model.tables.map((t) =>
        t.id !== sourceTableId
          ? t
          : {
              ...t,
              columns: t.columns.map((c) =>
                c.id !== sourceColumnId
                  ? c
                  : {
                      ...c,
                      references: {
                        tableId: targetTable.id,
                        tableName: targetTable.name,
                        columnId: targetColumnId,
                        columnName:
                          targetTable.columns.find(
                            (tc) => tc.id === targetColumnId,
                          )?.name ?? targetColumnId,
                      },
                    },
              ),
            },
      ),
    };

    newModel = withDerivedRelations(newModel);

    const code = generateSchema(newModel);
    set({ model: newModel, code, parseErrors: [] });
  },
  disconnectColumns: (tableId, columnId) => {
    const { model } = get();

    let newModel: SchemaModel = {
      ...model,
      tables: model.tables.map((t) =>
        t.id !== tableId
          ? t
          : {
              ...t,
              columns: t.columns.map((c) =>
                c.id === columnId ? { ...c, references: undefined } : c,
              ),
            },
      ),
    };

    newModel = withDerivedRelations(newModel);

    const code = generateSchema(newModel);
    set({ model: newModel, code, parseErrors: [] });
  },
}));
