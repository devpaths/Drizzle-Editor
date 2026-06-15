import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const schemas = pgTable("schemas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  model: jsonb("model").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
