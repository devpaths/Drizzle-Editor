import type { SchemaModel, Table, Column, DrizzleColumnType } from "./model";

// -----------------------------------------------
// ENTRY POINT
// -----------------------------------------------

export function generateSchema(model: SchemaModel): string {
  if (model.tables.length === 0) return "";

  const parts: string[] = [];

  const importsBlock = generateImports(model);
  parts.push(importsBlock);

  for (const table of model.tables) {
    parts.push(generateTable(table));
  }

  if (model.relations.length > 0) {
    for (const table of model.tables) {
      const block = generateRelations(table, model);
      if (block !== null) parts.push(block);
    }
  }

  return parts.join("\n\n");
}

// -----------------------------------------------
// IMPORTS
// -----------------------------------------------

function generateImports(model: SchemaModel): string {
  const pgCoreImports = new Set<string>();
  pgCoreImports.add("pgTable");

  for (const table of model.tables) {
    for (const column of table.columns) {
      pgCoreImports.add(resolveImportName(column.type));
    }
  }

  const lines: string[] = [];
  lines.push(
    `import { ${[...pgCoreImports].sort().join(", ")} } from "drizzle-orm/pg-core";`,
  );

  if (model.relations.length > 0) {
    lines.push(`import { relations } from "drizzle-orm";`);
  }

  return lines.join("\n");
}

function resolveImportName(type: DrizzleColumnType): string {
  if (typeof type === "object") return "varchar";
  return type;
}

// -----------------------------------------------
// TABLE
// -----------------------------------------------

function generateTable(table: Table): string {
  const columns = table.columns
    .map((col) => `  ${col.name}: ${generateColumn(col)}`)
    .join(",\n");

  return `export const ${table.name} = pgTable("${table.name}", {\n${columns},\n});`;
}

// -----------------------------------------------
// COLUMN
// -----------------------------------------------

function generateColumn(col: Column): string {
  let chain = `${resolveColumnType(col)}("${col.name}")`;

  if (col.primaryKey) {
    chain += `.primaryKey()`;
  }

  if (!col.nullable && !col.primaryKey) {
    chain += `.notNull()`;
  }

  if (col.unique && !col.primaryKey) {
    chain += `.unique()`;
  }

  if (col.default !== undefined) {
    chain += generateDefault(col);
  }

  if (col.references !== undefined) {
    chain += `.references(() => ${col.references.tableName}.${col.references.columnName})`;
  }

  return chain;
}

function resolveColumnType(col: Column): string {
  if (typeof col.type === "object" && col.type.kind === "varchar") {
    return `varchar`;
  }
  return col.type as string;
}

function generateDefault(col: Column): string {
  const def = col.default;

  if (def === "now") return `.defaultNow()`;
  if (typeof def === "boolean") return `.default(${def})`;
  if (typeof def === "number") return `.default(${def})`;
  if (typeof def === "string") return `.default("${def}")`;

  return "";
}

// -----------------------------------------------
// RELATIONS
// -----------------------------------------------

function generateRelations(table: Table, model: SchemaModel): string | null {
  const outgoing = model.relations.filter((r) => r.fromTableId === table.id);
  const incoming = model.relations.filter((r) => r.toTableId === table.id);

  if (outgoing.length === 0 && incoming.length === 0) return null;

  const entries: string[] = [];

  for (const rel of outgoing) {
    if (rel.type === "one-to-many") {
      entries.push(`  ${rel.toTableName}: many(${rel.toTableName})`);
    }

    if (rel.type === "one-to-one") {
      entries.push(
        `  ${rel.toTableName}: one(${rel.toTableName}, {\n` +
          `    fields: [${table.name}.${rel.fromColumnName}],\n` +
          `    references: [${rel.toTableName}.${rel.toColumnName}],\n` +
          `  })`,
      );
    }
  }

  for (const rel of incoming) {
    if (rel.type === "one-to-many") {
      entries.push(
        `  ${rel.fromTableName}: one(${rel.fromTableName}, {\n` +
          `    fields: [${table.name}.${rel.toColumnName}],\n` +
          `    references: [${rel.fromTableName}.${rel.fromColumnName}],\n` +
          `  })`,
      );
    }

    if (rel.type === "one-to-one") {
      entries.push(
        `  ${rel.fromTableName}: one(${rel.fromTableName}, {\n` +
          `    fields: [${table.name}.${rel.toColumnName}],\n` +
          `    references: [${rel.fromTableName}.${rel.fromColumnName}],\n` +
          `  })`,
      );
    }
  }

  const hasManyHelper = outgoing.some((r) => r.type === "one-to-many")
    ? "many"
    : null;
  const hasOneHelper =
    outgoing.some((r) => r.type === "one-to-one") || incoming.length > 0
      ? "one"
      : null;

  const helpers = [hasOneHelper, hasManyHelper].filter(Boolean).join(", ");

  return (
    `export const ${table.name}Relations = relations(${table.name}, ({ ${helpers} }) => ({\n` +
    `${entries.join(",\n")},\n` +
    `}));`
  );
}
