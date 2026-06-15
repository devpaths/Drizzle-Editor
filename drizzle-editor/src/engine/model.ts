export interface Table {
  id: string;
  name: string;
  columns: Column[];
  position?: { x: number; y: number };
}

export type DrizzleColumnType =
  | "serial"
  | "integer"
  | "text"
  | "boolean"
  | "timestamp"
  | "uuid"
  | { kind: "varchar"; length: number };

export interface ColumnReference {
  tableId: string;
  tableName: string;
  columnId: string;
  columnName: string;
}

export interface Column {
  id: string;
  name: string;
  type: DrizzleColumnType;
  primaryKey: boolean;
  nullable: boolean;
  unique?: boolean;
  default?: string | number | boolean | "now";
  references?: ColumnReference;
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
}

export interface Relation {
  id: string;
  fromTableId: string;
  fromTableName: string;
  toTableId: string;
  toTableName: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  fromColumnId: string;
  fromColumnName: string;
  toColumnId: string;
  toColumnName: string;
}

export interface SchemaModel {
  tables: Table[];
  relations: Relation[];
}

export type ParseError = { message: string; line?: number };

export type ParseResult =
  | { ok: true; model: SchemaModel }
  | { ok: false; errors: ParseError[] };
