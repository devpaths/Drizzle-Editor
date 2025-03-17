import { Project, Node, SyntaxKind } from "ts-morph";

interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string | number | boolean | null;
}

interface Table {
  name: string;
  columns: Column[];
}

interface Relation {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: "ONE_TO_MANY" | "ONE_TO_ONE";
}

interface EnumType {
  name: string;
  values: string[];
}

interface DrizzleSchema {
  tables: Table[];
  relations: Relation[];
  enums: EnumType[];
}

// Function to parse column type and extract constraints
function parseColumn(node: Node): Column {
  let columnType = "unknown";
  let isPrimaryKey = false;
  let isNullable = false;
  let isUnique = false;
  let defaultValue: string | number | boolean | null = null;

  if (Node.isCallExpression(node)) {
    const functionName = node.getExpression().getText();
    const drizzleTypes: Record<string, string> = {
      serial: "Int",
      text: "String",
      boolean: "Boolean",
      varchar: "String",
      integer: "Int",
      timestamp: "DateTime",
    };

    columnType = drizzleTypes[functionName] || functionName;

    node.getArguments().forEach((arg) => {
      const argText = arg.getText();
      if (argText.includes(".primaryKey")) isPrimaryKey = true;
      if (argText.includes(".notNull")) isNullable = false;
      if (argText.includes(".nullable")) isNullable = true;
      if (argText.includes(".unique")) isUnique = true;
      if (argText.includes(".default(")) {
        if (argText.includes(".default(")) {
          const defaultMatch = argText.match(/\.default\((.*)\)/);
          defaultValue =
            defaultMatch && defaultMatch[1]
              ? defaultMatch[1].replace(/['"]/g, "")
              : null;
        }
      }
    });
  }

  return {
    name: "",
    type: columnType,
    isPrimaryKey,
    isNullable,
    isUnique,
    defaultValue,
  };
}

// Parse Drizzle ORM Schema from Code
export function parseDrizzleSchemaFromCode(code: string): DrizzleSchema {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile("schema.ts", code, {
    overwrite: true,
  });

  const drizzleSchema: DrizzleSchema = { tables: [], relations: [], enums: [] };

  // Extract Enums
  sourceFile.forEachDescendant((node) => {
    if (
      Node.isCallExpression(node) &&
      node.getExpression().getText() === "pgEnum"
    ) {
      const args = node.getArguments();
      if (args.length >= 2 && Node.isStringLiteral(args[0])) {
        const enumName = args[0].getLiteralValue();
        const enumValues =
          args[1]
            ?.asKind(SyntaxKind.ArrayLiteralExpression)
            ?.getElements()
            .map((e) => e.getText().replace(/['"]/g, "")) || [];
        drizzleSchema.enums.push({ name: enumName, values: enumValues });
      }
    }
  });

  // Extract Tables and Columns
  sourceFile.forEachDescendant((node) => {
    if (
      Node.isCallExpression(node) &&
      node.getExpression().getText() === "pgTable"
    ) {
      const args = node.getArguments();
      if (
        args.length >= 2 &&
        Node.isStringLiteral(args[0]) &&
        Node.isObjectLiteralExpression(args[1])
      ) {
        const tableName = args[0].getLiteralValue();
        const columnObject = args[1];
        const columns: Column[] = [];

        columnObject.getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const columnName = prop.getName();
            const columnValue = prop.getInitializer();

            if (columnValue) {
              const columnData = parseColumn(columnValue);
              columnData.name = columnName;
              columns.push(columnData);
            }
          }
        });

        drizzleSchema.tables.push({ name: tableName, columns });
      }
    }
  });

  // Extract Relations
  sourceFile.forEachDescendant((node) => {
    if (
      Node.isCallExpression(node) &&
      node.getExpression().getText().includes(".references")
    ) {
      const args = node.getArguments();
      if (args.length >= 1 && Node.isArrowFunction(args[0])) {
        const relationText = args[0].getText();
        const match = relationText.match(/=>\s*(\w+)\.(\w+)/);
        if (match) {
          const [_, toTable, toColumn] = match;
          const ancestor = node.getFirstAncestorByKind(
            SyntaxKind.CallExpression,
          );
          if (ancestor) {
            const fromTable = ancestor
              .getArguments()[0]
              ?.getText()
              ?.replace(/['"]/g, "");
            const fromColumn = node
              .getParentIfKind(SyntaxKind.PropertyAssignment)
              ?.getName();

            if (fromTable && fromColumn && toTable && toColumn) {
              drizzleSchema.relations.push({
                fromTable,
                fromColumn,
                toTable,
                toColumn,
                type: "ONE_TO_MANY",
              });
            }
          }
        }
      }
    }
  });

  return drizzleSchema;
}
