import { Project, Node } from 'ts-morph';
import type { Type } from 'ts-morph';
import fs from 'fs';

interface Column {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue?: string | number | boolean | null;

}

interface Table {
  name: string;
  columns: Column[];
}

interface DrizzleSchema {
  tables: Table[];
}

function parseColumnType(type: Type): string {
  const typeText = type.getText();

  if (typeText.endsWith('[]')) {
    return `${typeText} (Array)`;
  }

  if (typeText === 'Date') {
    return 'Date';
  }

  const primitiveTypes = ['string', 'number', 'boolean', 'undefined', 'null'];
  if (primitiveTypes.includes(typeText)) {
    return typeText;
  }

  // Check for enum type correctly
  const symbol = type.getSymbol();
  if (symbol) {
    const declarations = symbol.getDeclarations();
    if (declarations && declarations.length > 0) {
      const declaration = declarations[0];
      if (Node.isEnumDeclaration(declaration)) {
        // Correctly access enum members
        const enumMembers = declaration.getMembers();
        const enumValues = enumMembers.map(member => member.getName());
        return `Enum(<${enumValues.join(', ')}>)`;
      }
    }
  }

  // For classes and interfaces, use the right method to check
  if (type.isClassOrInterface()) {
    const symbol = type.getSymbol();
    if (symbol) {
      return `${type.isInterface() ? 'Interface' : 'Class'}<${symbol.getName()}>`;
    }
  }

  return typeText;
}

export function parseDrizzleMetadata(filePath: string): DrizzleSchema {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(filePath);
  const drizzleSchema: DrizzleSchema = { tables: [] };

  // Process classes (table definitions)
  const classes = sourceFile.getClasses();
  classes.forEach((tableClass) => {
    const tableName = tableClass.getName();
    if (!tableName) return; // Skip unnamed classes

    const columns: Column[] = [];

    // Process properties (columns)
    const properties = tableClass.getProperties();
    properties.forEach((property) => {
      const columnName = property.getName();
      const propertyType = property.getType();
      const columnType = parseColumnType(propertyType);
      
      // Better nullable check
      const isNullable = property.hasQuestionToken() || 
                         propertyType.isNullable() || 
                         propertyType.isUndefined();
      
      // Get initializer if available
      let defaultValue = undefined;
      const initializer = property.getInitializer();
      if (initializer) {
        defaultValue = initializer.getText();
      }

      columns.push({
        name: columnName,
        type: columnType,
        isNullable,
        defaultValue,
      });
    });

    if (columns.length > 0) {
      drizzleSchema.tables.push({
        name: tableName,
        columns,
      });
    }
  });

  // Process interfaces
  const interfaces = sourceFile.getInterfaces();
  interfaces.forEach((interfaceDecl) => {
    const interfaceName = interfaceDecl.getName();
    if (!interfaceName) return; // Skip unnamed interfaces

    const columns: Column[] = [];

    // Process properties
    const properties = interfaceDecl.getProperties();
    properties.forEach((property) => {
      const columnName = property.getName();
      const propertyType = property.getType();
      const columnType = parseColumnType(propertyType);
      
      // Better nullable check for interface properties
      const isNullable = property.hasQuestionToken() || 
                         propertyType.isNullable() || 
                         propertyType.isUndefined();
      
      columns.push({
        name: columnName,
        type: columnType,
        isNullable,
      });
    });

    if (columns.length > 0) {
      drizzleSchema.tables.push({
        name: interfaceName,
        columns,
      });
    }
  });

  return drizzleSchema;
}

/**
 * Writes the parsed schema to a file in JSON format
 * @param schema Drizzle schema object to be written to file
 * @param outputPath Path where the JSON file should be saved
 */
export function saveSchemaToJson(schema: DrizzleSchema, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2), 'utf8');
}

// Example usage (wrapped in try-catch for error handling)
try {
  const drizzleMetadata = parseDrizzleMetadata('src/components/Parser/drizzleSchema.ts');
  console.log(JSON.stringify(drizzleMetadata, null, 2));
  
  // Optionally, save the schema to a file
  saveSchemaToJson(drizzleMetadata, 'outputSchema.json');
} catch (error) {
  console.error('Error parsing Drizzle schema:', error);
}