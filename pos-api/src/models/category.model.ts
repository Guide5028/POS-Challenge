import { pgTable, serial, varchar, text, boolean } from "drizzle-orm/pg-core";

export const category = pgTable("category", {
  categoryId: serial("category_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),

  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});
