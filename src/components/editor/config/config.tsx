import type { languages } from "monaco-editor";

export const drizzleConfig: languages.LanguageConfiguration = {
  comments: { lineComment: "//" },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  folding: {
    offSide: true,
  },
};

// Define Drizzle ORM-specific keywords
export const drizzleLanguage: languages.IMonarchLanguage = {
  keywords: [
    "primaryKey",
    "notNull",
    "unique",
    "default",
    "serial",
    "varchar",
    "integer",
    "text",
    "real",
    "boolean",
    "date",
    "time",
    "bigint",
    "json",
    "foreignKey",
    "references",
    "autoincrement",
  ],

  operators: ["=", ":", "!", "?", "[]", ".", "=>"],

  symbols: /[=!?:.]+/,

  tokenizer: {
    root: [
      // Keywords and Type Keywords
      [
        /[a-z_][\w$]*/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "identifier",
          },
        },
      ],

      // Types and Function Names
      [
        /[A-Z][\w$]*/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "type.identifier",
          },
        },
      ],

      // Strings
      [/"([^"\\]|\\.)*$/, "string.invalid"], // Non-terminated string
      [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
      [/'([^'\\]|\\.)*$/, "string.invalid"], // Non-terminated string
      [/'/, { token: "string.quote", bracket: "@open", next: "@string" }],

      // Numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
      [/0[xX][0-9a-fA-F]+/, "number.hex"],
      [/\d+/, "number"],

      // Delimiters and Operators
      [/[{}()[\]]/, "@brackets"],
      [/@symbols/, { cases: { "@operators": "operator", "@default": "" } }],

      // Annotations (e.g., `pgTable`, `sqliteTable`)
      [/@*\s*[a-zA-Z_$][\w$]*/, { token: "annotation" }],
    ],

    string: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],
  },
};
