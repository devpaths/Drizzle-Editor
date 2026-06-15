import * as parser from "@babel/parser";
import type {
  Statement,
  VariableDeclarator,
  Expression,
  ObjectProperty,
  CallExpression,
  ArgumentPlaceholder,
  SpreadElement,
} from "@babel/types";

import type {
  ParseResult,
  Table,
  Column,
  DrizzleColumnType,
  Relation,
} from "./model";
import { deriveRelations } from "./relations";

// -----------------------------------------------
// ENTRY POINT
// -----------------------------------------------

export function parseSchema(code: string): ParseResult {
  if (code.trim() === "") {
    return { ok: true, model: { tables: [], relations: [] } };
  }

  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });

    const tables: Table[] = [];

    for (const statement of ast.program.body) {
      const table = tryExtractTable(statement);
      if (table) tables.push(table);
    }

    const relations = deriveRelations(tables);
    return { ok: true, model: { tables, relations } };
  } catch (err) {
    return {
      ok: false,
      errors: [
        { message: err instanceof Error ? err.message : "Unknown parse error" },
      ],
    };
  }
}

// -----------------------------------------------
// TABLE EXTRACTION
// export const users = pgTable("users", { ... })
// -----------------------------------------------

function tryExtractTable(statement: Statement): Table | null {
  const declarator = getVariableDeclarator(statement);
  if (!declarator) return null;

  const init = declarator.init;
  if (!init || init.type !== "CallExpression") return null;

  const callee = init.callee;
  if (callee.type !== "Identifier" || callee.name !== "pgTable") {
    return null;
  }

  const [nameArg, columnsArg] = init.arguments;

  if (!nameArg || nameArg.type !== "StringLiteral") return null;
  if (!columnsArg || columnsArg.type !== "ObjectExpression") return null;

  const tableName = nameArg.value;
  const columns: Column[] = [];

  for (const prop of columnsArg.properties) {
    if (prop.type !== "ObjectProperty") continue;

    const columnName = getPropertyName(prop);
    if (!columnName) continue;

    const column = extractColumn(columnName, prop.value as Expression);
    if (column) columns.push(column);
  }

  return {
    id: tableName,
    name: tableName,
    columns,
  };
}

function getVariableDeclarator(
  statement: Statement,
): VariableDeclarator | null {
  let declNode: Statement = statement;

  if (statement.type === "ExportNamedDeclaration" && statement.declaration) {
    if (statement.declaration.type !== "VariableDeclaration") return null;
    declNode = statement.declaration;
  }

  if (declNode.type !== "VariableDeclaration") return null;

  return declNode.declarations[0] ?? null;
}

function getPropertyName(prop: ObjectProperty): string | null {
  if (prop.key.type === "Identifier") return prop.key.name;
  if (prop.key.type === "StringLiteral") return prop.key.value;
  return null;
}

// -----------------------------------------------
// COLUMN EXTRACTION
// -----------------------------------------------

function extractColumn(columnName: string, expr: Expression): Column | null {
  const chain = unwrapChain(expr);
  if (!chain) return null;

  const { baseType, baseArgs, modifiers } = chain;

  const column: Column = {
    id: columnName,
    name: columnName,
    type: resolveColumnType(baseType, baseArgs),
    primaryKey: false,
    nullable: true,
  };

  for (const mod of modifiers) {
    switch (mod.name) {
      case "primaryKey":
        column.primaryKey = true;
        column.nullable = false;
        break;

      case "notNull":
        column.nullable = false;
        break;

      case "unique":
        column.unique = true;
        break;

      case "default":
        column.default = extractDefaultValue(mod.args);
        break;

      case "defaultNow":
        column.default = "now";
        break;

      case "references":
        column.references = extractReference(mod.args);
        break;
    }
  }

  return column;
}

// -----------------------------------------------
// CHAIN UNWRAPPING
// -----------------------------------------------

type CallArg = Expression | SpreadElement | ArgumentPlaceholder;

interface ChainModifier {
  name: string;
  args: CallArg[];
}

interface UnwrappedChain {
  baseType: string;
  baseArgs: CallArg[];
  modifiers: ChainModifier[];
}

function unwrapChain(expr: Expression): UnwrappedChain | null {
  const modifiers: ChainModifier[] = [];
  let current: Expression = expr;

  while (
    current.type === "CallExpression" &&
    current.callee.type === "MemberExpression"
  ) {
    const member = current.callee;
    const methodName =
      member.property.type === "Identifier" ? member.property.name : null;

    if (!methodName) return null;

    modifiers.unshift({ name: methodName, args: current.arguments });
    current = member.object as Expression;
  }

  if (current.type !== "CallExpression") return null;
  if (current.callee.type !== "Identifier") return null;

  return {
    baseType: current.callee.name,
    baseArgs: current.arguments,
    modifiers,
  };
}

// -----------------------------------------------
// TYPE RESOLUTION
// -----------------------------------------------

function resolveColumnType(
  baseType: string,
  baseArgs: CallArg[],
): DrizzleColumnType {
  if (baseType === "varchar") {
    const lengthArg = baseArgs[1];
    let length = 255;

    if (lengthArg && lengthArg.type === "ObjectExpression") {
      for (const prop of lengthArg.properties) {
        if (
          prop.type === "ObjectProperty" &&
          prop.key.type === "Identifier" &&
          prop.key.name === "length" &&
          prop.value.type === "NumericLiteral"
        ) {
          length = prop.value.value;
        }
      }
    }

    return { kind: "varchar", length };
  }

  const validTypes: DrizzleColumnType[] = [
    "serial",
    "integer",
    "text",
    "boolean",
    "timestamp",
    "uuid",
  ];

  if (validTypes.includes(baseType as DrizzleColumnType)) {
    return baseType as DrizzleColumnType;
  }

  return "text";
}

// -----------------------------------------------
// .default(value)
// -----------------------------------------------

function extractDefaultValue(
  args: CallArg[],
): string | number | boolean | undefined {
  const arg = args[0];
  if (!arg) return undefined;

  if (arg.type === "StringLiteral") return arg.value;
  if (arg.type === "NumericLiteral") return arg.value;
  if (arg.type === "BooleanLiteral") return arg.value;

  return undefined;
}

// -----------------------------------------------
// .references(() => users.id)
// -----------------------------------------------

function extractReference(args: CallArg[]): Column["references"] | undefined {
  const arg = args[0];
  if (!arg || arg.type !== "ArrowFunctionExpression") return undefined;

  const body = arg.body;
  if (body.type !== "MemberExpression") return undefined;

  const object = body.object;
  const property = body.property;

  if (object.type !== "Identifier") return undefined;
  if (property.type !== "Identifier") return undefined;

  return {
    tableId: object.name,
    tableName: object.name,
    columnId: property.name,
    columnName: property.name,
  };
}

// -----------------------------------------------
// RELATIONS — stub for now
// -----------------------------------------------

function tryExtractRelations(_statement: Statement): Relation[] | null {
  return null;
}

function deriveRelationsFromReferences(tables: Table[]): Relation[] {
  const relations: Relation[] = [];

  for (const table of tables) {
    for (const column of table.columns) {
      if (!column.references) continue;

      relations.push({
        id: `${table.id}_${column.id}_${column.references.tableId}`,
        fromTableId: column.references.tableId,
        fromTableName: column.references.tableName,
        toTableId: table.id,
        toTableName: table.name,
        type: "one-to-many", // FK on the "many" side by default
        fromColumnId: column.references.columnId,
        fromColumnName: column.references.columnName,
        toColumnId: column.id,
        toColumnName: column.name,
      });
    }
  }

  return relations;
}
