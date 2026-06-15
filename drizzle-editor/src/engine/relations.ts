import type { SchemaModel, Table, Relation } from "./model";

// Recomputes model.relations from every column's `references` field.
// Called any time columns/tables change, so relations never drift
// out of sync with the actual foreign keys.

export function deriveRelations(tables: Table[]): Relation[] {
  const relations: Relation[] = [];

  for (const table of tables) {
    for (const column of table.columns) {
      if (!column.references) continue;

      // skip dangling references (target table/column no longer exists)
      const targetTable = tables.find(
        (t) => t.id === column.references!.tableId,
      );
      const targetColumn = targetTable?.columns.find(
        (c) => c.id === column.references!.columnId,
      );
      if (!targetTable || !targetColumn) continue;

      relations.push({
        id: `${table.id}_${column.id}_${column.references.tableId}`,
        fromTableId: column.references.tableId,
        fromTableName: column.references.tableName,
        toTableId: table.id,
        toTableName: table.name,
        type: column.unique ? "one-to-one" : "one-to-many",
        fromColumnId: column.references.columnId,
        fromColumnName: column.references.columnName,
        toColumnId: column.id,
        toColumnName: column.name,
      });
    }
  }

  return relations;
}

// Convenience — returns a new model with relations recomputed
export function withDerivedRelations(model: SchemaModel): SchemaModel {
  return { ...model, relations: deriveRelations(model.tables) };
}
